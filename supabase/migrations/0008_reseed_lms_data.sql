-- Migration: LMS 데이터 재시드
-- 수정된 users 테이블 구조에 맞는 초기 데이터

-- 1. 기존 데이터 정리 (필요시)
TRUNCATE TABLE public.submissions CASCADE;
TRUNCATE TABLE public.enrollments CASCADE;
TRUNCATE TABLE public.assignments CASCADE;
TRUNCATE TABLE public.courses CASCADE;
TRUNCATE TABLE public.users CASCADE;
TRUNCATE TABLE public.reports CASCADE;

-- 2. 기본 카테고리 데이터 (기존과 동일)
INSERT INTO public.categories (name, description) VALUES
('프로그래밍', '소프트웨어 개발 관련 코스'),
('데이터 사이언스', '데이터 분석 및 머신러닝 관련 코스'),
('디자인', 'UI/UX 및 그래픽 디자인 관련 코스'),
('비즈니스', '경영 및 마케팅 관련 코스'),
('언어', '외국어 학습 관련 코스')
ON CONFLICT (name) DO NOTHING;

-- 3. 테스트용 사용자 데이터 (수정된 구조)
-- 테스트용 강사 계정
INSERT INTO public.users (
  id,
  auth_user_id,
  email, 
  full_name, 
  phone, 
  role, 
  terms_agreed_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  NULL, -- 실제 auth.users와 연결하지 않음 (개발용)
  'instructor@test.com',
  '김강사',
  '010-1234-5678',
  'instructor',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 테스트용 학습자 계정
INSERT INTO public.users (
  id,
  auth_user_id,
  email, 
  full_name, 
  phone, 
  role, 
  terms_agreed_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  NULL, -- 실제 auth.users와 연결하지 않음 (개발용)
  'learner@test.com',
  '이학생',
  '010-9876-5432',
  'learner',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 테스트용 운영자 계정
INSERT INTO public.users (
  id,
  auth_user_id,
  email, 
  full_name, 
  phone, 
  role, 
  terms_agreed_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  NULL, -- 실제 auth.users와 연결하지 않음 (개발용)
  'operator@test.com',
  '박운영',
  '010-1111-2222',
  'operator',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. 테스트용 코스 데이터
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

-- 추가 테스트 코스
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
  '660e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440001',
  (SELECT id FROM public.categories WHERE name = '데이터 사이언스' LIMIT 1),
  'Python 데이터 분석 기초',
  'Python을 활용한 데이터 분석의 기초를 배우는 코스입니다.',
  '1. Python 기초\n2. Pandas 라이브러리\n3. 데이터 시각화\n4. 통계 분석\n5. 프로젝트',
  'intermediate',
  'draft'
) ON CONFLICT (id) DO NOTHING;

-- 5. 테스트용 과제 데이터
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

-- 마감된 과제 (테스트용)
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
  '770e8400-e29b-41d4-a716-446655440002',
  '660e8400-e29b-41d4-a716-446655440001',
  'React 컴포넌트 실습',
  'React 함수형 컴포넌트를 활용한 실습 과제입니다.',
  NOW() - INTERVAL '2 days', -- 이미 마감된 과제
  25.00,
  false,
  false,
  'closed'
) ON CONFLICT (id) DO NOTHING;

-- 6. 테스트용 수강 데이터
INSERT INTO public.enrollments (
  learner_id,
  course_id,
  is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '660e8400-e29b-41d4-a716-446655440001',
  true
) ON CONFLICT (learner_id, course_id) DO NOTHING;

-- 7. 테스트용 제출물 데이터
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

-- 채점 완료된 제출물 (테스트용)
INSERT INTO public.submissions (
  assignment_id,
  learner_id,
  content,
  link_url,
  status,
  score,
  feedback,
  graded_at,
  graded_by
) VALUES (
  '770e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440002',
  'React 컴포넌트를 활용한 실습을 완료했습니다.',
  'https://github.com/test-user/react-components',
  'graded',
  85,
  '잘 구현하셨습니다. 다만 컴포넌트 재사용성을 더 고려해보시면 좋겠습니다.',
  NOW() - INTERVAL '1 day',
  '550e8400-e29b-41d4-a716-446655440001'
) ON CONFLICT (assignment_id, learner_id) DO NOTHING;

-- 8. 데이터 정합성 확인
DO $$
BEGIN
  RAISE NOTICE '=== LMS 데이터 재시드 완료 ===';
  RAISE NOTICE '카테고리: % 개', (SELECT COUNT(*) FROM public.categories);
  RAISE NOTICE '사용자: % 개', (SELECT COUNT(*) FROM public.users);
  RAISE NOTICE '코스: % 개', (SELECT COUNT(*) FROM public.courses);
  RAISE NOTICE '과제: % 개', (SELECT COUNT(*) FROM public.assignments);
  RAISE NOTICE '수강: % 개', (SELECT COUNT(*) FROM public.enrollments);
  RAISE NOTICE '제출물: % 개', (SELECT COUNT(*) FROM public.submissions);
  RAISE NOTICE '================================';
  
  -- 외래키 관계 검증
  RAISE NOTICE '외래키 검증:';
  RAISE NOTICE '- 코스-강사 관계: % 개', (
    SELECT COUNT(*) FROM public.courses c 
    JOIN public.users u ON c.instructor_id = u.id 
    WHERE u.role = 'instructor'
  );
  RAISE NOTICE '- 수강-학습자 관계: % 개', (
    SELECT COUNT(*) FROM public.enrollments e 
    JOIN public.users u ON e.learner_id = u.id 
    WHERE u.role = 'learner'
  );
END $$;
