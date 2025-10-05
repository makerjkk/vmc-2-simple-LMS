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
  CreateCourseRequestSchema,
  UpdateCourseRequestSchema,
  CourseStatusUpdateSchema,
  InstructorCoursesQuerySchema,
} from './schema';
import {
  getCourses,
  getCourseById,
  getEnrollmentStatus,
  getInstructorCourses,
  createCourse,
  updateCourse,
  updateCourseStatus,
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
  app.get('/api/courses', async (c) => {
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
      
      // 사용자 인증 확인 (선택적)
      let userId: string | undefined;
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          // public.users 테이블에서 사용자 ID 조회
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();
          
          if (userData) {
            userId = userData.id;
          }
        }
      }
      
      const result = await getCourses(supabase, parsedParams.data, userId);

      if (!result.ok) {
        const errorResult = result as ErrorResult<CoursesServiceError, unknown>;
        
        if (errorResult.error.code === coursesErrorCodes.fetchError) {
          logger.error('Failed to fetch courses', errorResult.error.message);
        }
        
        return respond(c, result);
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
  app.get('/api/courses/:id', async (c) => {
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
        const authHeader = c.req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.replace('Bearer ', '');
          const { data: { user } } = await supabase.auth.getUser(token);
          
          if (user?.id) {
            // public.users 테이블에서 내부 ID 조회
            const { data: userData } = await supabase
              .from('users')
              .select('id')
              .eq('auth_user_id', user.id)
              .single();
            
            userId = userData?.id;
          }
        }
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
  app.get('/api/courses/:courseId/enrollment-status', async (c) => {
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
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return respond(
          c,
          failure(401, coursesErrorCodes.unauthorized, 'Authentication required')
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, coursesErrorCodes.unauthorized, 'Invalid authentication token')
        );
      }

      // public.users 테이블에서 사용자 정보 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        logger.error('User not found in public.users table:', userError);
        return respond(
          c,
          failure(404, coursesErrorCodes.fetchError, 'User not found')
        );
      }

      const result = await getEnrollmentStatus(
        supabase, 
        parsedParams.data.courseId, 
        userData.id // public.users 테이블의 내부 ID 사용
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

  // Course Management API 엔드포인트들

  // GET /api/instructor/courses - 강사의 코스 목록 조회
  app.get('/api/instructor/courses', async (c) => {
    const logger = getLogger(c);
    
    try {
      const supabase = getSupabase(c);
      
      // 사용자 인증 및 강사 권한 확인
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return respond(
          c,
          failure(401, coursesErrorCodes.unauthorized, '인증이 필요합니다.')
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, coursesErrorCodes.unauthorized, '유효하지 않은 인증 토큰입니다.')
        );
      }

      // 사용자 역할 확인
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData || userData.role !== 'instructor') {
        return respond(
          c,
          failure(403, coursesErrorCodes.unauthorized, '강사 권한이 필요합니다.')
        );
      }

      // 쿼리 파라미터 파싱
      const queryParams = {
        status: c.req.query('status'),
        page: c.req.query('page') ? parseInt(c.req.query('page')!) : undefined,
        limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined,
      };

      const parsedParams = InstructorCoursesQuerySchema.safeParse(queryParams);

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            coursesErrorCodes.invalidParams,
            '잘못된 쿼리 파라미터입니다.',
            parsedParams.error.format(),
          ),
        );
      }

      const result = await getInstructorCourses(supabase, userData.id, parsedParams.data);

      if (!result.ok) {
        const errorResult = result as ErrorResult<CoursesServiceError, unknown>;
        
        if (errorResult.error.code === coursesErrorCodes.fetchError) {
          logger.error('Failed to fetch instructor courses', errorResult.error.message);
        }
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Instructor courses route error:', error);
      return respond(
        c,
        failure(500, coursesErrorCodes.databaseError, '서버 내부 오류가 발생했습니다.')
      );
    }
  });

  // POST /api/instructor/courses - 새 코스 생성
  app.post('/api/instructor/courses', async (c) => {
    const logger = getLogger(c);
    
    try {
      const supabase = getSupabase(c);
      
      // 사용자 인증 및 강사 권한 확인
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return respond(
          c,
          failure(401, coursesErrorCodes.unauthorized, '인증이 필요합니다.')
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, coursesErrorCodes.unauthorized, '유효하지 않은 인증 토큰입니다.')
        );
      }

      // 사용자 역할 확인
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData || userData.role !== 'instructor') {
        return respond(
          c,
          failure(403, coursesErrorCodes.unauthorized, '강사 권한이 필요합니다.')
        );
      }

      // 요청 본문 파싱
      const body = await c.req.json();
      const parsedBody = CreateCourseRequestSchema.safeParse(body);

      if (!parsedBody.success) {
        return respond(
          c,
          failure(
            400,
            coursesErrorCodes.validationError,
            '잘못된 요청 데이터입니다.',
            parsedBody.error.format(),
          ),
        );
      }

      const result = await createCourse(supabase, userData.id, parsedBody.data);

      if (!result.ok) {
        const errorResult = result as ErrorResult<CoursesServiceError, unknown>;
        
        if (errorResult.error.code === coursesErrorCodes.createError ||
            errorResult.error.code === coursesErrorCodes.titleDuplicate ||
            errorResult.error.code === coursesErrorCodes.categoryNotFound) {
          logger.error('Failed to create course', errorResult.error.message);
        }
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Create course route error:', error);
      return respond(
        c,
        failure(500, coursesErrorCodes.databaseError, '서버 내부 오류가 발생했습니다.')
      );
    }
  });

  // PUT /api/instructor/courses/:id - 코스 수정
  app.put('/api/instructor/courses/:id', async (c) => {
    const logger = getLogger(c);
    
    try {
      const supabase = getSupabase(c);
      
      // 사용자 인증 및 강사 권한 확인
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return respond(
          c,
          failure(401, coursesErrorCodes.unauthorized, '인증이 필요합니다.')
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, coursesErrorCodes.unauthorized, '유효하지 않은 인증 토큰입니다.')
        );
      }

      // 사용자 역할 확인
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData || userData.role !== 'instructor') {
        return respond(
          c,
          failure(403, coursesErrorCodes.unauthorized, '강사 권한이 필요합니다.')
        );
      }

      // 코스 ID 파싱
      const courseId = c.req.param('id');
      const parsedParams = CourseParamsSchema.safeParse({ id: courseId });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            coursesErrorCodes.invalidParams,
            '잘못된 코스 ID입니다.',
            parsedParams.error.format(),
          ),
        );
      }

      // 요청 본문 파싱
      const body = await c.req.json();
      const parsedBody = UpdateCourseRequestSchema.safeParse(body);

      if (!parsedBody.success) {
        return respond(
          c,
          failure(
            400,
            coursesErrorCodes.validationError,
            '잘못된 요청 데이터입니다.',
            parsedBody.error.format(),
          ),
        );
      }

      const result = await updateCourse(supabase, courseId, userData.id, parsedBody.data);

      if (!result.ok) {
        const errorResult = result as ErrorResult<CoursesServiceError, unknown>;
        
        if (errorResult.error.code === coursesErrorCodes.updateError ||
            errorResult.error.code === coursesErrorCodes.notOwner ||
            errorResult.error.code === coursesErrorCodes.titleDuplicate ||
            errorResult.error.code === coursesErrorCodes.categoryNotFound) {
          logger.error('Failed to update course', errorResult.error.message);
        }
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Update course route error:', error);
      return respond(
        c,
        failure(500, coursesErrorCodes.databaseError, '서버 내부 오류가 발생했습니다.')
      );
    }
  });

  // PATCH /api/instructor/courses/:id/status - 코스 상태 변경
  app.patch('/api/instructor/courses/:id/status', async (c) => {
    const logger = getLogger(c);
    
    try {
      const supabase = getSupabase(c);
      
      // 사용자 인증 및 강사 권한 확인
      const authHeader = c.req.header('Authorization');
      logger.info('Auth header:', { authHeader: authHeader ? 'Present' : 'Missing' });
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.error('Missing or invalid auth header');
        return respond(
          c,
          failure(401, coursesErrorCodes.unauthorized, '인증이 필요합니다.')
        );
      }

      const token = authHeader.replace('Bearer ', '');
      logger.info('Extracted token length:', token.length);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        logger.error('Auth error:', { authError, hasUser: !!user });
        return respond(
          c,
          failure(401, coursesErrorCodes.unauthorized, '유효하지 않은 인증 토큰입니다.')
        );
      }

      logger.info('User authenticated:', { userId: user.id });

      // 사용자 역할 확인
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData || userData.role !== 'instructor') {
        return respond(
          c,
          failure(403, coursesErrorCodes.unauthorized, '강사 권한이 필요합니다.')
        );
      }

      // 코스 ID 파싱
      const courseId = c.req.param('id');
      const parsedParams = CourseParamsSchema.safeParse({ id: courseId });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            coursesErrorCodes.invalidParams,
            '잘못된 코스 ID입니다.',
            parsedParams.error.format(),
          ),
        );
      }

      // 요청 본문 파싱
      const body = await c.req.json();
      const parsedBody = CourseStatusUpdateSchema.safeParse(body);

      if (!parsedBody.success) {
        return respond(
          c,
          failure(
            400,
            coursesErrorCodes.validationError,
            '잘못된 상태 값입니다.',
            parsedBody.error.format(),
          ),
        );
      }

      const result = await updateCourseStatus(supabase, courseId, userData.id, parsedBody.data.status);

      if (!result.ok) {
        const errorResult = result as ErrorResult<CoursesServiceError, unknown>;
        
        if (errorResult.error.code === coursesErrorCodes.statusUpdateError ||
            errorResult.error.code === coursesErrorCodes.notOwner ||
            errorResult.error.code === coursesErrorCodes.invalidStatus ||
            errorResult.error.code === coursesErrorCodes.publishRequirements) {
          logger.error('Failed to update course status', errorResult.error.message);
        }
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Update course status route error:', error);
      return respond(
        c,
        failure(500, coursesErrorCodes.databaseError, '서버 내부 오류가 발생했습니다.')
      );
    }
  });
};
