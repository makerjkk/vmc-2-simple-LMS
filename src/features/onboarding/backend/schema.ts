import { z } from 'zod';

/**
 * 온보딩 관련 Zod 스키마 정의
 */

// 역할 enum
export const UserRoleSchema = z.enum(['learner', 'instructor'], {
  errorMap: () => ({ message: '올바른 역할을 선택해주세요.' })
});

// 프로필 정보 스키마
export const ProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, '이름은 최소 2자 이상이어야 합니다.')
    .max(50, '이름은 최대 50자까지 입력 가능합니다.')
    .regex(/^[가-힣a-zA-Z\s]+$/, '이름은 한글 또는 영문만 입력 가능합니다.'),
  phone: z
    .string()
    .regex(/^010-\d{4}-\d{4}$/, '휴대폰 번호는 010-XXXX-XXXX 형식으로 입력해주세요.'),
  termsAgreed: z
    .boolean()
    .refine(val => val === true, '이용약관에 동의해주세요.')
});

// 회원가입 요청 스키마
export const SignupRequestSchema = z.object({
  email: z
    .string()
    .email('올바른 이메일 형식을 입력해주세요.'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
  role: UserRoleSchema,
  profile: ProfileSchema
});

// 이메일 중복 체크 요청 스키마
export const CheckEmailRequestSchema = z.object({
  email: z
    .string()
    .email('올바른 이메일 형식을 입력해주세요.')
});

// 사용자 응답 스키마
export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  phone: z.string().nullable(),
  role: UserRoleSchema,
  termsAgreedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// 회원가입 응답 스키마
export const SignupResponseSchema = z.object({
  user: UserResponseSchema,
  session: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresAt: z.number()
  }).nullable()
});

// 이메일 중복 체크 응답 스키마
export const CheckEmailResponseSchema = z.object({
  exists: z.boolean(),
  message: z.string()
});

// 역할 목록 응답 스키마
export const RolesResponseSchema = z.array(
  z.object({
    value: UserRoleSchema,
    label: z.string(),
    description: z.string()
  })
);

// 데이터베이스 사용자 테이블 스키마
export const UserTableRowSchema = z.object({
  id: z.string().uuid(),
  auth_user_id: z.string().uuid().nullable(),
  email: z.string().email(),
  full_name: z.string(),
  phone: z.string().nullable(),
  role: UserRoleSchema,
  terms_agreed_at: z.string(),
  created_at: z.string(),
  updated_at: z.string()
});

// 타입 추출
export type UserRole = z.infer<typeof UserRoleSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type CheckEmailRequest = z.infer<typeof CheckEmailRequestSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type SignupResponse = z.infer<typeof SignupResponseSchema>;
export type CheckEmailResponse = z.infer<typeof CheckEmailResponseSchema>;
export type RolesResponse = z.infer<typeof RolesResponseSchema>;
export type UserTableRow = z.infer<typeof UserTableRowSchema>;
