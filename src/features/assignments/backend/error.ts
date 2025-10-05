/**
 * 과제 관련 에러 코드 정의
 */
export const assignmentErrorCodes = {
  notFound: 'ASSIGNMENT_NOT_FOUND',
  notPublished: 'ASSIGNMENT_NOT_PUBLISHED',
  notEnrolled: 'NOT_ENROLLED_IN_COURSE',
  unauthorized: 'UNAUTHORIZED',
  invalidParams: 'INVALID_PARAMS',
  fetchError: 'FETCH_ERROR',
  databaseError: 'DATABASE_ERROR',
} as const;

export type AssignmentErrorCode = typeof assignmentErrorCodes[keyof typeof assignmentErrorCodes];

/**
 * 과제 서비스 에러 타입
 */
export interface AssignmentServiceError {
  code: AssignmentErrorCode;
  message: string;
}
