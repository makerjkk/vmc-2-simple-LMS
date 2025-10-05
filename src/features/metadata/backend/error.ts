/**
 * 메타데이터 관리 관련 에러 코드 정의
 */

export const metadataErrorCodes = {
  // 조회 관련 에러
  fetchError: 'METADATA_FETCH_ERROR',
  categoryNotFound: 'METADATA_CATEGORY_NOT_FOUND',
  
  // 생성/수정 관련 에러
  createError: 'METADATA_CREATE_ERROR',
  updateError: 'METADATA_UPDATE_ERROR',
  deleteError: 'METADATA_DELETE_ERROR',
  
  // 유효성 검사 에러
  duplicateName: 'METADATA_DUPLICATE_NAME',
  nameRequired: 'METADATA_NAME_REQUIRED',
  invalidName: 'METADATA_INVALID_NAME',
  
  // 비즈니스 룰 에러
  categoryInUse: 'METADATA_CATEGORY_IN_USE',
  cannotDeleteSystemCategory: 'METADATA_CANNOT_DELETE_SYSTEM_CATEGORY',
  cannotDeactivateInUse: 'METADATA_CANNOT_DEACTIVATE_IN_USE',
  
  // 권한 관련 에러
  unauthorized: 'METADATA_UNAUTHORIZED',
  operatorOnly: 'METADATA_OPERATOR_ONLY',
  
  // 데이터베이스 에러
  databaseError: 'METADATA_DATABASE_ERROR',
  
  // 유효성 검사 에러
  invalidParams: 'METADATA_INVALID_PARAMS',
  missingRequiredFields: 'METADATA_MISSING_REQUIRED_FIELDS',
} as const;

export type MetadataServiceError = typeof metadataErrorCodes[keyof typeof metadataErrorCodes];
