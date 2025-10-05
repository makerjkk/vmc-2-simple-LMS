# 과제 상세 열람 (Learner) - 구현 계획서

## 개요

과제 상세 열람 기능을 위한 모듈화 설계 및 구현 계획입니다. 기존 코드베이스의 패턴을 따라 `assignments` 피처를 새로 생성하고, 학습자가 수강 중인 코스의 과제 상세 정보를 안전하게 열람할 수 있도록 구현합니다.

### 주요 모듈 목록

| 모듈명 | 위치 | 설명 |
|--------|------|------|
| **Backend Layer** |
| Assignment Route | `src/features/assignments/backend/route.ts` | 과제 상세 조회 API 엔드포인트 |
| Assignment Service | `src/features/assignments/backend/service.ts` | 과제 조회 및 권한 검증 비즈니스 로직 |
| Assignment Schema | `src/features/assignments/backend/schema.ts` | 요청/응답 zod 스키마 정의 |
| Assignment Error | `src/features/assignments/backend/error.ts` | 과제 관련 에러 코드 정의 |
| **Frontend Layer** |
| Assignment Detail Component | `src/features/assignments/components/assignment-detail.tsx` | 과제 상세 정보 표시 컴포넌트 |
| Assignment Hook | `src/features/assignments/hooks/useAssignmentQuery.ts` | 과제 조회 React Query 훅 |
| Assignment DTO | `src/features/assignments/lib/dto.ts` | 클라이언트 측 스키마 재노출 |
| **Page Layer** |
| Assignment Detail Page | `src/app/assignments/[id]/page.tsx` | 과제 상세 페이지 |
| **Shared Utilities** |
| Assignment Status Utils | `src/lib/utils/assignment.ts` | 과제 상태 관련 공통 유틸리티 |
| Submission Status Component | `src/components/ui/submission-status.tsx` | 제출 상태 표시 공용 컴포넌트 |

## Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        A1[Assignment Detail Page<br/>src/app/assignments/[id]/page.tsx]
        A2[Assignment Detail Component<br/>src/features/assignments/components/assignment-detail.tsx]
        A3[Assignment Hook<br/>src/features/assignments/hooks/useAssignmentQuery.ts]
        A4[Assignment DTO<br/>src/features/assignments/lib/dto.ts]
    end

    subgraph "Backend Layer"
        B1[Assignment Route<br/>src/features/assignments/backend/route.ts]
        B2[Assignment Service<br/>src/features/assignments/backend/service.ts]
        B3[Assignment Schema<br/>src/features/assignments/backend/schema.ts]
        B4[Assignment Error<br/>src/features/assignments/backend/error.ts]
    end

    subgraph "Shared Layer"
        C1[Assignment Utils<br/>src/lib/utils/assignment.ts]
        C2[Submission Status Component<br/>src/components/ui/submission-status.tsx]
        C3[Role Guard<br/>src/components/auth/role-guard.tsx]
        C4[API Client<br/>src/lib/remote/api-client.ts]
        C5[Date Utils<br/>src/lib/utils/date.ts]
    end

    subgraph "Database"
        D1[(assignments)]
        D2[(enrollments)]
        D3[(submissions)]
        D4[(users)]
    end

    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> B3
    A3 --> C4
    A2 --> C1
    A2 --> C2
    A1 --> C3

    B1 --> B2
    B2 --> B3
    B2 --> B4
    B2 --> D1
    B2 --> D2
    B2 --> D3
    B2 --> D4

    A2 --> C5
    C4 --> B1
```

## Implementation Plan

### 1. Backend Layer

#### 1.1 Assignment Schema (`src/features/assignments/backend/schema.ts`)
**목적**: 과제 관련 요청/응답 스키마 정의

**구현 내용**:
```typescript
// 과제 상세 조회 파라미터 스키마
export const AssignmentParamsSchema = z.object({
  id: z.string().uuid({ message: 'Assignment id must be a valid UUID.' }),
});

// 과제 상세 응답 스키마
export const AssignmentDetailResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  dueDate: z.string(),
  scoreWeight: z.number(),
  allowLateSubmission: z.boolean(),
  allowResubmission: z.boolean(),
  status: z.enum(['draft', 'published', 'closed']),
  course: z.object({
    id: z.string().uuid(),
    title: z.string(),
  }),
  submission: z.object({
    id: z.string().uuid(),
    status: z.enum(['submitted', 'graded', 'resubmission_required']),
    submittedAt: z.string(),
    isLate: z.boolean(),
    content: z.string(),
    link: z.string().nullable(),
    score: z.number().nullable(),
    feedback: z.string().nullable(),
  }).nullable(),
});
```

**Unit Test 계획**:
- 스키마 파싱 성공/실패 케이스
- UUID 형식 검증
- 필수/선택 필드 검증

#### 1.2 Assignment Service (`src/features/assignments/backend/service.ts`)
**목적**: 과제 조회 및 권한 검증 비즈니스 로직

**구현 내용**:
```typescript
export const getAssignmentDetail = async (
  client: SupabaseClient,
  assignmentId: string,
  userId: string
): Promise<HandlerResult<AssignmentDetailResponse, string, unknown>>
```

**비즈니스 로직**:
1. 과제 존재 여부 및 `published` 상태 확인
2. 사용자의 해당 코스 수강 여부 확인
3. 사용자의 제출물 정보 조회
4. 응답 데이터 구성

**Unit Test 계획**:
- 정상 케이스: 수강 중인 과제 조회 성공
- 오류 케이스: 존재하지 않는 과제
- 오류 케이스: `draft` 상태 과제 접근
- 오류 케이스: 수강하지 않은 코스의 과제 접근
- 권한 검증 로직 테스트

#### 1.3 Assignment Route (`src/features/assignments/backend/route.ts`)
**목적**: 과제 상세 조회 API 엔드포인트

**구현 내용**:
```typescript
// GET /api/assignments/:id - 과제 상세 조회
app.get('/assignments/:id', async (c) => {
  // 파라미터 검증
  // 사용자 인증 확인
  // 서비스 호출
  // 응답 반환
});
```

**Unit Test 계획**:
- 정상 요청 처리
- 잘못된 UUID 파라미터 처리
- 인증되지 않은 사용자 처리
- 서비스 레이어 오류 처리

#### 1.4 Assignment Error (`src/features/assignments/backend/error.ts`)
**목적**: 과제 관련 에러 코드 정의

**구현 내용**:
```typescript
export const assignmentErrorCodes = {
  notFound: 'ASSIGNMENT_NOT_FOUND',
  notPublished: 'ASSIGNMENT_NOT_PUBLISHED',
  notEnrolled: 'NOT_ENROLLED_IN_COURSE',
  unauthorized: 'UNAUTHORIZED',
  fetchError: 'FETCH_ERROR',
  databaseError: 'DATABASE_ERROR',
} as const;
```

### 2. Frontend Layer

#### 2.1 Assignment Hook (`src/features/assignments/hooks/useAssignmentQuery.ts`)
**목적**: 과제 조회 React Query 훅

**구현 내용**:
```typescript
export const useAssignmentQuery = (assignmentId: string) => {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => fetchAssignment(assignmentId),
    enabled: Boolean(assignmentId),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message.includes('404') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};
```

#### 2.2 Assignment Detail Component (`src/features/assignments/components/assignment-detail.tsx`)
**목적**: 과제 상세 정보 표시 컴포넌트

**구현 내용**:
- 과제 기본 정보 표시 (제목, 설명, 마감일, 점수 비중)
- 과제 정책 표시 (지각 허용, 재제출 허용)
- 제출 상태 및 제출물 정보 표시
- 제출 인터페이스 (상태에 따라 활성화/비활성화)
- 로딩/에러 상태 처리

**QA Sheet**:
| 테스트 케이스 | 예상 결과 |
|---------------|-----------|
| 정상적인 과제 로딩 | 과제 정보가 올바르게 표시됨 |
| 마감된 과제 접근 | 제출 버튼이 비활성화됨 |
| 제출 완료된 과제 | 제출물 정보가 표시됨 |
| 지각 제출 허용 과제 | 마감 후에도 제출 가능 표시 |
| 재제출 허용 과제 | 재제출 버튼이 활성화됨 |
| 네트워크 오류 | 에러 메시지와 재시도 버튼 표시 |
| 권한 없는 접근 | 403 오류 메시지 표시 |
| 존재하지 않는 과제 | 404 오류 메시지 표시 |

#### 2.3 Assignment Detail Page (`src/app/assignments/[id]/page.tsx`)
**목적**: 과제 상세 페이지

**구현 내용**:
```typescript
export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return (
    <RoleGuard allowedRoles={['learner']}>
      <AssignmentDetail assignmentId={id} />
    </RoleGuard>
  );
}
```

### 3. Shared Layer

#### 3.1 Assignment Utils (`src/lib/utils/assignment.ts`)
**목적**: 과제 상태 관련 공통 유틸리티

**구현 내용**:
```typescript
// 과제 상태 표시명 변환
export const getAssignmentStatusLabel = (status: string): string;

// 제출 가능 여부 확인
export const canSubmitAssignment = (assignment: Assignment, submission?: Submission): boolean;

// 마감일 기준 제출 상태 확인
export const getSubmissionTimingStatus = (dueDate: string, submittedAt?: string): 'on-time' | 'late' | 'not-submitted';

// 과제 상태별 색상 클래스 반환
export const getAssignmentStatusColor = (status: string): string;
```

**Unit Test 계획**:
- 각 상태별 라벨 변환 테스트
- 제출 가능 여부 로직 테스트
- 마감일 기준 상태 판별 테스트

#### 3.2 Submission Status Component (`src/components/ui/submission-status.tsx`)
**목적**: 제출 상태 표시 공용 컴포넌트

**구현 내용**:
```typescript
interface SubmissionStatusProps {
  status: 'not-submitted' | 'submitted' | 'graded' | 'resubmission-required';
  isLate?: boolean;
  score?: number;
  dueDate?: string;
  submittedAt?: string;
}

export const SubmissionStatus = ({ status, isLate, score, dueDate, submittedAt }: SubmissionStatusProps)
```

**QA Sheet**:
| 상태 | 표시 내용 | 색상 |
|------|-----------|------|
| not-submitted | "미제출" | 회색 |
| submitted (정시) | "제출 완료" | 파란색 |
| submitted (지각) | "지각 제출" | 주황색 |
| graded | "채점 완료 (점수)" | 초록색 |
| resubmission-required | "재제출 요청" | 빨간색 |

### 4. 통합 및 등록

#### 4.1 Hono App 등록 (`src/backend/hono/app.ts`)
```typescript
import { registerAssignmentsRoutes } from '@/features/assignments/backend/route';

// 기존 라우터 등록 후 추가
registerAssignmentsRoutes(app);
```

#### 4.2 Navigation 업데이트
기존 대시보드 및 코스 페이지에서 과제 상세 페이지로의 링크 추가

### 5. 데이터베이스 고려사항

기존 마이그레이션에서 정의된 테이블 구조를 활용:
- `assignments`: 과제 기본 정보
- `enrollments`: 수강 관계 확인
- `submissions`: 제출물 정보
- `users`: 사용자 정보

추가 인덱스 필요 시 별도 마이그레이션 생성 고려

### 6. 보안 고려사항

- 모든 API 엔드포인트에서 사용자 인증 확인
- 수강 여부 기반 접근 제어
- 과제 상태(`published`)에 따른 접근 제어
- SQL 인젝션 방지를 위한 파라미터화된 쿼리 사용

### 7. 성능 고려사항

- React Query를 통한 캐싱 (5분 staleTime)
- 필요한 데이터만 조회하는 선택적 쿼리
- 이미지 최적화 (Next.js Image 컴포넌트 활용)
- 적절한 로딩 상태 및 스켈레톤 UI 제공

### 8. 접근성 고려사항

- 스크린 리더를 위한 적절한 ARIA 라벨
- 키보드 네비게이션 지원
- 색상에만 의존하지 않는 상태 표시
- 충분한 색상 대비율 확보
