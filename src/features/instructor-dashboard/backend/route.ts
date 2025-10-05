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
import { getInstructorDashboardData } from './service';
import {
  instructorDashboardErrorCodes,
  type InstructorDashboardServiceError,
} from './error';

/**
 * Instructor 대시보드 관련 API 라우터 등록
 */
export const registerInstructorDashboardRoutes = (app: Hono<AppEnv>) => {
  // GET /api/instructor/dashboard - Instructor 대시보드 데이터 조회
  app.get('/api/instructor/dashboard', async (c) => {
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
            instructorDashboardErrorCodes.unauthorized,
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
            instructorDashboardErrorCodes.unauthorized,
            '유효하지 않은 인증 정보입니다.',
          ),
        );
      }

      // Instructor 대시보드 데이터 조회
      const result = await getInstructorDashboardData(supabase, user.id);

      if (!result.ok) {
        // 에러 로깅
        const errorResult = result as ErrorResult<string, unknown>;
        if (errorResult.error.code === instructorDashboardErrorCodes.fetchError ||
            errorResult.error.code === instructorDashboardErrorCodes.databaseError) {
          logger.error('Instructor dashboard data fetch failed', {
            error: errorResult.error,
            userId: user.id,
          });
        }

        return respond(c, result);
      }

      logger.info('Instructor dashboard data fetched successfully', {
        userId: user.id,
        coursesCount: result.data.courses.length,
        pendingSubmissionsCount: result.data.pendingSubmissions.length,
        recentSubmissionsCount: result.data.recentSubmissions.length,
        stats: result.data.stats,
      });

      return respond(c, result);

    } catch (error) {
      logger.error('Instructor dashboard route error:', error);
      return respond(
        c,
        failure(
          500,
          instructorDashboardErrorCodes.databaseError,
          'Instructor 대시보드 데이터 조회 중 오류가 발생했습니다.',
        ),
      );
    }
  });
};
