/**
 * 온보딩 관련 에러 코드 및 타입 정의
 */

export const onboardingErrorCodes = {
  // 이메일 관련
  emailAlreadyExists: 'EMAIL_ALREADY_EXISTS',
  emailInvalid: 'EMAIL_INVALID',
  
  // 비밀번호 관련
  passwordTooWeak: 'PASSWORD_TOO_WEAK',
  passwordInvalid: 'PASSWORD_INVALID',
  
  // 프로필 관련
  profileInvalid: 'PROFILE_INVALID',
  fullNameInvalid: 'FULL_NAME_INVALID',
  phoneInvalid: 'PHONE_INVALID',
  termsNotAgreed: 'TERMS_NOT_AGREED',
  
  // 역할 관련
  roleInvalid: 'ROLE_INVALID',
  
  // 계정 생성 관련
  authAccountCreationFailed: 'AUTH_ACCOUNT_CREATION_FAILED',
  profileCreationFailed: 'PROFILE_CREATION_FAILED',
  
  // 데이터베이스 관련
  databaseError: 'DATABASE_ERROR',
  transactionFailed: 'TRANSACTION_FAILED',
  
  // 검증 관련
  validationError: 'VALIDATION_ERROR',
  
  // 일반 에러
  internalError: 'INTERNAL_ERROR',
  networkError: 'NETWORK_ERROR'
} as const;

export type OnboardingServiceError = typeof onboardingErrorCodes[keyof typeof onboardingErrorCodes];
