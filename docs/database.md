# 데이터베이스 설계 문서

## 1. 간략한 데이터 플로우

### 1.1 사용자 온보딩 플로우
```
Auth (Supabase) → Users 테이블 → 역할별 대시보드
```

### 1.2 코스 관리 플로우 (Instructor)
```
Users (instructor) → Courses → Assignments → Submissions (채점)
```

### 1.3 학습 플로우 (Learner)
```
Users (learner) → Courses (탐색) → Enrollments (수강신청) → Assignments (과제 확인) → Submissions (제출) → 성적/피드백 확인
```

### 1.4 과제 제출 및 채점 플로우
```
Assignments (published) → Submissions (제출) → 채점 → Submissions (graded) → 피드백 확인
```

### 1.5 상태 기반 비즈니스 룰 플로우
```
- Course: draft → published → archived
- Assignment: draft → published → closed (마감일 기준)
- Submission: submitted → graded / resubmission_required
```

---

## 2. 데이터베이스 스키마 설계

### 2.1 Users 테이블
```sql
-- 사용자 기본 정보 및 역할 관리
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('learner', 'instructor', 'operator')),
  terms_agreed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.2 Categories 테이블
```sql
-- 코스 카테고리 관리
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2.3 Courses 테이블
```sql
-- 코스 정보 관리
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
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
```

### 2.4 Enrollments 테이블
```sql
-- 수강 관계 관리
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  UNIQUE(learner_id, course_id)
);
```

### 2.5 Assignments 테이블
```sql
-- 과제 정보 관리
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
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
```

### 2.6 Submissions 테이블
```sql
-- 과제 제출물 관리
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  link_url VARCHAR(500),
  is_late BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(30) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'resubmission_required')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(assignment_id, learner_id)
);
```

### 2.7 Reports 테이블
```sql
-- 신고 관리 (운영 기능)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_type VARCHAR(20) NOT NULL CHECK (reported_type IN ('course', 'assignment', 'submission', 'user')),
  reported_id UUID NOT NULL,
  reason VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'investigating', 'resolved')),
  action_taken TEXT,
  handled_by UUID REFERENCES users(id),
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. 인덱스 및 제약조건

### 3.1 성능 최적화 인덱스
```sql
-- 자주 조회되는 컬럼들에 대한 인덱스
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_category ON courses(category_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_difficulty ON courses(difficulty);

CREATE INDEX idx_enrollments_learner ON enrollments(learner_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_active ON enrollments(is_active);

CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_learner ON submissions(learner_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_graded_by ON submissions(graded_by);

CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_type_id ON reports(reported_type, reported_id);
CREATE INDEX idx_reports_status ON reports(status);
```

### 3.2 업데이트 트리거 함수
```sql
-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 4. 비즈니스 룰 구현

### 4.1 과제 마감 자동 처리
```sql
-- 마감일이 지난 과제를 자동으로 closed 상태로 변경
CREATE OR REPLACE FUNCTION auto_close_assignments()
RETURNS void AS $$
BEGIN
  UPDATE assignments 
  SET status = 'closed', updated_at = NOW()
  WHERE status = 'published' 
    AND due_date < NOW();
END;
$$ LANGUAGE plpgsql;
```

### 4.2 지각 제출 체크
```sql
-- 제출 시 지각 여부 자동 판단
CREATE OR REPLACE FUNCTION check_late_submission()
RETURNS TRIGGER AS $$
DECLARE
  assignment_due_date TIMESTAMPTZ;
BEGIN
  SELECT due_date INTO assignment_due_date 
  FROM assignments 
  WHERE id = NEW.assignment_id;
  
  IF NEW.submitted_at > assignment_due_date THEN
    NEW.is_late = true;
  ELSE
    NEW.is_late = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_submission_late 
  BEFORE INSERT ON submissions 
  FOR EACH ROW 
  EXECUTE FUNCTION check_late_submission();
```

### 4.3 수강생 수 자동 업데이트
```sql
-- 수강신청/취소 시 코스의 수강생 수 자동 업데이트
CREATE OR REPLACE FUNCTION update_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    UPDATE courses 
    SET enrollment_count = enrollment_count + 1 
    WHERE id = NEW.course_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active = true AND NEW.is_active = false THEN
      UPDATE courses 
      SET enrollment_count = enrollment_count - 1 
      WHERE id = NEW.course_id;
    ELSIF OLD.is_active = false AND NEW.is_active = true THEN
      UPDATE courses 
      SET enrollment_count = enrollment_count + 1 
      WHERE id = NEW.course_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.is_active = true THEN
    UPDATE courses 
    SET enrollment_count = enrollment_count - 1 
    WHERE id = OLD.course_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_enrollment_count
  AFTER INSERT OR UPDATE OR DELETE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_count();
```

---

## 5. 주요 쿼리 패턴

### 5.1 학습자 대시보드 데이터
```sql
-- 내 코스 목록과 진행률
SELECT 
  c.id,
  c.title,
  c.description,
  COUNT(a.id) as total_assignments,
  COUNT(CASE WHEN s.status = 'graded' THEN 1 END) as completed_assignments,
  ROUND(
    COUNT(CASE WHEN s.status = 'graded' THEN 1 END) * 100.0 / NULLIF(COUNT(a.id), 0), 
    2
  ) as progress_percentage
FROM courses c
JOIN enrollments e ON c.id = e.course_id
LEFT JOIN assignments a ON c.id = a.course_id AND a.status = 'published'
LEFT JOIN submissions s ON a.id = s.assignment_id AND s.learner_id = e.learner_id
WHERE e.learner_id = $1 AND e.is_active = true
GROUP BY c.id, c.title, c.description;
```

### 5.2 마감 임박 과제
```sql
-- 마감 3일 이내 미제출 과제
SELECT 
  a.id,
  a.title,
  a.due_date,
  c.title as course_title
FROM assignments a
JOIN courses c ON a.course_id = c.id
JOIN enrollments e ON c.id = e.course_id
LEFT JOIN submissions s ON a.id = s.assignment_id AND s.learner_id = e.learner_id
WHERE e.learner_id = $1 
  AND e.is_active = true
  AND a.status = 'published'
  AND a.due_date BETWEEN NOW() AND NOW() + INTERVAL '3 days'
  AND s.id IS NULL
ORDER BY a.due_date ASC;
```

### 5.3 강사 대시보드 데이터
```sql
-- 채점 대기 제출물 수
SELECT 
  COUNT(*) as pending_grading_count
FROM submissions s
JOIN assignments a ON s.assignment_id = a.id
JOIN courses c ON a.course_id = c.id
WHERE c.instructor_id = $1 
  AND s.status = 'submitted';
```

### 5.4 코스별 성적 요약
```sql
-- 학습자의 코스별 총점 계산
SELECT 
  c.id,
  c.title,
  SUM(s.score * a.score_weight / 100) as total_score,
  SUM(a.score_weight) as total_weight,
  ROUND(
    SUM(s.score * a.score_weight / 100) * 100.0 / NULLIF(SUM(a.score_weight), 0), 
    2
  ) as final_percentage
FROM courses c
JOIN enrollments e ON c.id = e.course_id
JOIN assignments a ON c.id = a.course_id
JOIN submissions s ON a.id = s.assignment_id AND s.learner_id = e.learner_id
WHERE e.learner_id = $1 
  AND e.is_active = true
  AND s.status = 'graded'
GROUP BY c.id, c.title;
```

---

## 6. 데이터 무결성 및 보안

### 6.1 RLS (Row Level Security) 비활성화
```sql
-- 개발 편의성을 위해 RLS 비활성화 (PRD 요구사항)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
```

### 6.2 데이터 검증 규칙
- **역할 검증**: users.role은 'learner', 'instructor', 'operator'만 허용
- **상태 검증**: 각 엔티티의 status 필드는 정의된 값만 허용
- **점수 범위**: submissions.score는 0-100 범위 내에서만 허용
- **가중치 검증**: assignments.score_weight는 0-100 범위 내에서만 허용
- **고유성 보장**: 동일 과제에 대한 중복 제출 방지

---

## 7. 초기 데이터 시드

### 7.1 기본 카테고리
```sql
INSERT INTO categories (name, description) VALUES
('프로그래밍', '소프트웨어 개발 관련 코스'),
('데이터 사이언스', '데이터 분석 및 머신러닝 관련 코스'),
('디자인', 'UI/UX 및 그래픽 디자인 관련 코스'),
('비즈니스', '경영 및 마케팅 관련 코스'),
('언어', '외국어 학습 관련 코스');
```

### 7.2 테스트 사용자
```sql
-- 테스트용 강사 및 학습자 계정 (실제 운영에서는 제거)
INSERT INTO users (id, email, full_name, phone, role, terms_agreed_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'instructor@test.com', '김강사', '010-1234-5678', 'instructor', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'learner@test.com', '이학생', '010-9876-5432', 'learner', NOW());
```
