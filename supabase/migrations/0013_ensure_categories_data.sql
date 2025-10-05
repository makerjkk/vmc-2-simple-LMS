-- Migration: 카테고리 데이터 확실히 삽입
-- 기본 카테고리가 없는 경우를 대비하여 다시 삽입

-- 기본 카테고리 데이터 삽입 (중복 방지)
INSERT INTO public.categories (name, description, is_active) VALUES
('프로그래밍', '소프트웨어 개발 관련 코스', true),
('데이터 사이언스', '데이터 분석 및 머신러닝 관련 코스', true),
('디자인', 'UI/UX 및 그래픽 디자인 관련 코스', true),
('비즈니스', '경영 및 마케팅 관련 코스', true),
('언어', '외국어 학습 관련 코스', true)
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 카테고리 데이터 확인을 위한 코멘트
COMMENT ON TABLE public.categories IS '코스 카테고리 관리 테이블 - 기본 5개 카테고리 포함';
