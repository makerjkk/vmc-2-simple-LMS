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

/**
 * 제출물 관련 에러 코드 정의
 */
export const submissionErrorCodes = {
  // 제출 관련
  submissionNotFound: 'SUBMISSION_NOT_FOUND',
  duplicateSubmission: 'DUPLICATE_SUBMISSION',
  submissionClosed: 'SUBMISSION_CLOSED',
  
  // 권한 관련
  notEnrolled: 'NOT_ENROLLED',
  assignmentNotPublished: 'ASSIGNMENT_NOT_PUBLISHED',
  
  // 정책 관련
  lateSubmissionNotAllowed: 'LATE_SUBMISSION_NOT_ALLOWED',
  resubmissionNotAllowed: 'RESUBMISSION_NOT_ALLOWED',
  
  // 검증 관련
  contentRequired: 'CONTENT_REQUIRED',
  contentTooLong: 'CONTENT_TOO_LONG',
  invalidUrl: 'INVALID_URL',
  
  // 일반 에러
  validationError: 'VALIDATION_ERROR',
  databaseError: 'DATABASE_ERROR',
  unauthorized: 'UNAUTHORIZED',
  invalidParams: 'INVALID_PARAMS',
} as const;

export type SubmissionErrorCode = typeof submissionErrorCodes[keyof typeof submissionErrorCodes];

/**
 * 제출물 서비스 에러 타입
 */
export interface SubmissionServiceError {
  code: SubmissionErrorCode;
  message: string;
}