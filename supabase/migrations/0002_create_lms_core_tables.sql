-- Migration: LMS 핵심 테이블 생성
-- 기존 예시 테이블 제거 및 LMS 핵심 테이블 생성

-- pgcrypto 확장 활성화 (UUID 생성용)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 기존 예시 테이블 제거
DROP TABLE IF EXISTS public.example;

-- 1. Users 테이블 - 사용자 기본 정보 및 역할 관리
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('learner', 'instructor', 'operator')),
  terms_agreed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'LMS 사용자 정보 및 역할 관리 테이블';
COMMENT ON COLUMN public.users.role IS '사용자 역할: learner(학습자), instructor(강사), operator(운영자)';

-- 2. Categories 테이블 - 코스 카테고리 관리
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.categories IS '코스 카테고리 관리 테이블';

-- 3. Courses 테이블 - 코스 정보 관리
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  curriculum TEXT,
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  enrollment_count INTEGER NOT NULL DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.courses IS '코스 정보 및 상태 관리 테이블';
COMMENT ON COLUMN public.courses.status IS '코스 상태: draft(초안), published(게시됨), archived(보관됨)';
COMMENT ON COLUMN public.courses.difficulty IS '난이도: beginner(초급), intermediate(중급), advanced(고급)';

-- RLS 비활성화 (개발 편의성을 위해)
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses DISABLE ROW LEVEL SECURITY;
