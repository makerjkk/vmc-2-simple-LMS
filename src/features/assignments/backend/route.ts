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
} from './schema';
import {
  getAssignmentDetail,
  createSubmission,
  updateSubmission,
  getSubmission,
} from './service';
import {
  assignmentErrorCodes,
  submissionErrorCodes,
  type SubmissionServiceError,
} from './error';

/**
 * 과제 관련 API 라우터 등록
 */
export const registerAssignmentsRoutes = (app: Hono<AppEnv>) => {
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
};
