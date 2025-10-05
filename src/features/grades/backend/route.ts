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
  GradeParamsSchema,
} from './schema';
import {
  getUserGrades,
  getCourseGrades,
} from './service';
import {
  gradesErrorCodes,
  type GradesServiceError,
} from './error';

/**
 * 성적 조회 관련 API 라우터 등록
 */
export const registerGradesRoutes = (app: Hono<AppEnv>) => {
  // GET /api/grades - 전체 성적 조회
  app.get('/api/grades', async (c) => {
    const logger = getLogger(c);
    
    try {
      // 사용자 인증 확인
      const supabase = getSupabase(c);
      
      // Authorization 헤더에서 토큰 추출
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return respond(
          c,
          failure(401, gradesErrorCodes.unauthorized, 'Authentication required')
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, gradesErrorCodes.unauthorized, 'Authentication required')
        );
      }

      // 사용자 프로필 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        return respond(
          c,
          failure(401, gradesErrorCodes.unauthorized, 'User profile not found')
        );
      }

      // Learner 권한 확인
      if (userData.role !== 'learner') {
        return respond(
          c,
          failure(403, gradesErrorCodes.invalidRole, 'Only learners can view grades')
        );
      }

      // 성적 조회 서비스 호출
      const result = await getUserGrades(supabase, userData.id);
      
      if (!result.ok) {
        logger.error('Failed to fetch user grades', { 
          userId: userData.id, 
          errorCode: (result as ErrorResult<GradesServiceError, unknown>).error.code,
          errorMessage: (result as ErrorResult<GradesServiceError, unknown>).error.message
        });
        
        return respond(c, result);
      }

      logger.info('User grades fetched successfully', { 
        userId: userData.id,
        courseCount: result.data.courses.length 
      });

      return respond(c, result);

    } catch (error) {
      logger.error('Unexpected error in grades route', error);
      return respond(
        c,
        failure(500, gradesErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // GET /api/grades/courses/:courseId - 특정 코스 성적 조회
  app.get('/api/grades/courses/:courseId', async (c) => {
    const logger = getLogger(c);
    
    try {
      // 파라미터 검증
      const courseId = c.req.param('courseId');
      const parsedParams = GradeParamsSchema.safeParse({ courseId });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(400, gradesErrorCodes.validationError, 'Invalid course ID format')
        );
      }

      // 사용자 인증 확인
      const supabase = getSupabase(c);
      
      // Authorization 헤더에서 토큰 추출
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return respond(
          c,
          failure(401, gradesErrorCodes.unauthorized, 'Authentication required')
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, gradesErrorCodes.unauthorized, 'Authentication required')
        );
      }

      // 사용자 프로필 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        return respond(
          c,
          failure(401, gradesErrorCodes.unauthorized, 'User profile not found')
        );
      }

      // Learner 권한 확인
      if (userData.role !== 'learner') {
        return respond(
          c,
          failure(403, gradesErrorCodes.invalidRole, 'Only learners can view grades')
        );
      }

      // 코스 성적 조회 서비스 호출
      const result = await getCourseGrades(supabase, userData.id, courseId);
      
      if (!result.ok) {
        logger.error('Failed to fetch course grades', { 
          userId: userData.id,
          courseId,
          errorCode: (result as ErrorResult<GradesServiceError, unknown>).error.code,
          errorMessage: (result as ErrorResult<GradesServiceError, unknown>).error.message
        });
        
        return respond(c, result);
      }

      logger.info('Course grades fetched successfully', { 
        userId: userData.id,
        courseId,
        assignmentCount: result.data.assignments.length 
      });

      return respond(c, result);

    } catch (error) {
      logger.error('Unexpected error in course grades route', error);
      return respond(
        c,
        failure(500, gradesErrorCodes.databaseError, 'Internal server error')
      );
    }
  });
};
