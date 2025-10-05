/**
 * 과제 및 제출물 관련 DTO (Data Transfer Object)
 * 백엔드 스키마를 프론트엔드에서 재사용하기 위한 재노출
 */

// 백엔드 스키마에서 타입 재노출
export type {
  CreateSubmissionRequest,
  UpdateSubmissionRequest,
  SubmissionResponse,
  AssignmentDetailResponse,
  // 강사용 타입 추가
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  AssignmentStatusUpdate,
  InstructorAssignmentsQuery,
  InstructorAssignmentsResponse,
  InstructorAssignmentResponse,
  AssignmentSubmissionsQuery,
  AssignmentSubmissionsResponse,
  SubmissionDetailResponse,
  // 채점 관련 타입 추가
  GradeSubmissionRequest,
  GradeSubmissionResponse,
  SubmissionForGrading,
  SubmissionsForGradingResponse,
  SubmissionParams,
  Pagination,
} from '../backend/schema';

// 백엔드 스키마 재노출
export {
  CreateSubmissionRequestSchema,
  UpdateSubmissionRequestSchema,
  SubmissionResponseSchema,
  AssignmentDetailResponseSchema,
  // 강사용 스키마 추가
  CreateAssignmentRequestSchema,
  UpdateAssignmentRequestSchema,
  AssignmentStatusUpdateSchema,
  InstructorAssignmentsQuerySchema,
  InstructorAssignmentsResponseSchema,
  InstructorAssignmentResponseSchema,
  AssignmentSubmissionsQuerySchema,
  AssignmentSubmissionsResponseSchema,
  SubmissionDetailResponseSchema,
  // 채점 관련 스키마 추가
  GradeSubmissionRequestSchema,
  GradeSubmissionResponseSchema,
  SubmissionForGradingSchema,
  SubmissionsForGradingResponseSchema,
  SubmissionParamsSchema,
  PaginationSchema,
} from '../backend/schema';