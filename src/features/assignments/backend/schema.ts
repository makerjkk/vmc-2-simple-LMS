import { z } from 'zod';

// 과제 상세 조회 파라미터 스키마
export const AssignmentParamsSchema = z.object({
  id: z.string().uuid({ message: 'Assignment id must be a valid UUID.' }),
});

export type AssignmentParams = z.infer<typeof AssignmentParamsSchema>;

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

export type AssignmentDetailResponse = z.infer<typeof AssignmentDetailResponseSchema>;

// 데이터베이스 테이블 행 스키마
export const AssignmentTableRowSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  due_date: z.string(),
  score_weight: z.number(),
  allow_late_submission: z.boolean(),
  allow_resubmission: z.boolean(),
  status: z.enum(['draft', 'published', 'closed']),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AssignmentTableRow = z.infer<typeof AssignmentTableRowSchema>;

// 제출물 테이블 행 스키마
export const SubmissionTableRowSchema = z.object({
  id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  learner_id: z.string().uuid(),
  content: z.string(),
  link_url: z.string().nullable(),
  is_late: z.boolean(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  graded_at: z.string().nullable(),
  graded_by: z.string().uuid().nullable(),
  submitted_at: z.string(),
  updated_at: z.string(),
});

export type SubmissionTableRow = z.infer<typeof SubmissionTableRowSchema>;

// 코스 테이블 행 스키마 (조인용)
export const CourseTableRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
});

export type CourseTableRow = z.infer<typeof CourseTableRowSchema>;

// 제출물 생성 요청 스키마
export const CreateSubmissionRequestSchema = z.object({
  content: z.string().min(1, '과제 내용을 입력해주세요.').max(5000, '내용이 너무 깁니다.'),
  linkUrl: z.string().url('올바른 URL 형식을 입력해주세요.').optional().nullable(),
});

export type CreateSubmissionRequest = z.infer<typeof CreateSubmissionRequestSchema>;

// 제출물 업데이트 요청 스키마  
export const UpdateSubmissionRequestSchema = CreateSubmissionRequestSchema;

export type UpdateSubmissionRequest = z.infer<typeof UpdateSubmissionRequestSchema>;

// 제출물 응답 스키마
export const SubmissionResponseSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  content: z.string(),
  linkUrl: z.string().nullable(),
  isLate: z.boolean(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  submittedAt: z.string(),
  canResubmit: z.boolean(),
});

export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;

// ===== 강사용 스키마 =====

// 강사용 과제 생성 요청 스키마
export const CreateAssignmentRequestSchema = z.object({
  title: z.string().min(3, '제목은 3자 이상이어야 합니다.').max(200, '제목은 200자를 초과할 수 없습니다.'),
  description: z.string().min(10, '설명은 10자 이상이어야 합니다.').max(5000, '설명은 5000자를 초과할 수 없습니다.'),
  dueDate: z.string().datetime('올바른 날짜 형식을 입력해주세요.'),
  scoreWeight: z.number().min(0, '점수 비중은 0 이상이어야 합니다.').max(100, '점수 비중은 100을 초과할 수 없습니다.'),
  allowLateSubmission: z.boolean().default(false),
  allowResubmission: z.boolean().default(false),
});

export type CreateAssignmentRequest = z.infer<typeof CreateAssignmentRequestSchema>;

// 강사용 과제 수정 요청 스키마
export const UpdateAssignmentRequestSchema = z.object({
  title: z.string().min(3, '제목은 3자 이상이어야 합니다.').max(200, '제목은 200자를 초과할 수 없습니다.').optional(),
  description: z.string().min(10, '설명은 10자 이상이어야 합니다.').max(5000, '설명은 5000자를 초과할 수 없습니다.').optional(),
  dueDate: z.string().datetime('올바른 날짜 형식을 입력해주세요.').optional(),
  scoreWeight: z.number().min(0, '점수 비중은 0 이상이어야 합니다.').max(100, '점수 비중은 100을 초과할 수 없습니다.').optional(),
  allowLateSubmission: z.boolean().optional(),
  allowResubmission: z.boolean().optional(),
});

export type UpdateAssignmentRequest = z.infer<typeof UpdateAssignmentRequestSchema>;

// 과제 상태 전환 요청 스키마
export const AssignmentStatusUpdateSchema = z.object({
  status: z.enum(['draft', 'published', 'closed'], {
    errorMap: () => ({ message: '유효하지 않은 상태입니다.' }),
  }),
});

export type AssignmentStatusUpdate = z.infer<typeof AssignmentStatusUpdateSchema>;

// 강사용 과제 목록 쿼리 스키마
export const InstructorAssignmentsQuerySchema = z.object({
  courseId: z.string().uuid('올바른 코스 ID를 입력해주세요.'),
  status: z.enum(['draft', 'published', 'closed']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type InstructorAssignmentsQuery = z.infer<typeof InstructorAssignmentsQuerySchema>;

// 강사용 과제 응답 스키마
export const InstructorAssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  dueDate: z.string(),
  scoreWeight: z.number(),
  allowLateSubmission: z.boolean(),
  allowResubmission: z.boolean(),
  status: z.enum(['draft', 'published', 'closed']),
  submissionCount: z.number().int().min(0),
  gradedCount: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type InstructorAssignmentResponse = z.infer<typeof InstructorAssignmentResponseSchema>;

// 강사용 과제 목록 응답 스키마
export const InstructorAssignmentsResponseSchema = z.object({
  assignments: z.array(InstructorAssignmentResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type InstructorAssignmentsResponse = z.infer<typeof InstructorAssignmentsResponseSchema>;

// 제출물 목록 쿼리 스키마
export const AssignmentSubmissionsQuerySchema = z.object({
  assignmentId: z.string().uuid('올바른 과제 ID를 입력해주세요.'),
  status: z.enum(['submitted', 'graded', 'resubmission_required']).optional(),
  isLate: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type AssignmentSubmissionsQuery = z.infer<typeof AssignmentSubmissionsQuerySchema>;

// 제출물 상세 응답 스키마 (강사용)
export const SubmissionDetailResponseSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  learner: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    email: z.string(),
  }),
  content: z.string(),
  linkUrl: z.string().nullable(),
  isLate: z.boolean(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  submittedAt: z.string(),
  gradedAt: z.string().nullable(),
  gradedBy: z.string().uuid().nullable(),
  updatedAt: z.string(),
});

export type SubmissionDetailResponse = z.infer<typeof SubmissionDetailResponseSchema>;

// 제출물 목록 응답 스키마
export const AssignmentSubmissionsResponseSchema = z.object({
  submissions: z.array(SubmissionDetailResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
  stats: z.object({
    totalSubmissions: z.number().int(),
    gradedSubmissions: z.number().int(),
    lateSubmissions: z.number().int(),
    averageScore: z.number().nullable(),
  }),
});

export type AssignmentSubmissionsResponse = z.infer<typeof AssignmentSubmissionsResponseSchema>;

// 코스 파라미터 스키마
export const CourseParamsSchema = z.object({
  courseId: z.string().uuid('올바른 코스 ID를 입력해주세요.'),
});

export type CourseParams = z.infer<typeof CourseParamsSchema>;

// ===== 채점 관련 스키마 =====

// 채점 요청 스키마
export const GradeSubmissionRequestSchema = z.object({
  score: z.number().min(0, '점수는 0 이상이어야 합니다.').max(100, '점수는 100 이하여야 합니다.').optional(),
  feedback: z.string().min(1, '피드백을 입력해주세요.').max(2000, '피드백은 2000자를 초과할 수 없습니다.'),
  action: z.enum(['grade', 'request_resubmission'], {
    errorMap: () => ({ message: '유효하지 않은 채점 액션입니다.' }),
  }),
});

export type GradeSubmissionRequest = z.infer<typeof GradeSubmissionRequestSchema>;

// 채점 응답 스키마
export const GradeSubmissionResponseSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  learnerId: z.string().uuid(),
  status: z.enum(['graded', 'resubmission_required']),
  score: z.number().nullable(),
  feedback: z.string(),
  gradedAt: z.string(),
  gradedBy: z.string().uuid(),
});

export type GradeSubmissionResponse = z.infer<typeof GradeSubmissionResponseSchema>;

// 채점용 제출물 스키마
export const SubmissionForGradingSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  assignmentTitle: z.string(),
  learnerName: z.string(),
  learnerEmail: z.string(),
  content: z.string(),
  linkUrl: z.string().nullable(),
  isLate: z.boolean(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  submittedAt: z.string(),
  gradedAt: z.string().nullable(),
});

export type SubmissionForGrading = z.infer<typeof SubmissionForGradingSchema>;

// 제출물 목록 조회 응답 스키마 (채점용)
export const SubmissionsForGradingResponseSchema = z.object({
  submissions: z.array(SubmissionForGradingSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
  stats: z.object({
    total: z.number().int(),
    pending: z.number().int(),
    graded: z.number().int(),
    resubmissionRequired: z.number().int(),
  }),
});

export type SubmissionsForGradingResponse = z.infer<typeof SubmissionsForGradingResponseSchema>;

// 제출물 파라미터 스키마
export const SubmissionParamsSchema = z.object({
  submissionId: z.string().uuid('올바른 제출물 ID를 입력해주세요.'),
});

export type SubmissionParams = z.infer<typeof SubmissionParamsSchema>;

// 페이지네이션 스키마 (공통)
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;