-- Migration: LMS 초기 데이터 시드
-- 기본 카테고리 및 테스트 데이터 생성

-- 1. 기본 카테고리 데이터 삽입
INSERT INTO public.categories (name, description) VALUES
('프로그래밍', '소프트웨어 개발 관련 코스'),
('데이터 사이언스', '데이터 분석 및 머신러닝 관련 코스'),
('디자인', 'UI/UX 및 그래픽 디자인 관련 코스'),
('비즈니스', '경영 및 마케팅 관련 코스'),
('언어', '외국어 학습 관련 코스')
ON CONFLICT (name) DO NOTHING;

-- 2. 테스트용 사용자 데이터 (개발/테스트 환경용)
-- 실제 운영 환경에서는 이 섹션을 제거하거나 주석 처리

-- 테스트용 강사 계정
INSERT INTO public.users (
  id, 
  email, 
  full_name, 
  phone, 
  role, 
  terms_agreed_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'instructor@test.com',
  '김강사',
  '010-1234-5678',
  'instructor',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 테스트용 학습자 계정
INSERT INTO public.users (
  id, 
  email, 
  full_name, 
  phone, 
  role, 
  terms_agreed_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'learner@test.com',
  '이학생',
  '010-9876-5432',
  'learner',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 테스트용 운영자 계정
INSERT INTO public.users (
  id, 
  email, 
  full_name, 
  phone, 
  role, 
  terms_agreed_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  'operator@test.com',
  '박운영',
  '010-1111-2222',
  'operator',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. 테스트용 코스 데이터
INSERT INTO public.courses (
  id,
  instructor_id,
  category_id,
  title,
  description,
  curriculum,
  difficulty,
  status
) VALUES (
  '660e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440001',
  (SELECT id FROM public.categories WHERE name = '프로그래밍' LIMIT 1),
  'Next.js 풀스택 개발 입문',
  'Next.js를 활용한 현대적인 웹 애플리케이션 개발을 배우는 코스입니다.',
  '1. Next.js 기초\n2. React 컴포넌트\n3. API Routes\n4. 데이터베이스 연동\n5. 배포',
  'beginner',
  'published'
) ON CONFLICT (id) DO NOTHING;

-- 4. 테스트용 과제 데이터
INSERT INTO public.assignments (
  id,
  course_id,
  title,
  description,
  due_date,
  score_weight,
  allow_late_submission,
  allow_resubmission,
  status
) VALUES (
  '770e8400-e29b-41d4-a716-446655440001',
  '660e8400-e29b-41d4-a716-446655440001',
  '첫 번째 Next.js 프로젝트',
  'Next.js를 사용하여 간단한 블로그 사이트를 만들어보세요.\n\n요구사항:\n- 홈페이지\n- 게시글 목록 페이지\n- 게시글 상세 페이지\n- 반응형 디자인',
  NOW() + INTERVAL '7 days',
  30.00,
  true,
  true,
  'published'
) ON CONFLICT (id) DO NOTHING;

-- 5. 테스트용 수강 데이터
INSERT INTO public.enrollments (
  learner_id,
  course_id,
  is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '660e8400-e29b-41d4-a716-446655440001',
  true
) ON CONFLICT (learner_id, course_id) DO NOTHING;

-- 6. 테스트용 제출물 데이터
INSERT INTO public.submissions (
  assignment_id,
  learner_id,
  content,
  link_url,
  status
) VALUES (
  '770e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  'Next.js를 사용하여 블로그 사이트를 완성했습니다. 홈페이지, 게시글 목록, 상세 페이지를 구현했고 Tailwind CSS로 반응형 디자인을 적용했습니다.',
  'https://github.com/test-user/nextjs-blog-project',
  'submitted'
) ON CONFLICT (assignment_id, learner_id) DO NOTHING;

-- 7. 데이터 정합성 확인을 위한 뷰 생성 (선택사항)
CREATE OR REPLACE VIEW public.lms_summary AS
SELECT 
  'users' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN role = 'learner' THEN 1 END) as learners,
  COUNT(CASE WHEN role = 'instructor' THEN 1 END) as instructors,
  COUNT(CASE WHEN role = 'operator' THEN 1 END) as operators
FROM public.users
UNION ALL
SELECT 
  'categories' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_categories,
  NULL as instructors,
  NULL as operators
FROM public.categories
UNION ALL
SELECT 
  'courses' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'published' THEN 1 END) as published_courses,
  COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_courses,
  COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_courses
FROM public.courses
UNION ALL
SELECT 
  'enrollments' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_enrollments,
  NULL as instructors,
  NULL as operators
FROM public.enrollments
UNION ALL
SELECT 
  'assignments' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'published' THEN 1 END) as published_assignments,
  COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_assignments,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_assignments
FROM public.assignments
UNION ALL
SELECT 
  'submissions' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
  COUNT(CASE WHEN status = 'graded' THEN 1 END) as graded,
  COUNT(CASE WHEN status = 'resubmission_required' THEN 1 END) as resubmission_required
FROM public.submissions;

COMMENT ON VIEW public.lms_summary IS 'LMS 데이터 현황 요약 뷰 (개발/디버깅용)';

-- 8. 초기 설정 완료 로그
DO $$
BEGIN
  RAISE NOTICE '=== LMS 초기 데이터 시드 완료 ===';
  RAISE NOTICE '카테고리: % 개', (SELECT COUNT(*) FROM public.categories);
  RAISE NOTICE '사용자: % 개', (SELECT COUNT(*) FROM public.users);
  RAISE NOTICE '코스: % 개', (SELECT COUNT(*) FROM public.courses);
  RAISE NOTICE '과제: % 개', (SELECT COUNT(*) FROM public.assignments);
  RAISE NOTICE '수강: % 개', (SELECT COUNT(*) FROM public.enrollments);
  RAISE NOTICE '제출물: % 개', (SELECT COUNT(*) FROM public.submissions);
  RAISE NOTICE '================================';
END $$;
