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
  CreateCategoryRequestSchema,
  UpdateCategoryRequestSchema,
  CategoryParamsSchema,
} from './schema';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryUsage,
  getDifficultyMetadata,
} from './service';
import {
  metadataErrorCodes,
  type MetadataServiceError,
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
      failure(401, metadataErrorCodes.unauthorized, '인증이 필요합니다.')
    );
  }

  if (userRole !== 'operator') {
    return respond(
      c,
      failure(403, metadataErrorCodes.operatorOnly, '운영자 권한이 필요합니다.')
    );
  }

  c.set('currentUserId', userId);
  c.set('currentUserRole', userRole);

  await next();
};

/**
 * 메타데이터 관리 관련 API 라우터 등록
 */
export const registerMetadataRoutes = (app: Hono<AppEnv>) => {
  // GET /api/metadata/categories - 카테고리 목록 조회 (관리자용)
  app.get('/api/metadata/categories', requireOperatorRole, async (c) => {
    const logger = getLogger(c);
    
    try {
      const supabase = getSupabase(c);
      const result = await getAllCategories(supabase);

      if (!result.ok) {
        const errorResult = result as ErrorResult<MetadataServiceError, unknown>;
        
        if (errorResult.error.code === metadataErrorCodes.fetchError) {
          logger.error('Failed to fetch categories', errorResult.error.message);
        }
      } else {
        logger.info('Categories fetched successfully', {
          count: result.data.categories.length,
        });
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Categories route error:', error);
      return respond(
        c,
        failure(500, metadataErrorCodes.databaseError, '서버 오류가 발생했습니다.')
      );
    }
  });

  // GET /api/metadata/categories/:id - 카테고리 상세 조회
  app.get('/api/metadata/categories/:id', requireOperatorRole, async (c) => {
    const logger = getLogger(c);
    
    try {
      const parsedParams = CategoryParamsSchema.safeParse({ id: c.req.param('id') });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            metadataErrorCodes.invalidParams,
            '유효하지 않은 카테고리 ID입니다.',
            parsedParams.error.format(),
          ),
        );
      }

      const supabase = getSupabase(c);
      const result = await getCategoryById(supabase, parsedParams.data.id);

      if (!result.ok) {
        const errorResult = result as ErrorResult<MetadataServiceError, unknown>;
        
        if (errorResult.error.code === metadataErrorCodes.categoryNotFound) {
          logger.warn('Category not found', { categoryId: parsedParams.data.id });
        }
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Category detail route error:', error);
      return respond(
        c,
        failure(500, metadataErrorCodes.databaseError, '서버 오류가 발생했습니다.')
      );
    }
  });

  // POST /api/metadata/categories - 카테고리 생성
  app.post('/api/metadata/categories', requireOperatorRole, async (c) => {
    const logger = getLogger(c);
    
    try {
      const body = await c.req.json();
      const parsedBody = CreateCategoryRequestSchema.safeParse(body);

      if (!parsedBody.success) {
        return respond(
          c,
          failure(
            400,
            metadataErrorCodes.invalidParams,
            '잘못된 요청 데이터입니다.',
            parsedBody.error.format(),
          ),
        );
      }

      const supabase = getSupabase(c);
      const result = await createCategory(supabase, parsedBody.data);

      if (!result.ok) {
        const errorResult = result as ErrorResult<MetadataServiceError, unknown>;
        
        if (errorResult.error.code === metadataErrorCodes.duplicateName) {
          logger.warn('Duplicate category name', { name: parsedBody.data.name });
        } else if (errorResult.error.code === metadataErrorCodes.createError) {
          logger.error('Failed to create category', errorResult.error.message);
        }
      } else {
        logger.info('Category created successfully', {
          categoryId: result.data.id,
          name: result.data.name,
        });
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Category creation route error:', error);
      return respond(
        c,
        failure(500, metadataErrorCodes.databaseError, '서버 오류가 발생했습니다.')
      );
    }
  });

  // PATCH /api/metadata/categories/:id - 카테고리 수정
  app.patch('/api/metadata/categories/:id', requireOperatorRole, async (c) => {
    const logger = getLogger(c);
    
    try {
      const parsedParams = CategoryParamsSchema.safeParse({ id: c.req.param('id') });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            metadataErrorCodes.invalidParams,
            '유효하지 않은 카테고리 ID입니다.',
            parsedParams.error.format(),
          ),
        );
      }

      const body = await c.req.json();
      const parsedBody = UpdateCategoryRequestSchema.safeParse(body);

      if (!parsedBody.success) {
        return respond(
          c,
          failure(
            400,
            metadataErrorCodes.invalidParams,
            '잘못된 요청 데이터입니다.',
            parsedBody.error.format(),
          ),
        );
      }

      const supabase = getSupabase(c);
      const result = await updateCategory(supabase, parsedParams.data.id, parsedBody.data);

      if (!result.ok) {
        const errorResult = result as ErrorResult<MetadataServiceError, unknown>;
        
        if (errorResult.error.code === metadataErrorCodes.categoryNotFound) {
          logger.warn('Category not found for update', { categoryId: parsedParams.data.id });
        } else if (errorResult.error.code === metadataErrorCodes.duplicateName) {
          logger.warn('Duplicate category name on update', { name: parsedBody.data.name });
        } else if (errorResult.error.code === metadataErrorCodes.cannotDeactivateInUse) {
          logger.warn('Cannot deactivate category in use', { categoryId: parsedParams.data.id });
        }
      } else {
        logger.info('Category updated successfully', {
          categoryId: parsedParams.data.id,
          updates: Object.keys(parsedBody.data),
        });
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Category update route error:', error);
      return respond(
        c,
        failure(500, metadataErrorCodes.databaseError, '서버 오류가 발생했습니다.')
      );
    }
  });

  // DELETE /api/metadata/categories/:id - 카테고리 삭제
  app.delete('/api/metadata/categories/:id', requireOperatorRole, async (c) => {
    const logger = getLogger(c);
    
    try {
      const parsedParams = CategoryParamsSchema.safeParse({ id: c.req.param('id') });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            metadataErrorCodes.invalidParams,
            '유효하지 않은 카테고리 ID입니다.',
            parsedParams.error.format(),
          ),
        );
      }

      const supabase = getSupabase(c);
      const result = await deleteCategory(supabase, parsedParams.data.id);

      if (!result.ok) {
        const errorResult = result as ErrorResult<MetadataServiceError, unknown>;
        
        if (errorResult.error.code === metadataErrorCodes.categoryNotFound) {
          logger.warn('Category not found for deletion', { categoryId: parsedParams.data.id });
        } else if (errorResult.error.code === metadataErrorCodes.categoryInUse) {
          logger.warn('Cannot delete category in use', { categoryId: parsedParams.data.id });
        }
      } else {
        logger.info('Category deleted successfully', {
          categoryId: parsedParams.data.id,
        });
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Category deletion route error:', error);
      return respond(
        c,
        failure(500, metadataErrorCodes.databaseError, '서버 오류가 발생했습니다.')
      );
    }
  });

  // GET /api/metadata/categories/:id/usage - 카테고리 사용 현황 조회
  app.get('/api/metadata/categories/:id/usage', requireOperatorRole, async (c) => {
    const logger = getLogger(c);
    
    try {
      const parsedParams = CategoryParamsSchema.safeParse({ id: c.req.param('id') });

      if (!parsedParams.success) {
        return respond(
          c,
          failure(
            400,
            metadataErrorCodes.invalidParams,
            '유효하지 않은 카테고리 ID입니다.',
            parsedParams.error.format(),
          ),
        );
      }

      const supabase = getSupabase(c);
      const result = await getCategoryUsage(supabase, parsedParams.data.id);

      if (!result.ok) {
        const errorResult = result as ErrorResult<MetadataServiceError, unknown>;
        
        if (errorResult.error.code === metadataErrorCodes.categoryNotFound) {
          logger.warn('Category not found for usage check', { categoryId: parsedParams.data.id });
        }
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Category usage route error:', error);
      return respond(
        c,
        failure(500, metadataErrorCodes.databaseError, '서버 오류가 발생했습니다.')
      );
    }
  });

  // GET /api/metadata/difficulties - 난이도 메타데이터 조회
  app.get('/api/metadata/difficulties', requireOperatorRole, async (c) => {
    const logger = getLogger(c);
    
    try {
      const supabase = getSupabase(c);
      const result = await getDifficultyMetadata(supabase);

      if (!result.ok) {
        const errorResult = result as ErrorResult<MetadataServiceError, unknown>;
        logger.error('Failed to fetch difficulty metadata', errorResult.error.message);
      } else {
        logger.info('Difficulty metadata fetched successfully');
      }

      return respond(c, result);

    } catch (error) {
      logger.error('Difficulty metadata route error:', error);
      return respond(
        c,
        failure(500, metadataErrorCodes.databaseError, '서버 오류가 발생했습니다.')
      );
    }
  });
};
