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
import { getActiveCategories } from './service';
import {
  categoriesErrorCodes,
  type CategoriesServiceError,
} from './error';

/**
 * Categories 관련 API 라우터 등록
 */
export const registerCategoriesRoutes = (app: Hono<AppEnv>) => {
  // GET /api/categories - 활성 카테고리 목록 조회
  app.get('/api/categories', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    try {
      const result = await getActiveCategories(supabase);

      if (!result.ok) {
        const errorResult = result as ErrorResult<CategoriesServiceError, unknown>;
        
        if (errorResult.error.code === categoriesErrorCodes.fetchError ||
            errorResult.error.code === categoriesErrorCodes.databaseError) {
          logger.error('Categories fetch failed', {
            error: errorResult.error,
          });
        }

        return respond(c, result);
      }

      logger.info('Categories fetched successfully', {
        categoriesCount: result.data.categories.length,
      });

      return respond(c, result);

    } catch (error) {
      logger.error('Categories route error:', error);
      return respond(
        c,
        failure(
          500,
          categoriesErrorCodes.databaseError,
          '카테고리 조회 중 오류가 발생했습니다.',
        ),
      );
    }
  });
};
