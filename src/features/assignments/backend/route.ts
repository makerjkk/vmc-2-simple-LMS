import type { Hono } from 'hono';
import {
  failure,
  respond,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  AssignmentParamsSchema,
} from './schema';
import {
  getAssignmentDetail,
} from './service';
import {
  assignmentErrorCodes,
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
};
