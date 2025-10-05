// 코스 관련 에러 코드 정의
export const coursesErrorCodes = {
  fetchError: 'COURSES_FETCH_ERROR',
  notFound: 'COURSE_NOT_FOUND',
  validationError: 'COURSES_VALIDATION_ERROR',
  unauthorized: 'COURSES_UNAUTHORIZED',
  invalidParams: 'COURSES_INVALID_PARAMS',
  databaseError: 'COURSES_DATABASE_ERROR',
} as const;

// 코스 서비스 에러 타입
export type CoursesServiceError = typeof coursesErrorCodes[keyof typeof coursesErrorCodes];
