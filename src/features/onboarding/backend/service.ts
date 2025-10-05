import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  SignupRequestSchema,
  CheckEmailRequestSchema,
  UserResponseSchema,
  CheckEmailResponseSchema,
  RolesResponseSchema,
  UserTableRowSchema,
  type SignupRequest,
  type CheckEmailRequest,
  type UserResponse,
  type CheckEmailResponse,
  type RolesResponse,
  type UserTableRow,
} from './schema';
import {
  onboardingErrorCodes,
  type OnboardingServiceError,
} from './error';

/**
 * 이메일 중복 체크 서비스
 */
export const checkEmailExists = async (
  client: SupabaseClient,
  email: string,
): Promise<HandlerResult<CheckEmailResponse, OnboardingServiceError, unknown>> => {
  try {
    // 요청 데이터 검증
    const parsedRequest = CheckEmailRequestSchema.safeParse({ email });
    if (!parsedRequest.success) {
      return failure(400, onboardingErrorCodes.emailInvalid, '이메일 형식이 올바르지 않습니다.');
    }

    // Supabase Auth에서 이메일 확인
    const { data: authData, error: authError } = await client.auth.admin.listUsers();
    if (authError) {
      return failure(500, onboardingErrorCodes.databaseError, 'Auth 사용자 조회 중 오류가 발생했습니다.');
    }

    const authEmailExists = authData.users.some(user => user.email === email);

    // public.users 테이블에서도 확인
    const { data: userData, error: userError } = await client
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (userError) {
      return failure(500, onboardingErrorCodes.databaseError, '사용자 조회 중 오류가 발생했습니다.');
    }

    const exists = authEmailExists || !!userData;
    const message = exists ? '이미 사용 중인 이메일입니다.' : '사용 가능한 이메일입니다.';

    const response: CheckEmailResponse = { exists, message };
    
    const parsedResponse = CheckEmailResponseSchema.safeParse(response);
    if (!parsedResponse.success) {
      return failure(500, onboardingErrorCodes.validationError, '응답 데이터 검증에 실패했습니다.');
    }

    return success(parsedResponse.data);
  } catch (error) {
    return failure(500, onboardingErrorCodes.internalError, '이메일 중복 체크 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 계정 생성 서비스
 */
export const createUserAccount = async (
  client: SupabaseClient,
  data: SignupRequest,
): Promise<HandlerResult<UserResponse, OnboardingServiceError, unknown>> => {
  try {
    // 요청 데이터 검증
    const parsedRequest = SignupRequestSchema.safeParse(data);
    if (!parsedRequest.success) {
      return failure(400, onboardingErrorCodes.validationError, '입력 데이터가 올바르지 않습니다.');
    }

    const { email, password, role, profile } = parsedRequest.data;

    // 1. 이메일 중복 체크
    const emailCheckResult = await checkEmailExists(client, email);
    if (!emailCheckResult.ok) {
      return failure(500, onboardingErrorCodes.emailInvalid, '이메일 확인 중 오류가 발생했습니다.');
    }

    if (emailCheckResult.data.exists) {
      return failure(409, onboardingErrorCodes.emailAlreadyExists, '이미 사용 중인 이메일입니다.');
    }

    // 2. Supabase Auth 계정 생성
    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 개발 환경에서는 자동 확인
    });

    if (authError || !authData.user) {
      return failure(500, onboardingErrorCodes.authAccountCreationFailed, 'Auth 계정 생성에 실패했습니다.');
    }

    // 3. 프로필 정보 저장
    const userRecord = {
      id: crypto.randomUUID(),
      auth_user_id: authData.user.id,
      email,
      full_name: profile.fullName,
      phone: profile.phone,
      role,
      terms_agreed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: userData, error: userError } = await client
      .from('users')
      .insert(userRecord)
      .select()
      .single();

    if (userError || !userData) {
      // Auth 계정 생성은 성공했지만 프로필 저장 실패 시 Auth 계정 삭제
      await client.auth.admin.deleteUser(authData.user.id);
      return failure(500, onboardingErrorCodes.profileCreationFailed, '프로필 정보 저장에 실패했습니다.');
    }

    // 4. 응답 데이터 검증 및 변환
    const parsedUserData = UserTableRowSchema.safeParse(userData);
    if (!parsedUserData.success) {
      return failure(500, onboardingErrorCodes.validationError, '사용자 데이터 검증에 실패했습니다.');
    }

    const userResponse: UserResponse = {
      id: parsedUserData.data.id,
      email: parsedUserData.data.email,
      fullName: parsedUserData.data.full_name,
      phone: parsedUserData.data.phone,
      role: parsedUserData.data.role,
      termsAgreedAt: parsedUserData.data.terms_agreed_at,
      createdAt: parsedUserData.data.created_at,
      updatedAt: parsedUserData.data.updated_at,
    };

    const parsedResponse = UserResponseSchema.safeParse(userResponse);
    if (!parsedResponse.success) {
      return failure(500, onboardingErrorCodes.validationError, '응답 데이터 검증에 실패했습니다.');
    }

    return success(parsedResponse.data);
  } catch (error) {
    return failure(500, onboardingErrorCodes.internalError, '계정 생성 중 오류가 발생했습니다.');
  }
};

/**
 * 사용 가능한 역할 목록 조회
 */
export const getRoles = async (): Promise<HandlerResult<RolesResponse, OnboardingServiceError, unknown>> => {
  try {
    const roles: RolesResponse = [
      {
        value: 'learner',
        label: '학습자',
        description: '코스를 수강하고 과제를 제출할 수 있습니다.',
      },
      {
        value: 'instructor',
        label: '강사',
        description: '코스를 개설하고 과제를 관리할 수 있습니다.',
      },
    ];

    const parsedResponse = RolesResponseSchema.safeParse(roles);
    if (!parsedResponse.success) {
      return failure(500, onboardingErrorCodes.validationError, '역할 데이터 검증에 실패했습니다.');
    }

    return success(parsedResponse.data);
  } catch (error) {
    return failure(500, onboardingErrorCodes.internalError, '역할 목록 조회 중 오류가 발생했습니다.');
  }
};
