-- Migration: LMS 트리거 및 함수 생성
-- 자동 업데이트, 비즈니스 룰 구현을 위한 트리거와 함수들

-- 1. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

COMMENT ON FUNCTION update_updated_at_column() IS 'updated_at 컬럼을 현재 시간으로 자동 업데이트하는 트리거 함수';

-- 2. 각 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON public.categories 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at 
  BEFORE UPDATE ON public.courses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at 
  BEFORE UPDATE ON public.assignments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at 
  BEFORE UPDATE ON public.submissions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at 
  BEFORE UPDATE ON public.reports 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 3. 지각 제출 자동 체크 함수
CREATE OR REPLACE FUNCTION check_late_submission()
RETURNS TRIGGER AS $$
DECLARE
  assignment_due_date TIMESTAMPTZ;
BEGIN
  -- 해당 과제의 마감일 조회
  SELECT due_date INTO assignment_due_date 
  FROM public.assignments 
  WHERE id = NEW.assignment_id;
  
  -- 제출 시간이 마감일을 넘었는지 확인
  IF NEW.submitted_at > assignment_due_date THEN
    NEW.is_late = true;
  ELSE
    NEW.is_late = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_late_submission() IS '과제 제출 시 지각 여부를 자동으로 판단하는 함수';

-- 4. 제출물 지각 체크 트리거
CREATE TRIGGER check_submission_late 
  BEFORE INSERT ON public.submissions 
  FOR EACH ROW 
  EXECUTE FUNCTION check_late_submission();

-- 5. 수강생 수 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT: 새로운 수강신청 (is_active = true인 경우)
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    UPDATE public.courses 
    SET enrollment_count = enrollment_count + 1 
    WHERE id = NEW.course_id;
    
  -- UPDATE: 수강 상태 변경
  ELSIF TG_OP = 'UPDATE' THEN
    -- 활성 → 비활성 (수강취소)
    IF OLD.is_active = true AND NEW.is_active = false THEN
      UPDATE public.courses 
      SET enrollment_count = enrollment_count - 1 
      WHERE id = NEW.course_id;
    -- 비활성 → 활성 (재수강)
    ELSIF OLD.is_active = false AND NEW.is_active = true THEN
      UPDATE public.courses 
      SET enrollment_count = enrollment_count + 1 
      WHERE id = NEW.course_id;
    END IF;
    
  -- DELETE: 수강 기록 완전 삭제 (활성 상태였던 경우)
  ELSIF TG_OP = 'DELETE' AND OLD.is_active = true THEN
    UPDATE public.courses 
    SET enrollment_count = enrollment_count - 1 
    WHERE id = OLD.course_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_enrollment_count() IS '수강신청/취소 시 코스의 수강생 수를 자동으로 업데이트하는 함수';

-- 6. 수강생 수 업데이트 트리거
CREATE TRIGGER update_course_enrollment_count
  AFTER INSERT OR UPDATE OR DELETE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_count();

-- 7. 과제 마감 자동 처리 함수
CREATE OR REPLACE FUNCTION auto_close_assignments()
RETURNS void AS $$
BEGIN
  -- 마감일이 지난 published 상태의 과제를 closed로 변경
  UPDATE public.assignments 
  SET status = 'closed', updated_at = NOW()
  WHERE status = 'published' 
    AND due_date < NOW();
    
  -- 처리된 과제 수 로그 (선택사항)
  RAISE NOTICE '마감된 과제 수: %', (
    SELECT COUNT(*) 
    FROM public.assignments 
    WHERE status = 'closed' 
      AND updated_at > NOW() - INTERVAL '1 minute'
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_close_assignments() IS '마감일이 지난 과제를 자동으로 closed 상태로 변경하는 함수 (배치 작업용)';

-- 8. 제출 권한 검증 함수
CREATE OR REPLACE FUNCTION validate_submission_permission()
RETURNS TRIGGER AS $$
DECLARE
  assignment_status VARCHAR(20);
  assignment_due_date TIMESTAMPTZ;
  allow_late BOOLEAN;
  is_enrolled BOOLEAN;
BEGIN
  -- 과제 정보 조회
  SELECT a.status, a.due_date, a.allow_late_submission
  INTO assignment_status, assignment_due_date, allow_late
  FROM public.assignments a
  WHERE a.id = NEW.assignment_id;
  
  -- 수강 여부 확인
  SELECT EXISTS(
    SELECT 1 
    FROM public.enrollments e
    JOIN public.assignments a ON e.course_id = a.course_id
    WHERE e.learner_id = NEW.learner_id 
      AND a.id = NEW.assignment_id 
      AND e.is_active = true
  ) INTO is_enrolled;
  
  -- 권한 검증
  IF NOT is_enrolled THEN
    RAISE EXCEPTION '수강하지 않은 코스의 과제에는 제출할 수 없습니다.';
  END IF;
  
  IF assignment_status != 'published' THEN
    RAISE EXCEPTION '게시되지 않은 과제에는 제출할 수 없습니다.';
  END IF;
  
  IF assignment_status = 'closed' THEN
    RAISE EXCEPTION '마감된 과제에는 제출할 수 없습니다.';
  END IF;
  
  -- 지각 제출 검증
  IF NEW.submitted_at > assignment_due_date AND NOT allow_late THEN
    RAISE EXCEPTION '지각 제출이 허용되지 않은 과제입니다.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_submission_permission() IS '과제 제출 시 권한 및 정책을 검증하는 함수';

-- 9. 제출 권한 검증 트리거
CREATE TRIGGER validate_submission_before_insert
  BEFORE INSERT ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION validate_submission_permission();
