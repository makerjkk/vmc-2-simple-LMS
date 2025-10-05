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
  EnrollmentRequestSchema,
  EnrollmentDeleteParamsSchema,
} from './schema';
import {
  createEnrollment,
  deleteEnrollment,
  getUserEnrollments,
} from './service';
import {
  enrollmentsErrorCodes,
  type EnrollmentsServiceError,
} from './error';

/**
 * 수강신청 관련 API 라우터 등록
 */
export const registerEnrollmentsRoutes = (app: Hono<AppEnv>) => {
  // POST /api/enrollments - 수강신청
  app.post('/enrollments', async (c) => {
    const logger = getLogger(c);
    
    try {
      // 사용자 인증 확인
      const supabase = getSupabase(c);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, enrollmentsErrorCodes.unauthorized, 'Authentication required')
        );
      }

      // 사용자 역할 확인 (Learner만 수강신청 가능)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        return respond(
          c,
          failure(401, enrollmentsErrorCodes.unauthorized, 'User profile not found')
        );
      }

      if (userData.role !== 'learner') {
        return respond(
          c,
          failure(403, enrollmentsErrorCodes.unauthorized, 'Only learners can enroll in courses')
        );
      }

      // 요청 본문 파싱
      const body = await c.req.json();
      const parsedBody = EnrollmentRequestSchema.safeParse(body);

      if (!parsedBody.success) {
        return respond(
          c,
          failure(
            400,
            enrollmentsErrorCodes.invalidParams,
            'Invalid request body',
            parsedBody.error.format(),
          ),
        );
      }

      // 사용자 ID 조회 (public.users 테이블의 ID)
      const { data: userProfileData, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError || !userProfileData) {
        return respond(
          c,
          failure(401, enrollmentsErrorCodes.userNotFound, 'User profile not found')
        );
      }

      const result = await createEnrollment(
        supabase,
        parsedBody.data.courseId,
        userProfileData.id
      );

      if (!result.ok) {
        const errorResult = result as ErrorResult<EnrollmentsServiceError, unknown>;
        
        if (errorResult.error.code === enrollmentsErrorCodes.databaseError) {
          logger.error('Failed to create enrollment', errorResult.error.message);
        }
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Enrollment creation route error:', error);
      return respond(
        c,
        failure(500, enrollmentsErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // DELETE /api/enrollments/:courseId - 수강취소
  app.delete('/enrollments/:courseId', async (c) => {
    const logger = getLogger(c);
    
    try {
      // 사용자 인증 확인
      const supabase = getSupabase(c);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, enrollmentsErrorCodes.unauthorized, 'Authentication required')
        );
      }

      // 파라미터 파싱
      const parsedParams = EnrollmentDeleteParamsSchema.safeParse({ 
        courseId: c.req.param('courseId') 
      });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            enrollmentsErrorCodes.invalidParams,
            'Invalid course ID',
            parsedParams.error.format(),
          ),
        );
      }

      // 사용자 역할 확인 (Learner만 수강취소 가능)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        return respond(
          c,
          failure(401, enrollmentsErrorCodes.unauthorized, 'User profile not found')
        );
      }

      if (userData.role !== 'learner') {
        return respond(
          c,
          failure(403, enrollmentsErrorCodes.unauthorized, 'Only learners can cancel enrollments')
        );
      }

      // 사용자 ID 조회 (public.users 테이블의 ID)
      const { data: userProfileData, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError || !userProfileData) {
        return respond(
          c,
          failure(401, enrollmentsErrorCodes.userNotFound, 'User profile not found')
        );
      }

      const result = await deleteEnrollment(
        supabase,
        parsedParams.data.courseId,
        userProfileData.id
      );

      if (!result.ok) {
        const errorResult = result as ErrorResult<EnrollmentsServiceError, unknown>;
        
        if (errorResult.error.code === enrollmentsErrorCodes.databaseError) {
          logger.error('Failed to cancel enrollment', errorResult.error.message);
        }
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Enrollment cancellation route error:', error);
      return respond(
        c,
        failure(500, enrollmentsErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // GET /api/enrollments - 사용자의 수강신청 목록 조회
  app.get('/enrollments', async (c) => {
    const logger = getLogger(c);
    
    try {
      // 사용자 인증 확인
      const supabase = getSupabase(c);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, enrollmentsErrorCodes.unauthorized, 'Authentication required')
        );
      }

      // 사용자 ID 조회 (public.users 테이블의 ID)
      const { data: userProfileData, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError || !userProfileData) {
        return respond(
          c,
          failure(401, enrollmentsErrorCodes.userNotFound, 'User profile not found')
        );
      }

      const result = await getUserEnrollments(supabase, userProfileData.id);

      if (!result.ok) {
        const errorResult = result as ErrorResult<EnrollmentsServiceError, unknown>;
        
        if (errorResult.error.code === enrollmentsErrorCodes.databaseError) {
          logger.error('Failed to fetch user enrollments', errorResult.error.message);
        }
      }

      return respond(c, result);

    } catch (error) {
      logger.error('User enrollments route error:', error);
      return respond(
        c,
        failure(500, enrollmentsErrorCodes.databaseError, 'Internal server error')
      );
    }
  });
};
