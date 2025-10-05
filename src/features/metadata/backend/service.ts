import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import {
  metadataErrorCodes,
  type MetadataServiceError,
} from './error';
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryResponse,
  CategoriesListResponse,
  CategoryUsageResponse,
  DifficultyMetadataResponse,
} from './schema';

/**
 * 카테고리 목록 조회 (관리자용 - 비활성 포함)
 */
export const getAllCategories = async (
  supabase: SupabaseClient
): Promise<HandlerResult<CategoriesListResponse, MetadataServiceError>> => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      `)
      .order('name');

    if (error) {
      return failure(500, metadataErrorCodes.fetchError, '카테고리 목록 조회 중 오류가 발생했습니다.', error);
    }

    // 각 카테고리별 코스 수 조회
    const categoriesWithCounts = await Promise.all(
      (categories || []).map(async (category) => {
        const { count } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id);

        return {
          id: category.id,
          name: category.name,
          description: category.description,
          isActive: category.is_active,
          courseCount: count || 0,
          createdAt: category.created_at,
          updatedAt: category.updated_at,
        };
      })
    );

    return success({
      categories: categoriesWithCounts,
      total: categoriesWithCounts.length,
    });

  } catch (error) {
    return failure(500, metadataErrorCodes.databaseError, '데이터베이스 오류가 발생했습니다.', error);
  }
};

/**
 * 카테고리 상세 조회
 */
export const getCategoryById = async (
  supabase: SupabaseClient,
  categoryId: string
): Promise<HandlerResult<CategoryResponse, MetadataServiceError>> => {
  try {
    const { data: category, error } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      `)
      .eq('id', categoryId)
      .single();

    if (error || !category) {
      return failure(404, metadataErrorCodes.categoryNotFound, '카테고리를 찾을 수 없습니다.');
    }

    // 해당 카테고리의 코스 수 조회
    const { count } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    return success({
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.is_active,
      courseCount: count || 0,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    });

  } catch (error) {
    return failure(500, metadataErrorCodes.databaseError, '데이터베이스 오류가 발생했습니다.', error);
  }
};

/**
 * 카테고리 생성
 */
export const createCategory = async (
  supabase: SupabaseClient,
  categoryData: CreateCategoryRequest
): Promise<HandlerResult<CategoryResponse, MetadataServiceError>> => {
  try {
    // 중복 이름 검사
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('name', categoryData.name)
      .single();

    if (existingCategory) {
      return failure(400, metadataErrorCodes.duplicateName, '이미 존재하는 카테고리 이름입니다.');
    }

    // 카테고리 생성
    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert({
        name: categoryData.name,
        description: categoryData.description || null,
        is_active: true,
      })
      .select(`
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error || !newCategory) {
      return failure(500, metadataErrorCodes.createError, '카테고리 생성 중 오류가 발생했습니다.', error);
    }

    return success({
      id: newCategory.id,
      name: newCategory.name,
      description: newCategory.description,
      isActive: newCategory.is_active,
      courseCount: 0,
      createdAt: newCategory.created_at,
      updatedAt: newCategory.updated_at,
    });

  } catch (error) {
    return failure(500, metadataErrorCodes.databaseError, '데이터베이스 오류가 발생했습니다.', error);
  }
};

/**
 * 카테고리 수정
 */
export const updateCategory = async (
  supabase: SupabaseClient,
  categoryId: string,
  updateData: UpdateCategoryRequest
): Promise<HandlerResult<CategoryResponse, MetadataServiceError>> => {
  try {
    // 카테고리 존재 여부 확인
    const { data: existingCategory, error: fetchError } = await supabase
      .from('categories')
      .select('id, name, is_active')
      .eq('id', categoryId)
      .single();

    if (fetchError || !existingCategory) {
      return failure(404, metadataErrorCodes.categoryNotFound, '카테고리를 찾을 수 없습니다.');
    }

    // 이름 변경 시 중복 검사
    if (updateData.name && updateData.name !== existingCategory.name) {
      const { data: duplicateCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('name', updateData.name)
        .neq('id', categoryId)
        .single();

      if (duplicateCategory) {
        return failure(400, metadataErrorCodes.duplicateName, '이미 존재하는 카테고리 이름입니다.');
      }
    }

    // 비활성화 시 사용 중인지 확인
    if (updateData.isActive === false && existingCategory.is_active) {
      const { count } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .eq('status', 'published');

      if (count && count > 0) {
        return failure(400, metadataErrorCodes.cannotDeactivateInUse, '게시된 코스가 있는 카테고리는 비활성화할 수 없습니다.');
      }
    }

    // 업데이트할 필드 구성
    const updateFields: any = {};
    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.isActive !== undefined) updateFields.is_active = updateData.isActive;

    if (Object.keys(updateFields).length === 0) {
      return failure(400, metadataErrorCodes.missingRequiredFields, '수정할 데이터가 없습니다.');
    }

    // 카테고리 업데이트
    const { data: updatedCategory, error: updateError } = await supabase
      .from('categories')
      .update(updateFields)
      .eq('id', categoryId)
      .select(`
        id,
        name,
        description,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (updateError || !updatedCategory) {
      return failure(500, metadataErrorCodes.updateError, '카테고리 수정 중 오류가 발생했습니다.', updateError);
    }

    // 코스 수 조회
    const { count } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    return success({
      id: updatedCategory.id,
      name: updatedCategory.name,
      description: updatedCategory.description,
      isActive: updatedCategory.is_active,
      courseCount: count || 0,
      createdAt: updatedCategory.created_at,
      updatedAt: updatedCategory.updated_at,
    });

  } catch (error) {
    return failure(500, metadataErrorCodes.databaseError, '데이터베이스 오류가 발생했습니다.', error);
  }
};

/**
 * 카테고리 사용 현황 조회
 */
export const getCategoryUsage = async (
  supabase: SupabaseClient,
  categoryId: string
): Promise<HandlerResult<CategoryUsageResponse, MetadataServiceError>> => {
  try {
    // 카테고리 정보 조회
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', categoryId)
      .single();

    if (categoryError || !category) {
      return failure(404, metadataErrorCodes.categoryNotFound, '카테고리를 찾을 수 없습니다.');
    }

    // 해당 카테고리를 사용하는 코스 목록 조회
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        status,
        instructor:users!courses_instructor_id_fkey(full_name)
      `)
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    if (coursesError) {
      return failure(500, metadataErrorCodes.fetchError, '카테고리 사용 현황 조회 중 오류가 발생했습니다.', coursesError);
    }

    const courseList = courses || [];
    const publishedCourses = courseList.filter(course => course.status === 'published');

    return success({
      categoryId: category.id,
      categoryName: category.name,
      courseCount: courseList.length,
      courses: courseList.map(course => ({
        id: course.id,
        title: course.title,
        status: course.status,
        instructorName: (course.instructor as any)?.full_name || '알 수 없음',
      })),
      canDelete: courseList.length === 0,
      canDeactivate: publishedCourses.length === 0,
    });

  } catch (error) {
    return failure(500, metadataErrorCodes.databaseError, '데이터베이스 오류가 발생했습니다.', error);
  }
};

/**
 * 카테고리 삭제
 */
export const deleteCategory = async (
  supabase: SupabaseClient,
  categoryId: string
): Promise<HandlerResult<{ success: boolean }, MetadataServiceError>> => {
  try {
    // 카테고리 존재 여부 확인
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('id', categoryId)
      .single();

    if (fetchError || !category) {
      return failure(404, metadataErrorCodes.categoryNotFound, '카테고리를 찾을 수 없습니다.');
    }

    // 사용 중인 코스가 있는지 확인
    const { count } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId);

    if (count && count > 0) {
      return failure(400, metadataErrorCodes.categoryInUse, '코스가 있는 카테고리는 삭제할 수 없습니다.');
    }

    // 카테고리 삭제
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (deleteError) {
      return failure(500, metadataErrorCodes.deleteError, '카테고리 삭제 중 오류가 발생했습니다.', deleteError);
    }

    return success({ success: true });

  } catch (error) {
    return failure(500, metadataErrorCodes.databaseError, '데이터베이스 오류가 발생했습니다.', error);
  }
};

/**
 * 난이도 메타데이터 조회
 */
export const getDifficultyMetadata = async (
  supabase: SupabaseClient
): Promise<HandlerResult<DifficultyMetadataResponse, MetadataServiceError>> => {
  try {
    // 각 난이도별 코스 수 조회
    const difficulties = [
      { value: 'beginner' as const, label: '초급', description: '프로그래밍 경험이 없거나 기초를 배우고 싶은 분들을 위한 과정' },
      { value: 'intermediate' as const, label: '중급', description: '기본적인 프로그래밍 지식이 있고 실력을 향상시키고 싶은 분들을 위한 과정' },
      { value: 'advanced' as const, label: '고급', description: '전문적인 지식과 고급 기술을 익히고 싶은 분들을 위한 과정' },
    ];

    const difficultiesWithCounts = await Promise.all(
      difficulties.map(async (difficulty) => {
        const { count } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('difficulty', difficulty.value);

        return {
          ...difficulty,
          courseCount: count || 0,
        };
      })
    );

    return success({
      difficulties: difficultiesWithCounts,
    });

  } catch (error) {
    return failure(500, metadataErrorCodes.databaseError, '데이터베이스 오류가 발생했습니다.', error);
  }
};
