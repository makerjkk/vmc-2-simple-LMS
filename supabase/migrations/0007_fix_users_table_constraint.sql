-- Migration: Users 테이블 외래키 제약조건 수정
-- 개발/테스트 편의성을 위한 임시 수정

-- 1. 기존 users 테이블 제거 (데이터가 있다면 백업 필요)
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Users 테이블 재생성 (외래키 제약조건 제거)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('learner', 'instructor', 'operator')),
  terms_agreed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'LMS 사용자 정보 및 역할 관리 테이블 (개발용 - 독립적 ID)';
COMMENT ON COLUMN public.users.id IS '독립적인 사용자 ID (UUID)';
COMMENT ON COLUMN public.users.auth_user_id IS 'Supabase Auth 사용자 ID (선택적 연결)';
COMMENT ON COLUMN public.users.role IS '사용자 역할: learner(학습자), instructor(강사), operator(운영자)';

-- 3. 다른 테이블들도 users 테이블 참조 관계 재생성
-- Courses 테이블 수정
ALTER TABLE IF EXISTS public.courses 
DROP CONSTRAINT IF EXISTS courses_instructor_id_fkey;

ALTER TABLE public.courses 
ADD CONSTRAINT courses_instructor_id_fkey 
FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Enrollments 테이블 수정  
ALTER TABLE IF EXISTS public.enrollments 
DROP CONSTRAINT IF EXISTS enrollments_learner_id_fkey;

ALTER TABLE public.enrollments 
ADD CONSTRAINT enrollments_learner_id_fkey 
FOREIGN KEY (learner_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Submissions 테이블 수정
ALTER TABLE IF EXISTS public.submissions 
DROP CONSTRAINT IF EXISTS submissions_learner_id_fkey,
DROP CONSTRAINT IF EXISTS submissions_graded_by_fkey;

ALTER TABLE public.submissions 
ADD CONSTRAINT submissions_learner_id_fkey 
FOREIGN KEY (learner_id) REFERENCES public.users(id) ON DELETE CASCADE,
ADD CONSTRAINT submissions_graded_by_fkey 
FOREIGN KEY (graded_by) REFERENCES public.users(id);

-- Reports 테이블 수정
ALTER TABLE IF EXISTS public.reports 
DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey,
DROP CONSTRAINT IF EXISTS reports_handled_by_fkey;

ALTER TABLE public.reports 
ADD CONSTRAINT reports_reporter_id_fkey 
FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE,
ADD CONSTRAINT reports_handled_by_fkey 
FOREIGN KEY (handled_by) REFERENCES public.users(id);

-- 4. RLS 비활성화
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- 5. 인덱스 재생성
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- 6. updated_at 트리거 재적용
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
