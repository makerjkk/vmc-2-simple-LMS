-- Migration: LMS 인덱스 및 성능 최적화
-- 자주 조회되는 컬럼들에 대한 인덱스 생성

-- 1. Users 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

COMMENT ON INDEX idx_users_role IS '사용자 역할별 조회 최적화';
COMMENT ON INDEX idx_users_email IS '이메일 기반 사용자 검색 최적화';

-- 2. Categories 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

COMMENT ON INDEX idx_categories_active IS '활성 카테고리 조회 최적화';

-- 3. Courses 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON public.courses(difficulty);
CREATE INDEX IF NOT EXISTS idx_courses_status_created ON public.courses(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_enrollment_count ON public.courses(enrollment_count DESC);
CREATE INDEX IF NOT EXISTS idx_courses_rating ON public.courses(average_rating DESC);

COMMENT ON INDEX idx_courses_instructor IS '강사별 코스 조회 최적화';
COMMENT ON INDEX idx_courses_status_created IS '상태별 최신 코스 정렬 최적화';
COMMENT ON INDEX idx_courses_enrollment_count IS '인기 코스 정렬 최적화';

-- 4. Enrollments 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_enrollments_learner ON public.enrollments(learner_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON public.enrollments(is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_learner_active ON public.enrollments(learner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_active ON public.enrollments(course_id, is_active);

COMMENT ON INDEX idx_enrollments_learner_active IS '학습자의 활성 수강 목록 조회 최적화';
COMMENT ON INDEX idx_enrollments_course_active IS '코스의 활성 수강생 조회 최적화';

-- 5. Assignments 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_assignments_course ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_course_status ON public.assignments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_assignments_status_due ON public.assignments(status, due_date);

COMMENT ON INDEX idx_assignments_course_status IS '코스별 과제 상태 조회 최적화';
COMMENT ON INDEX idx_assignments_status_due IS '상태별 마감일 정렬 최적화';

-- 6. Submissions 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_learner ON public.submissions(learner_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_graded_by ON public.submissions(graded_by);
CREATE INDEX IF NOT EXISTS idx_submissions_learner_status ON public.submissions(learner_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_status ON public.submissions(assignment_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_graded_at ON public.submissions(graded_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON public.submissions(submitted_at DESC);

COMMENT ON INDEX idx_submissions_learner_status IS '학습자별 제출물 상태 조회 최적화';
COMMENT ON INDEX idx_submissions_assignment_status IS '과제별 제출물 상태 조회 최적화';

-- 7. Reports 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_type_id ON public.reports(reported_type, reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_handled_by ON public.reports(handled_by);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

COMMENT ON INDEX idx_reports_type_id IS '신고 대상별 조회 최적화';
COMMENT ON INDEX idx_reports_created_at IS '최신 신고 순 정렬 최적화';

-- 8. 복합 인덱스 (성능 최적화를 위한 특별한 조합들)

-- 학습자 대시보드용: 내 코스와 과제 정보
CREATE INDEX IF NOT EXISTS idx_dashboard_learner_courses 
ON public.enrollments(learner_id, is_active, course_id);

-- 강사 대시보드용: 내 코스와 채점 대기 정보
CREATE INDEX IF NOT EXISTS idx_dashboard_instructor_submissions 
ON public.submissions(assignment_id, status) 
WHERE status = 'submitted';

-- 마감 임박 과제 조회용
CREATE INDEX IF NOT EXISTS idx_assignments_upcoming_due 
ON public.assignments(status, due_date) 
WHERE status = 'published';

-- 최근 피드백 조회용
CREATE INDEX IF NOT EXISTS idx_submissions_recent_graded 
ON public.submissions(learner_id, graded_at DESC, status) 
WHERE status = 'graded';

-- 코스 검색 및 필터링용
CREATE INDEX IF NOT EXISTS idx_courses_search 
ON public.courses(status, category_id, difficulty, created_at DESC) 
WHERE status = 'published';

COMMENT ON INDEX idx_dashboard_learner_courses IS '학습자 대시보드 성능 최적화';
COMMENT ON INDEX idx_dashboard_instructor_submissions IS '강사 대시보드 채점 대기 조회 최적화';
COMMENT ON INDEX idx_assignments_upcoming_due IS '마감 임박 과제 조회 최적화';
COMMENT ON INDEX idx_submissions_recent_graded IS '최근 피드백 조회 최적화';
COMMENT ON INDEX idx_courses_search IS '코스 검색 및 필터링 최적화';
