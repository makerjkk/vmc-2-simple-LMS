-- Migration: LMS 관계 테이블 생성
-- 수강 관계, 과제, 제출물 테이블 생성

-- 1. Enrollments 테이블 - 수강 관계 관리
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  UNIQUE(learner_id, course_id)
);

COMMENT ON TABLE public.enrollments IS '학습자와 코스 간의 수강 관계 관리 테이블';
COMMENT ON COLUMN public.enrollments.is_active IS '수강 활성 상태 (수강취소 시 false)';

-- 2. Assignments 테이블 - 과제 정보 관리
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  score_weight DECIMAL(5,2) NOT NULL CHECK (score_weight >= 0 AND score_weight <= 100),
  allow_late_submission BOOLEAN NOT NULL DEFAULT false,
  allow_resubmission BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.assignments IS '과제 정보 및 정책 관리 테이블';
COMMENT ON COLUMN public.assignments.status IS '과제 상태: draft(초안), published(게시됨), closed(마감됨)';
COMMENT ON COLUMN public.assignments.score_weight IS '과제 점수 가중치 (0-100)';
COMMENT ON COLUMN public.assignments.allow_late_submission IS '지각 제출 허용 여부';
COMMENT ON COLUMN public.assignments.allow_resubmission IS '재제출 허용 여부';

-- 3. Submissions 테이블 - 과제 제출물 관리
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  link_url VARCHAR(500),
  is_late BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(30) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'resubmission_required')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES public.users(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(assignment_id, learner_id)
);

COMMENT ON TABLE public.submissions IS '과제 제출물 및 채점 관리 테이블';
COMMENT ON COLUMN public.submissions.status IS '제출물 상태: submitted(제출됨), graded(채점완료), resubmission_required(재제출요청)';
COMMENT ON COLUMN public.submissions.is_late IS '지각 제출 여부';
COMMENT ON COLUMN public.submissions.score IS '채점 점수 (0-100)';

-- 4. Reports 테이블 - 신고 관리 (운영 기능)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_type VARCHAR(20) NOT NULL CHECK (reported_type IN ('course', 'assignment', 'submission', 'user')),
  reported_id UUID NOT NULL,
  reason VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'investigating', 'resolved')),
  action_taken TEXT,
  handled_by UUID REFERENCES public.users(id),
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.reports IS '신고 접수 및 처리 관리 테이블 (운영 기능)';
COMMENT ON COLUMN public.reports.reported_type IS '신고 대상 타입: course, assignment, submission, user';
COMMENT ON COLUMN public.reports.status IS '신고 처리 상태: received(접수), investigating(조사중), resolved(해결됨)';

-- RLS 비활성화 (개발 편의성을 위해)
ALTER TABLE IF EXISTS public.enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reports DISABLE ROW LEVEL SECURITY;
