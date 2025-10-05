/**
 * Instructor 대시보드 관련 에러 코드 정의
 */
export const instructorDashboardErrorCodes = {
  unauthorized: 'INSTRUCTOR_DASHBOARD_UNAUTHORIZED',
  invalidRole: 'INSTRUCTOR_DASHBOARD_INVALID_ROLE',
  fetchError: 'INSTRUCTOR_DASHBOARD_FETCH_ERROR',
  databaseError: 'INSTRUCTOR_DASHBOARD_DATABASE_ERROR',
  userNotFound: 'INSTRUCTOR_DASHBOARD_USER_NOT_FOUND',
} as const;

/**
 * Instructor 대시보드 서비스 에러 타입
 */
export type InstructorDashboardServiceError = {
  code: typeof instructorDashboardErrorCodes[keyof typeof instructorDashboardErrorCodes];
  message: string;
  details?: unknown;
};
