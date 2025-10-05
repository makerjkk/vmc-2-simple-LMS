import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  CategoryTableRowSchema,
  type CategoriesResponse,
  type Category,
} from './schema';
import {
  categoriesErrorCodes,
  type CategoriesServiceError,
} from './error';

/**
 * 활성 카테고리 목록 조회 서비스
 */
export const getActiveCategories = async (
  client: SupabaseClient
): Promise<HandlerResult<CategoriesResponse, CategoriesServiceError, unknown>> => {
  try {
    const { data: categoriesData, error } = await client
      .from('categories')
      .select(`
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      return failure(500, categoriesErrorCodes.fetchError, error.message);
    }

    if (!categoriesData) {
      return success({
        categories: [],
      });
    }

    // 데이터 검증 및 변환
    const validatedCategories: Category[] = [];
    for (const row of categoriesData) {
      const rowParse = CategoryTableRowSchema.safeParse(row);
      
      if (!rowParse.success) {
        console.error('Category row validation failed:', rowParse.error);
        continue;
      }

      const validatedRow = rowParse.data;
      
      validatedCategories.push({
        id: validatedRow.id,
        name: validatedRow.name,
        description: validatedRow.description,
        isActive: validatedRow.is_active,
        createdAt: validatedRow.created_at,
        updatedAt: validatedRow.updated_at,
      });
    }

    return success({
      categories: validatedCategories,
    });

  } catch (error) {
    console.error('getActiveCategories error:', error);
    return failure(
      500,
      categoriesErrorCodes.databaseError,
      '카테고리 조회 중 오류가 발생했습니다.'
    );
  }
};
