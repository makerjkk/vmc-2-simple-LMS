// 수강신청 관련 에러 코드 정의
export const enrollmentsErrorCodes = {
  duplicateEnrollment: 'DUPLICATE_ENROLLMENT',
  courseNotAvailable: 'COURSE_NOT_AVAILABLE',
  enrollmentNotFound: 'ENROLLMENT_NOT_FOUND',
  unauthorized: 'ENROLLMENTS_UNAUTHORIZED',
  invalidParams: 'ENROLLMENTS_INVALID_PARAMS',
  databaseError: 'ENROLLMENTS_DATABASE_ERROR',
  courseNotFound: 'COURSE_NOT_FOUND_FOR_ENROLLMENT',
  userNotFound: 'USER_NOT_FOUND_FOR_ENROLLMENT',
  validationError: 'ENROLLMENTS_VALIDATION_ERROR',
} as const;

// 수강신청 서비스 에러 타입
export type EnrollmentsServiceError = typeof enrollmentsErrorCodes[keyof typeof enrollmentsErrorCodes];
