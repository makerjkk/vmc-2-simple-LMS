import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  SignupRequestSchema,
  CheckEmailRequestSchema,
} from './schema';
import {
  createUserAccount,
  checkEmailExists,
  getRoles,
} from './service';
import {
  onboardingErrorCodes,
  type OnboardingServiceError,
} from './error';

/**
 * 온보딩 관련 API 라우트 등록
 */
export const registerOnboardingRoutes = (app: Hono<AppEnv>) => {
  // POST /api/onboarding/signup - 회원가입
  app.post('/api/onboarding/signup', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const body = await c.req.json();
      
      // 요청 데이터 검증
      const parsedBody = SignupRequestSchema.safeParse(body);
      if (!parsedBody.success) {
        return respond(
          c,
          failure(
            400,
            onboardingErrorCodes.validationError,
            '입력 데이터가 올바르지 않습니다.',
            parsedBody.error.format(),
          ),
        );
      }

      // 회원가입 처리
      const result = await createUserAccount(supabase, parsedBody.data);

      if (!result.ok) {
        const errorResult = result as ErrorResult<OnboardingServiceError, unknown>;
        
        // 에러 로깅
        if (errorResult.error.code === onboardingErrorCodes.authAccountCreationFailed ||
            errorResult.error.code === onboardingErrorCodes.profileCreationFailed ||
            errorResult.error.code === onboardingErrorCodes.databaseError) {
          logger.error('Signup failed', {
            error: errorResult.error,
            email: parsedBody.data.email,
            role: parsedBody.data.role,
          });
        }

        return respond(c, result);
      }

      logger.info('User signup successful', {
        userId: result.data.id,
        email: result.data.email,
        role: result.data.role,
      });

      return respond(c, result);
    } catch (error) {
      logger.error('Signup request processing failed', error);
      return respond(
        c,
        failure(500, onboardingErrorCodes.internalError, '회원가입 처리 중 오류가 발생했습니다.'),
      );
    }
  });

  // POST /api/onboarding/check-email - 이메일 중복 체크
  app.post('/api/onboarding/check-email', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const body = await c.req.json();
      
      // 요청 데이터 검증
      const parsedBody = CheckEmailRequestSchema.safeParse(body);
      if (!parsedBody.success) {
        return respond(
          c,
          failure(
            400,
            onboardingErrorCodes.emailInvalid,
            '이메일 형식이 올바르지 않습니다.',
            parsedBody.error.format(),
          ),
        );
      }

      // 이메일 중복 체크
      const result = await checkEmailExists(supabase, parsedBody.data.email);

      if (!result.ok) {
        const errorResult = result as ErrorResult<OnboardingServiceError, unknown>;
        
        // 에러 로깅
        if (errorResult.error.code === onboardingErrorCodes.databaseError) {
          logger.error('Email check failed', {
            error: errorResult.error,
            email: parsedBody.data.email,
          });
        }

        return respond(c, result);
      }

      return respond(c, result);
    } catch (error) {
      logger.error('Email check request processing failed', error);
      return respond(
        c,
        failure(500, onboardingErrorCodes.internalError, '이메일 중복 체크 중 오류가 발생했습니다.'),
      );
    }
  });

  // GET /api/onboarding/roles - 역할 목록 조회
  app.get('/api/onboarding/roles', async (c) => {
    const logger = getLogger(c);

    try {
      // 역할 목록 조회
      const result = await getRoles();

      if (!result.ok) {
        const errorResult = result as ErrorResult<OnboardingServiceError, unknown>;
        logger.error('Roles fetch failed', errorResult.error);
        return respond(c, result);
      }

      return respond(c, result);
    } catch (error) {
      logger.error('Roles request processing failed', error);
      return respond(
        c,
        failure(500, onboardingErrorCodes.internalError, '역할 목록 조회 중 오류가 발생했습니다.'),
      );
    }
  });
};
