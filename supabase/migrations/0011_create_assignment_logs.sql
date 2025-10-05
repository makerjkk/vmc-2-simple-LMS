-- Migration: Assignment 상태 변경 로그 테이블 생성
-- Assignment 상태 변경 이력을 추적하기 위한 로그 테이블

-- 1. Assignment Logs 테이블 생성
CREATE TABLE IF NOT EXISTS public.assignment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  previous_status VARCHAR(20) NOT NULL CHECK (previous_status IN ('draft', 'published', 'closed')),
  new_status VARCHAR(20) NOT NULL CHECK (new_status IN ('draft', 'published', 'closed')),
  change_reason VARCHAR(50) NOT NULL CHECK (change_reason IN ('manual', 'auto_close', 'system')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_assignment_logs_assignment_id ON public.assignment_logs(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_logs_changed_by ON public.assignment_logs(changed_by);
CREATE INDEX IF NOT EXISTS idx_assignment_logs_created_at ON public.assignment_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_assignment_logs_change_reason ON public.assignment_logs(change_reason);

-- 3. 복합 인덱스 (자주 사용되는 쿼리 패턴 최적화)
CREATE INDEX IF NOT EXISTS idx_assignment_logs_assignment_created ON public.assignment_logs(assignment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignment_logs_changed_by_created ON public.assignment_logs(changed_by, created_at DESC);

-- 4. 테이블 및 컬럼 코멘트 추가
COMMENT ON TABLE public.assignment_logs IS 'Assignment 상태 변경 이력 및 감사 추적 테이블';
COMMENT ON COLUMN public.assignment_logs.assignment_id IS '상태가 변경된 Assignment ID';
COMMENT ON COLUMN public.assignment_logs.changed_by IS '상태를 변경한 사용자 ID (강사 또는 시스템)';
COMMENT ON COLUMN public.assignment_logs.previous_status IS '변경 전 상태: draft, published, closed';
COMMENT ON COLUMN public.assignment_logs.new_status IS '변경 후 상태: draft, published, closed';
COMMENT ON COLUMN public.assignment_logs.change_reason IS '변경 사유: manual(수동), auto_close(자동마감), system(시스템)';
COMMENT ON COLUMN public.assignment_logs.metadata IS '추가 메타데이터 (JSON 형태) - 사용자 에이전트, IP 등';
COMMENT ON COLUMN public.assignment_logs.created_at IS '상태 변경 발생 일시';

-- 5. RLS 비활성화 (개발 편의성을 위해)
ALTER TABLE public.assignment_logs DISABLE ROW LEVEL SECURITY;

-- 6. updated_at 트리거 적용 (일관성 유지)
-- assignment_logs는 변경되지 않는 로그 테이블이므로 updated_at 컬럼이 없음
-- 필요시 향후 추가 가능

-- 7. 스케줄러 상태 추적을 위한 시스템 테이블 생성
CREATE TABLE IF NOT EXISTS public.scheduler_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduler_name VARCHAR(50) NOT NULL UNIQUE,
  last_run_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT,
  is_running BOOLEAN NOT NULL DEFAULT false,
  run_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. 스케줄러 상태 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_scheduler_status_name ON public.scheduler_status(scheduler_name);
CREATE INDEX IF NOT EXISTS idx_scheduler_status_last_run ON public.scheduler_status(last_run_at);

-- 9. 스케줄러 상태 테이블 코멘트
COMMENT ON TABLE public.scheduler_status IS '스케줄러 실행 상태 및 통계 추적 테이블';
COMMENT ON COLUMN public.scheduler_status.scheduler_name IS '스케줄러 이름 (예: auto_close_assignments)';
COMMENT ON COLUMN public.scheduler_status.last_run_at IS '마지막 실행 시간';
COMMENT ON COLUMN public.scheduler_status.last_success_at IS '마지막 성공 실행 시간';
COMMENT ON COLUMN public.scheduler_status.last_error_at IS '마지막 오류 발생 시간';
COMMENT ON COLUMN public.scheduler_status.is_running IS '현재 실행 중 여부';

-- 10. 스케줄러 상태 테이블 RLS 비활성화
ALTER TABLE public.scheduler_status DISABLE ROW LEVEL SECURITY;

-- 11. 스케줄러 상태 테이블 updated_at 트리거 적용
CREATE TRIGGER update_scheduler_status_updated_at 
  BEFORE UPDATE ON public.scheduler_status 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 12. 초기 스케줄러 상태 데이터 삽입
INSERT INTO public.scheduler_status (scheduler_name) 
VALUES ('auto_close_assignments')
ON CONFLICT (scheduler_name) DO NOTHING;
