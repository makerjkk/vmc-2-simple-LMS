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
import { getDashboardData } from './service';
import {
  dashboardErrorCodes,
  type DashboardServiceError,
} from './error';

/**
 * 대시보드 관련 API 라우터 등록
 */
export const registerDashboardRoutes = (app: Hono<AppEnv>) => {
  // GET /api/dashboard - 대시보드 데이터 조회
  app.get('/api/dashboard', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      // 인증 헤더에서 사용자 정보 추출
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return respond(
          c,
          failure(
            401,
            dashboardErrorCodes.unauthorized,
            '인증이 필요합니다.',
          ),
        );
      }

      const token = authHeader.replace('Bearer ', '');
      
      // JWT 토큰으로 사용자 정보 조회
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return respond(
          c,
          failure(
            401,
            dashboardErrorCodes.unauthorized,
            '유효하지 않은 인증 정보입니다.',
          ),
        );
      }

      // 대시보드 데이터 조회
      const result = await getDashboardData(supabase, user.id);

      if (!result.ok) {
        // 에러 로깅
        const errorResult = result as ErrorResult<string, unknown>;
        if (errorResult.error.code === dashboardErrorCodes.fetchError ||
            errorResult.error.code === dashboardErrorCodes.databaseError) {
          logger.error('Dashboard data fetch failed', {
            error: errorResult.error,
            userId: user.id,
          });
        }

        return respond(c, result);
      }

      logger.info('Dashboard data fetched successfully', {
        userId: user.id,
        coursesCount: result.data.courses.length,
        upcomingAssignmentsCount: result.data.upcomingAssignments.length,
        recentFeedbackCount: result.data.recentFeedback.length,
      });

      return respond(c, result);

    } catch (error) {
      logger.error('Dashboard route error:', error);
      return respond(
        c,
        failure(
          500,
          dashboardErrorCodes.databaseError,
          '대시보드 데이터 조회 중 오류가 발생했습니다.',
        ),
      );
    }
  });
};
