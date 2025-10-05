/**
 * 신고 관련 에러 코드 정의
 */

export const reportsErrorCodes = {
  // 조회 관련 에러
  fetchError: 'REPORTS_FETCH_ERROR',
  reportNotFound: 'REPORT_NOT_FOUND',
  
  // 권한 관련 에러
  unauthorized: 'REPORTS_UNAUTHORIZED',
  operatorOnly: 'REPORTS_OPERATOR_ONLY',
  
  // 상태 관련 에러
  invalidStatus: 'REPORTS_INVALID_STATUS',
  statusTransitionError: 'REPORTS_STATUS_TRANSITION_ERROR',
  
  // 액션 관련 에러
  invalidAction: 'REPORTS_INVALID_ACTION',
  actionExecutionError: 'REPORTS_ACTION_EXECUTION_ERROR',
  actionNotAllowed: 'REPORTS_ACTION_NOT_ALLOWED',
  
  // 데이터베이스 에러
  databaseError: 'REPORTS_DATABASE_ERROR',
  
  // 유효성 검사 에러
  invalidParams: 'REPORTS_INVALID_PARAMS',
  missingRequiredFields: 'REPORTS_MISSING_REQUIRED_FIELDS',
} as const;

export type ReportsServiceError = typeof reportsErrorCodes[keyof typeof reportsErrorCodes];

/**
 * 신고 액션 관련 에러 코드 정의
 */
export const reportActionsErrorCodes = {
  // 액션 실행 에러
  actionExecutionFailed: 'REPORT_ACTION_EXECUTION_FAILED',
  invalidActionType: 'REPORT_ACTION_INVALID_TYPE',
  actionDetailsRequired: 'REPORT_ACTION_DETAILS_REQUIRED',
  
  // 대상 관련 에러
  targetNotFound: 'REPORT_ACTION_TARGET_NOT_FOUND',
  targetAlreadyProcessed: 'REPORT_ACTION_TARGET_ALREADY_PROCESSED',
  
  // 권한 에러
  insufficientPermissions: 'REPORT_ACTION_INSUFFICIENT_PERMISSIONS',
} as const;

export type ReportActionsServiceError = typeof reportActionsErrorCodes[keyof typeof reportActionsErrorCodes];
