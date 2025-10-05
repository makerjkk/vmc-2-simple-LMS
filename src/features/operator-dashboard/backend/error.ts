/**
 * 운영자 대시보드 관련 에러 코드 정의
 */

export const operatorDashboardErrorCodes = {
  // 조회 관련 에러
  fetchError: 'OPERATOR_DASHBOARD_FETCH_ERROR',
  statsCalculationError: 'OPERATOR_DASHBOARD_STATS_CALCULATION_ERROR',
  
  // 권한 관련 에러
  unauthorized: 'OPERATOR_DASHBOARD_UNAUTHORIZED',
  operatorOnly: 'OPERATOR_DASHBOARD_OPERATOR_ONLY',
  
  // 데이터베이스 에러
  databaseError: 'OPERATOR_DASHBOARD_DATABASE_ERROR',
  
  // 유효성 검사 에러
  invalidParams: 'OPERATOR_DASHBOARD_INVALID_PARAMS',
} as const;

export type OperatorDashboardServiceError = typeof operatorDashboardErrorCodes[keyof typeof operatorDashboardErrorCodes];
