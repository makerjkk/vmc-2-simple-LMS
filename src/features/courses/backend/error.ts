// 코스 관련 에러 코드 정의
export const coursesErrorCodes = {
  fetchError: 'COURSES_FETCH_ERROR',
  notFound: 'COURSE_NOT_FOUND',
  validationError: 'COURSES_VALIDATION_ERROR',
  unauthorized: 'COURSES_UNAUTHORIZED',
  invalidParams: 'COURSES_INVALID_PARAMS',
  databaseError: 'COURSES_DATABASE_ERROR',
  // Course Management 관련 에러 코드들
  notOwner: 'COURSE_MANAGEMENT_NOT_OWNER',
  invalidStatus: 'COURSE_MANAGEMENT_INVALID_STATUS',
  titleDuplicate: 'COURSE_MANAGEMENT_TITLE_DUPLICATE',
  publishRequirements: 'COURSE_MANAGEMENT_PUBLISH_REQUIREMENTS',
  hasEnrollments: 'COURSE_MANAGEMENT_HAS_ENROLLMENTS',
  createError: 'COURSE_MANAGEMENT_CREATE_ERROR',
  updateError: 'COURSE_MANAGEMENT_UPDATE_ERROR',
  statusUpdateError: 'COURSE_MANAGEMENT_STATUS_UPDATE_ERROR',
  categoryNotFound: 'COURSE_MANAGEMENT_CATEGORY_NOT_FOUND',
} as const;

// 코스 서비스 에러 타입
export type CoursesServiceError = typeof coursesErrorCodes[keyof typeof coursesErrorCodes];
