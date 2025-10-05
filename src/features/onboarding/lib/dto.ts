/**
 * 온보딩 관련 DTO (Data Transfer Object) 재노출
 * 프론트엔드에서 백엔드 스키마를 재사용하기 위한 파일
 */

// 백엔드 스키마 재노출
export {
  UserRoleSchema,
  ProfileSchema,
  SignupRequestSchema,
  CheckEmailRequestSchema,
  UserResponseSchema,
  SignupResponseSchema,
  CheckEmailResponseSchema,
  RolesResponseSchema,
  type UserRole,
  type Profile,
  type SignupRequest,
  type CheckEmailRequest,
  type UserResponse,
  type SignupResponse,
  type CheckEmailResponse,
  type RolesResponse,
} from '../backend/schema';

// 에러 코드 재노출
export {
  onboardingErrorCodes,
  type OnboardingServiceError,
} from '../backend/error';
