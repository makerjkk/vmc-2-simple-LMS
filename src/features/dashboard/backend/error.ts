/**
 * 대시보드 관련 에러 코드 정의
 */
export const dashboardErrorCodes = {
  fetchError: 'DASHBOARD_FETCH_ERROR',
  noEnrollments: 'DASHBOARD_NO_ENROLLMENTS',
  unauthorized: 'DASHBOARD_UNAUTHORIZED',
  invalidRole: 'DASHBOARD_INVALID_ROLE',
  userNotFound: 'DASHBOARD_USER_NOT_FOUND',
  databaseError: 'DASHBOARD_DATABASE_ERROR',
} as const;

/**
 * 대시보드 서비스 에러 타입
 */
export type DashboardServiceError = {
  code: typeof dashboardErrorCodes[keyof typeof dashboardErrorCodes];
  message: string;
  details?: unknown;
};
