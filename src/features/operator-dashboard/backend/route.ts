import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import { SMALL_PAGE_SIZE } from '@/constants/pagination';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  getOperatorStats,
  getRecentReports,
  getPendingActions,
} from './service';
import {
  operatorDashboardErrorCodes,
  type OperatorDashboardServiceError,
} from './error';

/**
 * 운영자 권한 확인 미들웨어
 */
const requireOperatorRole = async (c: any, next: any) => {
  const userId = c.req.header('x-user-id');
  const userRole = c.req.header('x-user-role');

  if (!userId || !userRole) {
    return respond(
      c,
      failure(401, operatorDashboardErrorCodes.unauthorized, '인증이 필요합니다.')
    );
  }

  if (userRole !== 'operator') {
    return respond(
      c,
      failure(403, operatorDashboardErrorCodes.operatorOnly, '운영자 권한이 필요합니다.')
    );
  }

  c.set('currentUserId', userId);
  c.set('currentUserRole', userRole);

  await next();
};

/**
 * 운영자 대시보드 관련 API 라우터 등록
 */
export const registerOperatorDashboardRoutes = (app: Hono<AppEnv>) => {
  // GET /api/operator/stats - 운영자 대시보드 통계
  app.get('/api/operator/stats', requireOperatorRole, async (c) => {
    const logger = getLogger(c);
    
    try {
      const supabase = getSupabase(c);
      const result = await getOperatorStats(supabase);

      if (!result.ok) {
        const errorResult = result as ErrorResult<OperatorDashboardServiceError, unknown>;
        
        if (errorResult.error.code === operatorDashboardErrorCodes.fetchError ||
            errorResult.error.code === operatorDashboardErrorCodes.statsCalculationError) {
          logger.error('Failed to fetch operator stats', errorResult.error.message);
        }
      } else {
        logger.info('Operator stats fetched successfully');
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Operator stats route error:', error);
      return respond(
        c,
        failure(500, operatorDashboardErrorCodes.databaseError, '서버 오류가 발생했습니다.')
      );
    }
  });

  // GET /api/operator/reports/recent - 최근 신고 목록
  app.get('/api/operator/reports/recent', requireOperatorRole, async (c) => {
    const logger = getLogger(c);
    
    try {
      const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : SMALL_PAGE_SIZE;
      
      if (isNaN(limit) || limit < 1 || limit > 50) {
        return respond(
          c,
          failure(400, operatorDashboardErrorCodes.invalidParams, 'limit은 1-50 사이의 숫자여야 합니다.')
        );
      }

      const supabase = getSupabase(c);
      const result = await getRecentReports(supabase, limit);

      if (!result.ok) {
        const errorResult = result as ErrorResult<OperatorDashboardServiceError, unknown>;
        
        if (errorResult.error.code === operatorDashboardErrorCodes.fetchError) {
          logger.error('Failed to fetch recent reports', errorResult.error.message);
        }
      } else {
        logger.info('Recent reports fetched successfully', {
          count: result.data.reports.length,
        });
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Recent reports route error:', error);
      return respond(
        c,
        failure(500, operatorDashboardErrorCodes.databaseError, '서버 오류가 발생했습니다.')
      );
    }
  });

  // GET /api/operator/actions/pending - 처리 대기 액션
  app.get('/api/operator/actions/pending', requireOperatorRole, async (c) => {
    const logger = getLogger(c);
    
    try {
      const supabase = getSupabase(c);
      const result = await getPendingActions(supabase);

      if (!result.ok) {
        const errorResult = result as ErrorResult<OperatorDashboardServiceError, unknown>;
        
        if (errorResult.error.code === operatorDashboardErrorCodes.fetchError) {
          logger.error('Failed to fetch pending actions', errorResult.error.message);
        }
      } else {
        logger.info('Pending actions fetched successfully', {
          pendingReports: result.data.pendingReports,
          urgentReports: result.data.urgentReports,
        });
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Pending actions route error:', error);
      return respond(
        c,
        failure(500, operatorDashboardErrorCodes.databaseError, '서버 오류가 발생했습니다.')
      );
    }
  });
};
