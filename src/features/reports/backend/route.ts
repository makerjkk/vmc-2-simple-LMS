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
  ReportsQuerySchema,
  ReportParamsSchema,
  UpdateReportStatusSchema,
  ExecuteReportActionSchema,
} from './schema';
import {
  getReports,
  getReportById,
  updateReportStatus,
  executeReportAction,
} from './service';
import {
  reportsErrorCodes,
  reportActionsErrorCodes,
  type ReportsServiceError,
  type ReportActionsServiceError,
} from './error';

/**
 * 운영자 권한 확인 미들웨어
 */
const requireOperatorRole = async (c: any, next: any) => {
  // 실제 구현에서는 JWT 토큰에서 사용자 정보를 추출해야 함
  // 현재는 헤더에서 사용자 ID와 역할을 가져오는 것으로 가정
  const userId = c.req.header('x-user-id');
  const userRole = c.req.header('x-user-role');

  if (!userId || !userRole) {
    return respond(
      c,
      failure(401, reportsErrorCodes.unauthorized, '인증이 필요합니다.')
    );
  }

  if (userRole !== 'operator') {
    return respond(
      c,
      failure(403, reportsErrorCodes.operatorOnly, '운영자 권한이 필요합니다.')
    );
  }

  // 사용자 정보를 컨텍스트에 저장
  c.set('currentUserId', userId);
  c.set('currentUserRole', userRole);

  await next();
};

/**
 * 신고 관련 API 라우터 등록
 */
export const registerReportsRoutes = (app: Hono<AppEnv>) => {
  // GET /api/reports - 신고 목록 조회
  app.get('/api/reports', requireOperatorRole, async (c) => {
    const logger = getLogger(c);
    
    try {
      // 쿼리 파라미터 파싱
      const queryParams = {
        page: c.req.query('page') ? parseInt(c.req.query('page')!) : undefined,
        limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : undefined,
        status: c.req.query('status') as any,
        reportedType: c.req.query('reportedType') as any,
        sortBy: c.req.query('sortBy') as any,
        sortOrder: c.req.query('sortOrder') as any,
      };

      const parsedParams = ReportsQuerySchema.safeParse(queryParams);

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            reportsErrorCodes.invalidParams,
            '잘못된 쿼리 파라미터입니다.',
            parsedParams.error.format(),
          ),
        );
      }

      const supabase = getSupabase(c);
      const result = await getReports(supabase, parsedParams.data);

      if (!result.ok) {
        const errorResult = result as ErrorResult<ReportsServiceError, unknown>;
        
        if (errorResult.error.code === reportsErrorCodes.fetchError) {
          logger.error('Failed to fetch reports', errorResult.error.message);
        }
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Reports route error:', error);
      return respond(
        c,
        failure(500, reportsErrorCodes.databaseError, '서버 오류가 발생했습니다.')
      );
    }
  });

  // GET /api/reports/:id - 신고 상세 조회
  app.get('/api/reports/:id', requireOperatorRole, async (c) => {
    const logger = getLogger(c);
    
    try {
      const parsedParams = ReportParamsSchema.safeParse({ id: c.req.param('id') });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            reportsErrorCodes.invalidParams,
            '유효하지 않은 신고 ID입니다.',
            parsedParams.error.format(),
          ),
        );
      }

      const supabase = getSupabase(c);
      const result = await getReportById(supabase, parsedParams.data.id);

      if (!result.ok) {
        const errorResult = result as ErrorResult<ReportsServiceError, unknown>;
        
        if (errorResult.error.code === reportsErrorCodes.reportNotFound) {
          logger.warn('Report not found', { reportId: parsedParams.data.id });
        } else if (errorResult.error.code === reportsErrorCodes.fetchError) {
          logger.error('Failed to fetch report detail', errorResult.error.message);
        }
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Report detail route error:', error);
      return respond(
        c,
        failure(500, reportsErrorCodes.databaseError, '서버 오류가 발생했습니다.')
      );
    }
  });

  // PATCH /api/reports/:id - 신고 상태 업데이트
  app.patch('/api/reports/:id', requireOperatorRole, async (c) => {
    const logger = getLogger(c);
    
    try {
      const parsedParams = ReportParamsSchema.safeParse({ id: c.req.param('id') });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            reportsErrorCodes.invalidParams,
            '유효하지 않은 신고 ID입니다.',
            parsedParams.error.format(),
          ),
        );
      }

      const body = await c.req.json();
      const parsedBody = UpdateReportStatusSchema.safeParse(body);

      if (!parsedBody.success) {
        return respond(
          c,
          failure(
            400,
            reportsErrorCodes.invalidParams,
            '잘못된 요청 데이터입니다.',
            parsedBody.error.format(),
          ),
        );
      }

      // TODO: 실제 인증 미들웨어에서 사용자 ID를 가져와야 함
      const currentUserId = c.req.header('x-user-id') || 'operator-user-id';
      const supabase = getSupabase(c);
      const result = await updateReportStatus(
        supabase,
        parsedParams.data.id,
        parsedBody.data,
        currentUserId
      );

      if (!result.ok) {
        const errorResult = result as ErrorResult<ReportsServiceError, unknown>;
        
        if (errorResult.error.code === reportsErrorCodes.reportNotFound) {
          logger.warn('Report not found for status update', { reportId: parsedParams.data.id });
        } else if (errorResult.error.code === reportsErrorCodes.statusTransitionError) {
          logger.warn('Invalid status transition', { 
            reportId: parsedParams.data.id,
            newStatus: parsedBody.data.status 
          });
        }
      } else {
        logger.info('Report status updated successfully', {
          reportId: parsedParams.data.id,
          newStatus: parsedBody.data.status,
          operatorId: currentUserId,
        });
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Report status update route error:', error);
      return respond(
        c,
        failure(500, reportsErrorCodes.databaseError, '서버 오류가 발생했습니다.')
      );
    }
  });

  // POST /api/reports/:id/actions - 신고 처리 액션 실행
  app.post('/api/reports/:id/actions', requireOperatorRole, async (c) => {
    const logger = getLogger(c);
    
    try {
      const parsedParams = ReportParamsSchema.safeParse({ id: c.req.param('id') });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            reportsErrorCodes.invalidParams,
            '유효하지 않은 신고 ID입니다.',
            parsedParams.error.format(),
          ),
        );
      }

      const body = await c.req.json();
      const parsedBody = ExecuteReportActionSchema.safeParse(body);

      if (!parsedBody.success) {
        return respond(
          c,
          failure(
            400,
            reportActionsErrorCodes.invalidActionType,
            '잘못된 액션 데이터입니다.',
            parsedBody.error.format(),
          ),
        );
      }

      // TODO: 실제 인증 미들웨어에서 사용자 ID를 가져와야 함
      const currentUserId = c.req.header('x-user-id') || 'operator-user-id';
      const supabase = getSupabase(c);
      const result = await executeReportAction(
        supabase,
        parsedParams.data.id,
        parsedBody.data,
        currentUserId
      );

      if (!result.ok) {
        const errorResult = result as ErrorResult<ReportActionsServiceError, unknown>;
        
        if (errorResult.error.code === reportActionsErrorCodes.targetNotFound) {
          logger.warn('Report not found for action execution', { reportId: parsedParams.data.id });
        } else if (errorResult.error.code === reportActionsErrorCodes.targetAlreadyProcessed) {
          logger.warn('Action attempted on resolved report', { reportId: parsedParams.data.id });
        } else if (errorResult.error.code === reportActionsErrorCodes.actionExecutionFailed) {
          logger.error('Action execution failed', errorResult.error.message);
        }
      } else {
        logger.info('Report action executed successfully', {
          reportId: parsedParams.data.id,
          actionType: parsedBody.data.actionType,
          operatorId: currentUserId,
        });
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Report action execution route error:', error);
      return respond(
        c,
        failure(500, reportActionsErrorCodes.actionExecutionFailed, '서버 오류가 발생했습니다.')
      );
    }
  });
};
