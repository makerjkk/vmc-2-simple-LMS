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
  AssignmentParamsSchema,
  CreateSubmissionRequestSchema,
  UpdateSubmissionRequestSchema,
  // 강사용 스키마 추가
  CreateAssignmentRequestSchema,
  UpdateAssignmentRequestSchema,
  AssignmentStatusUpdateSchema,
  InstructorAssignmentsQuerySchema,
  AssignmentSubmissionsQuerySchema,
  CourseParamsSchema,
  // 채점 관련 스키마 추가
  GradeSubmissionRequestSchema,
  SubmissionParamsSchema,
} from './schema';
import {
  getAssignmentDetail,
  createSubmission,
  updateSubmission,
  getSubmission,
  // 강사용 서비스 추가
  createAssignmentForInstructor,
  updateAssignmentForInstructor,
  deleteAssignmentForInstructor,
  updateAssignmentStatus,
  getInstructorAssignments,
  getAssignmentSubmissions,
  // 채점 관련 서비스 추가
  gradeSubmission,
  getSubmissionsForGrading,
  getSubmissionDetailForGrading,
  // 학습자용 서비스 추가
  getLearnerAssignments,
} from './service';
import {
  assignmentErrorCodes,
  submissionErrorCodes,
  type SubmissionServiceError,
  gradingErrorCodes,
  type GradingServiceError,
} from './error';
import { registerSchedulerRoutes } from './scheduler-route';

/**
 * 과제 관련 API 라우터 등록
 */
export const registerAssignmentsRoutes = (app: Hono<AppEnv>) => {
  // GET /api/assignments - 학습자용 과제 목록 조회
  app.get('/api/assignments', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      // 인증 헤더에서 토큰 추출
      const authHeader = c.req.header('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, 'Authentication required')
        );
      }

      // JWT 토큰으로 사용자 정보 조회
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, 'Invalid authentication')
        );
      }

      // 쿼리 파라미터 파싱
      const query = c.req.query();
      const params = {
        status: query.status as 'all' | 'upcoming' | 'submitted' | 'graded' | 'overdue' | undefined,
        courseId: query.courseId,
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 20,
      };

      // 학습자용 과제 목록 조회 서비스 호출
      const result = await getLearnerAssignments(supabase, user.id, params);

      if (!result.ok) {
        const errorResult = result as ErrorResult<string, unknown>;
        logger.error('Get learner assignments failed', {
          error: errorResult.error,
          userId: user.id,
          params,
        });
      } else {
        logger.info('Learner assignments fetched successfully', {
          userId: user.id,
          assignmentsCount: result.data.assignments.length,
          total: result.data.pagination.total,
        });
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Get learner assignments route error:', error);
      return respond(
        c,
        failure(500, assignmentErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // GET /api/assignments/:id - 과제 상세 조회
  app.get('/assignments/:id', async (c) => {
    const logger = getLogger(c);
    
    try {
      // 파라미터 검증
      const parsedParams = AssignmentParamsSchema.safeParse({ 
        id: c.req.param('id') 
      });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            assignmentErrorCodes.invalidParams,
            'Invalid assignment ID',
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
          failure(401, assignmentErrorCodes.unauthorized, 'Authentication required')
        );
      }

      // 서비스 호출
      const result = await getAssignmentDetail(
        supabase, 
        parsedParams.data.id, 
        user.id
      );

      return respond(c, result);

    } catch (error) {
      logger.error('Assignment route error:', error);
      return respond(
        c,
        failure(500, assignmentErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // POST /api/assignments/:id/submissions - 제출물 생성
  app.post('/assignments/:id/submissions', async (c) => {
    const logger = getLogger(c);
    
    try {
      // 파라미터 검증
      const parsedParams = AssignmentParamsSchema.safeParse({ 
        id: c.req.param('id') 
      });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            submissionErrorCodes.invalidParams,
            'Invalid assignment ID',
            parsedParams.error.format(),
          ),
        );
      }

      // 사용자 인증 확인
      const supabase = getSupabase(c);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, submissionErrorCodes.unauthorized, 'Authentication required')
        );
      }

      // 요청 본문 파싱
      const body = await c.req.json();
      const parsedBody = CreateSubmissionRequestSchema.safeParse(body);

      if (!parsedBody.success) {
        return respond(
          c,
          failure(
            400,
            submissionErrorCodes.validationError,
            'Invalid submission data',
            parsedBody.error.format(),
          ),
        );
      }

      // 서비스 호출
      const result = await createSubmission(
        supabase, 
        parsedParams.data.id, 
        user.id,
        parsedBody.data
      );

      if (!result.ok) {
        const errorResult = result as unknown as ErrorResult<string, unknown>;
        return respond(c, failure(
          errorResult.status,
          errorResult.error.code,
          errorResult.error.message,
          errorResult.error.details
        ));
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Create submission route error:', error);
      return respond(
        c,
        failure(500, submissionErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // PUT /api/assignments/:id/submissions - 제출물 업데이트 (재제출)
  app.put('/assignments/:id/submissions', async (c) => {
    const logger = getLogger(c);
    
    try {
      // 파라미터 검증
      const parsedParams = AssignmentParamsSchema.safeParse({ 
        id: c.req.param('id') 
      });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            submissionErrorCodes.invalidParams,
            'Invalid assignment ID',
            parsedParams.error.format(),
          ),
        );
      }

      // 사용자 인증 확인
      const supabase = getSupabase(c);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, submissionErrorCodes.unauthorized, 'Authentication required')
        );
      }

      // 요청 본문 파싱
      const body = await c.req.json();
      const parsedBody = UpdateSubmissionRequestSchema.safeParse(body);

      if (!parsedBody.success) {
        return respond(
          c,
          failure(
            400,
            submissionErrorCodes.validationError,
            'Invalid submission data',
            parsedBody.error.format(),
          ),
        );
      }

      // 서비스 호출
      const result = await updateSubmission(
        supabase, 
        parsedParams.data.id, 
        user.id,
        parsedBody.data
      );

      if (!result.ok) {
        const errorResult = result as unknown as ErrorResult<string, unknown>;
        return respond(c, failure(
          errorResult.status,
          errorResult.error.code,
          errorResult.error.message,
          errorResult.error.details
        ));
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Update submission route error:', error);
      return respond(
        c,
        failure(500, submissionErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // GET /api/assignments/:id/submissions - 제출물 조회
  app.get('/assignments/:id/submissions', async (c) => {
    const logger = getLogger(c);
    
    try {
      // 파라미터 검증
      const parsedParams = AssignmentParamsSchema.safeParse({ 
        id: c.req.param('id') 
      });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            submissionErrorCodes.invalidParams,
            'Invalid assignment ID',
            parsedParams.error.format(),
          ),
        );
      }

      // 사용자 인증 확인
      const supabase = getSupabase(c);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, submissionErrorCodes.unauthorized, 'Authentication required')
        );
      }

      // 서비스 호출
      const result = await getSubmission(
        supabase, 
        parsedParams.data.id, 
        user.id
      );

      if (!result.ok) {
        const errorResult = result as unknown as ErrorResult<string, unknown>;
        return respond(c, failure(
          errorResult.status,
          errorResult.error.code,
          errorResult.error.message,
          errorResult.error.details
        ));
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Get submission route error:', error);
      return respond(
        c,
        failure(500, submissionErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // ===== 강사용 라우트들 =====

  // POST /api/instructor/courses/:courseId/assignments - 과제 생성
  app.post('/api/instructor/courses/:courseId/assignments', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      // 파라미터 검증
      const parsedParams = CourseParamsSchema.safeParse({
        courseId: c.req.param('courseId')
      });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            assignmentErrorCodes.invalidParams,
            'Invalid course ID',
            parsedParams.error.format()
          )
        );
      }

      // 요청 본문 파싱
      const body = await c.req.json();
      const parsedBody = CreateAssignmentRequestSchema.safeParse(body);

      if (!parsedBody.success) {
        return respond(
          c,
          failure(
            400,
            assignmentErrorCodes.validationError,
            'Invalid request body',
            parsedBody.error.format()
          )
        );
      }

      // 사용자 인증 확인
      const authHeader = c.req.header('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, 'Authentication required')
        );
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, 'Authentication required')
        );
      }

      // Auth ID를 내부 사용자 ID로 변환
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, '사용자를 찾을 수 없습니다.')
        );
      }

      // 서비스 호출
      const result = await createAssignmentForInstructor(
        supabase,
        parsedParams.data.courseId,
        userData.id, // 내부 사용자 ID 사용
        parsedBody.data
      );

      return respond(c, result);

    } catch (error) {
      logger.error('Create assignment route error:', error);
      return respond(
        c,
        failure(500, assignmentErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // PUT /api/instructor/assignments/:id - 과제 수정
  app.put('/api/instructor/assignments/:id', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      // 파라미터 검증
      const parsedParams = AssignmentParamsSchema.safeParse({
        id: c.req.param('id')
      });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            assignmentErrorCodes.invalidParams,
            'Invalid assignment ID',
            parsedParams.error.format()
          )
        );
      }

      // 요청 본문 파싱
      const body = await c.req.json();
      const parsedBody = UpdateAssignmentRequestSchema.safeParse(body);

      if (!parsedBody.success) {
        return respond(
          c,
          failure(
            400,
            assignmentErrorCodes.validationError,
            'Invalid request body',
            parsedBody.error.format()
          )
        );
      }

      // 사용자 인증 확인
      const authHeader = c.req.header('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, 'Authentication required')
        );
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, 'Authentication required')
        );
      }

      // Auth ID를 내부 사용자 ID로 변환
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, '사용자를 찾을 수 없습니다.')
        );
      }

      // 서비스 호출
      const result = await updateAssignmentForInstructor(
        supabase,
        parsedParams.data.id,
        userData.id, // 내부 사용자 ID 사용
        parsedBody.data
      );

      return respond(c, result);

    } catch (error) {
      logger.error('Update assignment route error:', error);
      return respond(
        c,
        failure(500, assignmentErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // DELETE /api/instructor/assignments/:id - 과제 삭제
  app.delete('/api/instructor/assignments/:id', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      // 파라미터 검증
      const parsedParams = AssignmentParamsSchema.safeParse({
        id: c.req.param('id')
      });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            assignmentErrorCodes.invalidParams,
            'Invalid assignment ID',
            parsedParams.error.format()
          )
        );
      }

      // 사용자 인증 확인
      const authHeader = c.req.header('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, 'Authentication required')
        );
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, 'Authentication required')
        );
      }

      // Auth ID를 내부 사용자 ID로 변환
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, '사용자를 찾을 수 없습니다.')
        );
      }

      // 서비스 호출
      const result = await deleteAssignmentForInstructor(
        supabase,
        parsedParams.data.id,
        userData.id // 내부 사용자 ID 사용
      );

      return respond(c, result);

    } catch (error) {
      logger.error('Delete assignment route error:', error);
      return respond(
        c,
        failure(500, assignmentErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // PATCH /api/instructor/assignments/:id/status - 상태 전환
  app.patch('/api/instructor/assignments/:id/status', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      // 파라미터 검증
      const parsedParams = AssignmentParamsSchema.safeParse({
        id: c.req.param('id')
      });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            assignmentErrorCodes.invalidParams,
            'Invalid assignment ID',
            parsedParams.error.format()
          )
        );
      }

      // 요청 본문 파싱
      const body = await c.req.json();
      const parsedBody = AssignmentStatusUpdateSchema.safeParse(body);

      if (!parsedBody.success) {
        return respond(
          c,
          failure(
            400,
            assignmentErrorCodes.validationError,
            'Invalid request body',
            parsedBody.error.format()
          )
        );
      }

      // 사용자 인증 확인
      const authHeader = c.req.header('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, 'Authentication required')
        );
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, 'Authentication required')
        );
      }

      // Auth ID를 내부 사용자 ID로 변환
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, '사용자를 찾을 수 없습니다.')
        );
      }

      // 서비스 호출
      const result = await updateAssignmentStatus(
        supabase,
        parsedParams.data.id,
        userData.id, // 내부 사용자 ID 사용
        parsedBody.data
      );

      return respond(c, result);

    } catch (error) {
      logger.error('Update assignment status route error:', error);
      return respond(
        c,
        failure(500, assignmentErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // GET /api/instructor/courses/:courseId/assignments - 과제 목록 조회
  app.get('/api/instructor/courses/:courseId/assignments', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      // 쿼리 파라미터 파싱
      const queryParams = {
        courseId: c.req.param('courseId'),
        status: c.req.query('status'),
        page: c.req.query('page') ? parseInt(c.req.query('page')!) : undefined,
        limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined,
      };

      const parsedParams = InstructorAssignmentsQuerySchema.safeParse(queryParams);

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            assignmentErrorCodes.invalidParams,
            'Invalid query parameters',
            parsedParams.error.format()
          )
        );
      }

      // 사용자 인증 확인
      const authHeader = c.req.header('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, 'Authentication required')
        );
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, 'Authentication required')
        );
      }

      // 서비스 호출
      const result = await getInstructorAssignments(
        supabase,
        user.id,
        parsedParams.data
      );

      return respond(c, result);

    } catch (error) {
      logger.error('Get instructor assignments route error:', error);
      return respond(
        c,
        failure(500, assignmentErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // GET /api/instructor/assignments/:id/submissions - 제출물 목록 조회
  app.get('/api/instructor/assignments/:id/submissions', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      // 쿼리 파라미터 파싱
      const queryParams = {
        assignmentId: c.req.param('id'),
        status: c.req.query('status'),
        isLate: c.req.query('isLate') ? c.req.query('isLate') === 'true' : undefined,
        page: c.req.query('page') ? parseInt(c.req.query('page')!) : undefined,
        limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined,
      };

      const parsedParams = AssignmentSubmissionsQuerySchema.safeParse(queryParams);

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            assignmentErrorCodes.invalidParams,
            'Invalid query parameters',
            parsedParams.error.format()
          )
        );
      }

      // 사용자 인증 확인
      const authHeader = c.req.header('Authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, 'Authentication required')
        );
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, 'Authentication required')
        );
      }

      // Auth ID를 내부 사용자 ID로 변환
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        return respond(
          c,
          failure(401, assignmentErrorCodes.unauthorized, '사용자를 찾을 수 없습니다.')
        );
      }

      // 서비스 호출
      const result = await getAssignmentSubmissions(
        supabase,
        parsedParams.data.assignmentId,
        userData.id, // 내부 사용자 ID 사용
        parsedParams.data
      );

      return respond(c, result);

    } catch (error) {
      logger.error('Get assignment submissions route error:', error);
      return respond(
        c,
        failure(500, assignmentErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // ===== 채점 관련 API 라우트 =====

  // POST /api/instructor/submissions/:submissionId/grade - 제출물 채점
  app.post('/api/instructor/submissions/:submissionId/grade', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      // 인증 헤더에서 사용자 정보 추출
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return respond(
          c,
          failure(401, gradingErrorCodes.unauthorized, '인증이 필요합니다.')
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, gradingErrorCodes.unauthorized, '유효하지 않은 인증 정보입니다.')
        );
      }

      // Auth ID를 내부 사용자 ID로 변환
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        return respond(
          c,
          failure(401, gradingErrorCodes.unauthorized, '사용자를 찾을 수 없습니다.')
        );
      }

      // 파라미터 검증
      const submissionId = c.req.param('submissionId');
      const parsedParams = SubmissionParamsSchema.safeParse({ submissionId });
      
      if (!parsedParams.success) {
        return respond(
          c,
          failure(400, gradingErrorCodes.invalidParams, '잘못된 파라미터입니다.')
        );
      }

      // 요청 본문 검증
      const body = await c.req.json();
      const parsedBody = GradeSubmissionRequestSchema.safeParse(body);
      
      if (!parsedBody.success) {
        return respond(
          c,
          failure(400, gradingErrorCodes.validationError, '입력 데이터가 올바르지 않습니다.')
        );
      }

      // 채점 서비스 호출
      const result = await gradeSubmission(
        supabase,
        parsedParams.data.submissionId,
        userData.id, // 내부 사용자 ID 사용
        parsedBody.data
      );

      return respond(c, result);

    } catch (error) {
      logger.error('Grade submission route error:', error);
      return respond(
        c,
        failure(500, gradingErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // GET /api/instructor/assignments/:assignmentId/submissions/grading - 채점용 제출물 목록 조회
  app.get('/api/instructor/assignments/:assignmentId/submissions/grading', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      // 인증 헤더에서 사용자 정보 추출
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return respond(
          c,
          failure(401, gradingErrorCodes.unauthorized, '인증이 필요합니다.')
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, gradingErrorCodes.unauthorized, '유효하지 않은 인증 정보입니다.')
        );
      }

      // Auth ID를 내부 사용자 ID로 변환
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        return respond(
          c,
          failure(401, gradingErrorCodes.unauthorized, '사용자를 찾을 수 없습니다.')
        );
      }

      // 파라미터 검증
      const assignmentId = c.req.param('assignmentId');
      if (!assignmentId) {
        return respond(
          c,
          failure(400, gradingErrorCodes.invalidParams, '과제 ID가 필요합니다.')
        );
      }

      // 쿼리 파라미터 파싱
      const query = c.req.query();
      const params = {
        status: query.status as 'submitted' | 'graded' | 'resubmission_required' | undefined,
        isLate: query.isLate ? query.isLate === 'true' : undefined,
        page: query.page ? parseInt(query.page, 10) : 1,
        limit: query.limit ? parseInt(query.limit, 10) : 20,
      };

      // 채점용 제출물 목록 조회 서비스 호출
      const result = await getSubmissionsForGrading(
        supabase,
        assignmentId,
        userData.id, // 내부 사용자 ID 사용
        params
      );

      return respond(c, result);

    } catch (error) {
      logger.error('Get submissions for grading route error:', error);
      return respond(
        c,
        failure(500, gradingErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // GET /api/instructor/submissions/:submissionId/grading - 채점용 제출물 상세 조회
  app.get('/api/instructor/submissions/:submissionId/grading', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      // 인증 헤더에서 사용자 정보 추출
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return respond(
          c,
          failure(401, gradingErrorCodes.unauthorized, '인증이 필요합니다.')
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return respond(
          c,
          failure(401, gradingErrorCodes.unauthorized, '유효하지 않은 인증 정보입니다.')
        );
      }

      // Auth ID를 내부 사용자 ID로 변환
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        return respond(
          c,
          failure(401, gradingErrorCodes.unauthorized, '사용자를 찾을 수 없습니다.')
        );
      }

      // 파라미터 검증
      const submissionId = c.req.param('submissionId');
      const parsedParams = SubmissionParamsSchema.safeParse({ submissionId });
      
      if (!parsedParams.success) {
        return respond(
          c,
          failure(400, gradingErrorCodes.invalidParams, '잘못된 파라미터입니다.')
        );
      }

      // 채점용 제출물 상세 조회 서비스 호출
      const result = await getSubmissionDetailForGrading(
        supabase,
        parsedParams.data.submissionId,
        userData.id // 내부 사용자 ID 사용
      );

      return respond(c, result);

    } catch (error) {
      logger.error('Get submission detail for grading route error:', error);
      return respond(
        c,
        failure(500, gradingErrorCodes.databaseError, 'Internal server error')
      );
    }
  });

  // 스케줄러 관련 라우트 등록
  registerSchedulerRoutes(app);
};
