# Learner 대시보드 - 상세 유스케이스

## Use Case: UC-003 Learner 대시보드 조회

### Primary Actor
- **Learner** (학습자)

### Precondition
- 사용자가 Learner 역할로 로그인되어 있음
- 사용자가 하나 이상의 코스에 수강신청한 상태임

### Trigger
- 사용자가 대시보드 메뉴를 클릭하거나 대시보드 URL에 접근

### Main Scenario

1. **사용자**가 대시보드에 접근한다
2. **시스템**이 사용자의 인증 상태를 확인한다
3. **시스템**이 사용자가 수강 중인 코스 목록을 조회한다
4. **시스템**이 각 코스별 진행률을 계산한다
   - 완료한 과제 수 / 전체 과제 수 × 100
5. **시스템**이 마감 임박 과제를 식별한다
   - 현재 시간 기준 7일 이내 마감 예정인 미제출 과제
6. **시스템**이 최근 피드백을 조회한다
   - 최근 7일 이내 받은 피드백 중 최대 5개
7. **시스템**이 대시보드 화면을 렌더링한다
   - 내 코스 목록 (제목, 진행률, 상태)
   - 마감 임박 과제 목록 (과제명, 코스명, 마감일)
   - 최근 피드백 요약 (과제명, 점수, 피드백 일부)

### Edge Cases

#### EC-003-1: 수강 중인 코스가 없는 경우
- **조건**: 사용자가 아직 어떤 코스도 수강신청하지 않음
- **처리**: 빈 상태 메시지와 함께 코스 탐색 링크 제공

#### EC-003-2: 네트워크 오류 발생
- **조건**: 데이터베이스 연결 실패 또는 서버 오류
- **처리**: 오류 메시지 표시 및 새로고침 버튼 제공

#### EC-003-3: 권한 없는 접근
- **조건**: 비로그인 사용자 또는 Instructor 역할 사용자의 접근
- **처리**: 로그인 페이지로 리다이렉트 또는 권한 오류 메시지 표시

#### EC-003-4: 데이터 로딩 지연
- **조건**: 대량의 데이터로 인한 로딩 시간 증가
- **처리**: 로딩 스피너 표시 및 점진적 데이터 로딩

### Business Rules

#### BR-003-1: 진행률 계산 규칙
- 진행률 = (제출 완료된 과제 수 / 해당 코스의 전체 published 과제 수) × 100
- 소수점 첫째 자리까지 표시
- draft 상태의 과제는 계산에서 제외

#### BR-003-2: 마감 임박 과제 기준
- 현재 시간 기준 7일(168시간) 이내 마감 예정
- 이미 제출한 과제는 제외
- published 상태의 과제만 포함
- 마감일 기준 오름차순 정렬

#### BR-003-3: 최근 피드백 표시 규칙
- 최근 7일 이내 받은 피드백만 표시
- 최대 5개까지만 표시
- 피드백 작성일 기준 내림차순 정렬
- 피드백 내용은 50자까지만 미리보기 표시

#### BR-003-4: 데이터 새로고침 정책
- 페이지 접근 시마다 최신 데이터 조회
- 캐싱 없이 실시간 데이터 제공
- 사용자 액션(수강신청/취소) 후 자동 새로고침

## Sequence Diagram

\`\`\`plantuml
@startuml
participant User
participant FE as "Frontend"
participant BE as "Backend API"
participant Database

User -> FE: 대시보드 접근
FE -> BE: GET /api/dashboard
BE -> Database: 사용자 인증 확인
Database -> BE: 인증 정보 반환

BE -> Database: 수강 중인 코스 목록 조회
Database -> BE: 코스 목록 반환

BE -> Database: 각 코스별 과제 정보 조회
Database -> BE: 과제 정보 반환

BE -> BE: 진행률 계산
note right: 완료 과제 수 / 전체 과제 수

BE -> Database: 마감 임박 과제 조회
note right: 7일 이내 마감 예정
Database -> BE: 마감 임박 과제 반환

BE -> Database: 최근 피드백 조회
note right: 최근 7일 이내, 최대 5개
Database -> BE: 최근 피드백 반환

BE -> FE: 대시보드 데이터 응답
note right: {\n  "courses": [...],\n  "progress": [...],\n  "upcomingAssignments": [...],\n  "recentFeedback": [...]\n}

FE -> FE: 대시보드 UI 렌더링
FE -> User: 대시보드 화면 표시

alt 수강 중인 코스가 없는 경우
  BE -> FE: 빈 데이터 응답
  FE -> User: 빈 상태 메시지 표시
end

alt 오류 발생
  BE -> FE: 오류 응답
  FE -> User: 오류 메시지 표시
end

@enduml
\`\`\`

## API Specification

### GET /api/dashboard

**Request Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course_id",
        "title": "코스 제목",
        "progress": 75.5,
        "totalAssignments": 8,
        "completedAssignments": 6,
        "status": "published"
      }
    ],
    "upcomingAssignments": [
      {
        "id": "assignment_id",
        "title": "과제 제목",
        "courseTitle": "코스 제목",
        "dueDate": "2024-01-15T23:59:59Z",
        "daysLeft": 3
      }
    ],
    "recentFeedback": [
      {
        "id": "submission_id",
        "assignmentTitle": "과제 제목",
        "score": 85,
        "feedback": "잘 작성하셨습니다. 다만 결론 부분에서...",
        "feedbackDate": "2024-01-10T14:30:00Z"
      }
    ]
  }
}
```

**Error Responses:**
- `401 Unauthorized`: 인증되지 않은 사용자
- `403 Forbidden`: Learner 권한이 없는 사용자
- `500 Internal Server Error`: 서버 내부 오류
