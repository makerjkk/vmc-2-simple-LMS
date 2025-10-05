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
  CoursesQueryParamsSchema,
  CourseParamsSchema,
  EnrollmentStatusParamsSchema,
} from './schema';
import {
  getCourses,
  getCourseById,
  getEnrollmentStatus,
} from './service';
import {
  coursesErrorCodes,
  type CoursesServiceError,
} from './error';

/**
 * 코스 관련 API 라우터 등록
 */
export const registerCoursesRoutes = (app: Hono<AppEnv>) => {
  // GET /api/courses - 코스 목록 조회 (검색, 필터, 정렬)
  app.get('/courses', async (c) => {
    const logger = getLogger(c);
    
    try {
      // 쿼리 파라미터 파싱
      const queryParams = {
        search: c.req.query('search'),
        category: c.req.query('category'),
        difficulty: c.req.query('difficulty'),
        sortBy: c.req.query('sortBy'),
        page: c.req.query('page') ? parseInt(c.req.query('page')!) : undefined,
        limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined,
      };

      const parsedParams = CoursesQueryParamsSchema.safeParse(queryParams);

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            coursesErrorCodes.invalidParams,
            'Invalid query parameters',
            parsedParams.error.format(),
          ),
        );
      }

      const supabase = getSupabase(c);
      const result = await getCourses(supabase, parsedParams.data);

      if (!result.ok) {
        const errorResult = result as ErrorResult<CoursesServiceError, unknown>;
        
        if (errorResult.error.code === coursesErrorCodes.fetchError) {
          logger.error('Failed to fetch courses', errorResult.error.message);
        }
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Courses route error:', error);
      return respond(
        c,
        failure(500, coursesErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // GET /api/courses/:id - 코스 상세 조회
  app.get('/courses/:id', async (c) => {
    const logger = getLogger(c);
    
    try {
      const parsedParams = CourseParamsSchema.safeParse({ 
        id: c.req.param('id') 
      });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            coursesErrorCodes.invalidParams,
            'Invalid course ID',
            parsedParams.error.format(),
          ),
        );
      }

      const supabase = getSupabase(c);
      
      // 사용자 ID 추출 (선택적)
      let userId: string | undefined;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      } catch (authError) {
        // 인증 오류는 무시하고 비로그인 사용자로 처리
        logger.info('User not authenticated, proceeding without user context');
      }

      const result = await getCourseById(supabase, parsedParams.data.id, userId);

      if (!result.ok) {
        const errorResult = result as ErrorResult<CoursesServiceError, unknown>;
        
        if (errorResult.error.code === coursesErrorCodes.fetchError) {
          logger.error('Failed to fetch course details', errorResult.error.message);
        }
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Course detail route error:', error);
      return respond(
        c,
        failure(500, coursesErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // GET /api/courses/:courseId/enrollment-status - 수강신청 상태 확인
  app.get('/courses/:courseId/enrollment-status', async (c) => {
    const logger = getLogger(c);
    
    try {
      const parsedParams = EnrollmentStatusParamsSchema.safeParse({ 
        courseId: c.req.param('courseId') 
      });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            coursesErrorCodes.invalidParams,
            'Invalid course ID',
            parsedParams.error.format(),
          ),
        );
      }

      const supabase = getSupabase(c);
      
      // 사용자 인증 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, coursesErrorCodes.unauthorized, 'Authentication required')
        );
      }

      const result = await getEnrollmentStatus(
        supabase, 
        parsedParams.data.courseId, 
        user.id
      );

      if (!result.ok) {
        const errorResult = result as ErrorResult<CoursesServiceError, unknown>;
        
        if (errorResult.error.code === coursesErrorCodes.fetchError) {
          logger.error('Failed to check enrollment status', errorResult.error.message);
        }
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Enrollment status route error:', error);
      return respond(
        c,
        failure(500, coursesErrorCodes.databaseError, 'Internal server error')
      );
    }
  });
};
