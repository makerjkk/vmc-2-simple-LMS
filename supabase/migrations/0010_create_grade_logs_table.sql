-- Migration: 채점 이력 테이블 생성
-- 채점 활동에 대한 감사 추적을 위한 테이블

-- 1. Grade Logs 테이블 생성
CREATE TABLE IF NOT EXISTS public.grade_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  grader_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('grade', 'request_resubmission')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_grade_logs_submission_id ON public.grade_logs(submission_id);
CREATE INDEX IF NOT EXISTS idx_grade_logs_grader_id ON public.grade_logs(grader_id);
CREATE INDEX IF NOT EXISTS idx_grade_logs_created_at ON public.grade_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_grade_logs_action ON public.grade_logs(action);

-- 3. 테이블 및 컬럼 코멘트 추가
COMMENT ON TABLE public.grade_logs IS '채점 이력 및 감사 추적 테이블';
COMMENT ON COLUMN public.grade_logs.submission_id IS '채점된 제출물 ID';
COMMENT ON COLUMN public.grade_logs.grader_id IS '채점자(강사) ID';
COMMENT ON COLUMN public.grade_logs.action IS '채점 액션: grade(채점완료), request_resubmission(재제출요청)';
COMMENT ON COLUMN public.grade_logs.score IS '채점 점수 (0-100, 재제출 요청 시 NULL)';
COMMENT ON COLUMN public.grade_logs.feedback IS '채점 피드백 (필수)';
COMMENT ON COLUMN public.grade_logs.created_at IS '채점 수행 일시';

-- 4. RLS 비활성화 (개발 편의성을 위해)
ALTER TABLE public.grade_logs DISABLE ROW LEVEL SECURITY;

-- 5. updated_at 트리거 적용 (일관성 유지)
CREATE TRIGGER update_grade_logs_updated_at 
  BEFORE UPDATE ON public.grade_logs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
