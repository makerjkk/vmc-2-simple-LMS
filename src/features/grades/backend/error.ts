/**
 * 성적 조회 관련 에러 코드 정의
 */

export const gradesErrorCodes = {
  unauthorized: 'GRADES_UNAUTHORIZED',
  userNotFound: 'GRADES_USER_NOT_FOUND',
  invalidRole: 'GRADES_INVALID_ROLE',
  courseNotFound: 'GRADES_COURSE_NOT_FOUND',
  notEnrolled: 'GRADES_NOT_ENROLLED',
  fetchError: 'GRADES_FETCH_ERROR',
  databaseError: 'GRADES_DATABASE_ERROR',
  validationError: 'GRADES_VALIDATION_ERROR',
  // 채점 이력 관련 에러 코드 추가
  submissionNotFound: 'GRADES_SUBMISSION_NOT_FOUND',
} as const;

export type GradesServiceError = typeof gradesErrorCodes[keyof typeof gradesErrorCodes];
