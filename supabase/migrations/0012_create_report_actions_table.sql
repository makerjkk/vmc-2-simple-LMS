-- Migration: 신고 처리 액션 로그 테이블 생성
-- 운영자의 신고 처리 액션을 기록하는 테이블

-- pgcrypto 확장 활성화 (UUID 생성용)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Report Actions 테이블 - 신고 처리 액션 로그
CREATE TABLE IF NOT EXISTS public.report_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('warn', 'invalidate_submission', 'restrict_account', 'dismiss')),
  action_details JSONB,
  performed_by UUID NOT NULL REFERENCES public.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.report_actions IS '신고 처리 액션 로그 테이블';
COMMENT ON COLUMN public.report_actions.action_type IS '액션 타입: warn(경고), invalidate_submission(제출물 무효화), restrict_account(계정 제한), dismiss(기각)';
COMMENT ON COLUMN public.report_actions.action_details IS '액션 상세 정보 (JSON 형태)';

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_report_actions_report_id ON public.report_actions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_actions_performed_by ON public.report_actions(performed_by);
CREATE INDEX IF NOT EXISTS idx_report_actions_action_type ON public.report_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_report_actions_performed_at ON public.report_actions(performed_at DESC);

COMMENT ON INDEX idx_report_actions_report_id IS '신고별 액션 조회 최적화';
COMMENT ON INDEX idx_report_actions_performed_by IS '운영자별 액션 조회 최적화';
COMMENT ON INDEX idx_report_actions_performed_at IS '최신 액션 순 정렬 최적화';

-- 3. updated_at 트리거 적용
CREATE TRIGGER update_report_actions_updated_at 
  BEFORE UPDATE ON public.report_actions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS 비활성화 (개발 편의성을 위해)
ALTER TABLE IF EXISTS public.report_actions DISABLE ROW LEVEL SECURITY;

-- 5. 기존 reports 테이블에 추가 인덱스 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reports_status_created_at ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_handled_by_handled_at ON public.reports(handled_by, handled_at DESC);

COMMENT ON INDEX idx_reports_status_created_at IS '상태별 최신 신고 순 조회 최적화';
COMMENT ON INDEX idx_reports_handled_by_handled_at IS '운영자별 처리 이력 조회 최적화';
