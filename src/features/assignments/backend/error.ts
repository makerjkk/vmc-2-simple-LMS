/**
 * 과제 관련 에러 코드 정의
 */
export const assignmentErrorCodes = {
  // 기본 조회 관련
  notFound: 'ASSIGNMENT_NOT_FOUND',
  notPublished: 'ASSIGNMENT_NOT_PUBLISHED',
  notEnrolled: 'NOT_ENROLLED_IN_COURSE',
  unauthorized: 'UNAUTHORIZED',
  invalidParams: 'INVALID_PARAMS',
  fetchError: 'FETCH_ERROR',
  databaseError: 'DATABASE_ERROR',
  
  // 강사 권한 관련
  notInstructor: 'NOT_INSTRUCTOR',
  notCourseOwner: 'NOT_COURSE_OWNER',
  courseNotFound: 'COURSE_NOT_FOUND',
  
  // 과제 관리 관련
  createFailed: 'CREATE_ASSIGNMENT_FAILED',
  updateFailed: 'UPDATE_ASSIGNMENT_FAILED',
  deleteFailed: 'DELETE_ASSIGNMENT_FAILED',
  statusUpdateFailed: 'STATUS_UPDATE_FAILED',
  
  // 비즈니스 룰 관련
  scoreWeightExceeded: 'SCORE_WEIGHT_EXCEEDED',
  invalidStatusTransition: 'INVALID_STATUS_TRANSITION',
  cannotDeleteWithSubmissions: 'CANNOT_DELETE_WITH_SUBMISSIONS',
  cannotEditPublishedAssignment: 'CANNOT_EDIT_PUBLISHED_ASSIGNMENT',
  
  // 스케줄러 관련
  schedulerNotAuthorized: 'ASSIGNMENT_SCHEDULER_NOT_AUTHORIZED',
  schedulerExecutionFailed: 'ASSIGNMENT_SCHEDULER_EXECUTION_FAILED',
  schedulerAlreadyRunning: 'ASSIGNMENT_SCHEDULER_ALREADY_RUNNING',
  autoCloseFailed: 'ASSIGNMENT_AUTO_CLOSE_FAILED',
  
  // 로그 관련
  logCreationFailed: 'ASSIGNMENT_LOG_CREATION_FAILED',
  logAccessDenied: 'ASSIGNMENT_LOG_ACCESS_DENIED',
  logNotFound: 'ASSIGNMENT_LOG_NOT_FOUND',
  logQueryFailed: 'ASSIGNMENT_LOG_QUERY_FAILED',
  
  // 동시성 관련
  concurrentModification: 'ASSIGNMENT_CONCURRENT_MODIFICATION',
  optimisticLockFailed: 'ASSIGNMENT_OPTIMISTIC_LOCK_FAILED',
  resourceLocked: 'ASSIGNMENT_RESOURCE_LOCKED',
  
  // 검증 관련
  validationError: 'VALIDATION_ERROR',
  titleRequired: 'TITLE_REQUIRED',
  descriptionRequired: 'DESCRIPTION_REQUIRED',
  dueDateRequired: 'DUE_DATE_REQUIRED',
  scoreWeightRequired: 'SCORE_WEIGHT_REQUIRED',
  invalidScoreWeight: 'INVALID_SCORE_WEIGHT',
  pastDueDate: 'PAST_DUE_DATE',
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

/**
 * 채점 관련 에러 코드 정의
 */
export const gradingErrorCodes = {
  // 권한 관련
  notInstructorOwned: 'GRADING_NOT_INSTRUCTOR_OWNED',
  submissionNotFound: 'GRADING_SUBMISSION_NOT_FOUND',
  assignmentNotFound: 'GRADING_ASSIGNMENT_NOT_FOUND',
  unauthorizedGrader: 'GRADING_UNAUTHORIZED_GRADER',
  
  // 유효성 검증
  invalidScore: 'GRADING_INVALID_SCORE',
  feedbackRequired: 'GRADING_FEEDBACK_REQUIRED',
  feedbackTooLong: 'GRADING_FEEDBACK_TOO_LONG',
  invalidAction: 'GRADING_INVALID_ACTION',
  
  // 상태 관련
  alreadyGraded: 'GRADING_ALREADY_GRADED',
  submissionNotSubmitted: 'GRADING_SUBMISSION_NOT_SUBMITTED',
  cannotGradeOwnSubmission: 'GRADING_CANNOT_GRADE_OWN_SUBMISSION',
  assignmentClosed: 'GRADING_ASSIGNMENT_CLOSED',
  
  // 시스템 오류
  gradingFailed: 'GRADING_FAILED',
  logCreationFailed: 'GRADING_LOG_CREATION_FAILED',
  databaseError: 'GRADING_DATABASE_ERROR',
  
  // 일반 에러
  validationError: 'GRADING_VALIDATION_ERROR',
  unauthorized: 'GRADING_UNAUTHORIZED',
  invalidParams: 'GRADING_INVALID_PARAMS',
} as const;

export type GradingErrorCode = typeof gradingErrorCodes[keyof typeof gradingErrorCodes];

/**
 * 채점 서비스 에러 타입
 */
export interface GradingServiceError {
  code: GradingErrorCode;
  message: string;
}