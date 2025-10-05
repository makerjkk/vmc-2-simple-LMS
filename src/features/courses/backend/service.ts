import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  buildCoursesQuery,
  type CourseFilters,
  type SortOption,
} from '@/lib/utils/search';
import {
  CourseTableRowSchema,
  EnrollmentTableRowSchema,
  InstructorCourseTableRowSchema,
  type CoursesResponse,
  type CourseDetailResponse,
  type EnrollmentStatusResponse,
  type CoursesQueryParams,
  type InstructorCoursesResponse,
  type InstructorCourseResponse,
  type CreateCourseRequest,
  type UpdateCourseRequest,
  type InstructorCoursesQuery,
} from './schema';
import {
  coursesErrorCodes,
  type CoursesServiceError,
} from './error';
import {
  validateCourseData,
  validatePublishRequirements,
  validateStatusTransition,
} from '@/lib/validation/course';

/**
 * 코스 목록 조회 서비스
 */
export const getCourses = async (
  client: SupabaseClient,
  params: CoursesQueryParams
): Promise<HandlerResult<CoursesResponse, CoursesServiceError, unknown>> => {
  try {
    const {
      search,
      category,
      difficulty,
      sortBy = 'latest',
      page = 1,
      limit = 20,
    } = params;

    // 필터 객체 구성
    const filters: CourseFilters = {};
    if (category) filters.category = category;
    if (difficulty) filters.difficulty = difficulty;

    // 전체 개수 조회 (페이지네이션용)
    let countQuery = client
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');

    // 검색어가 있으면 카운트 쿼리에도 적용
    if (search) {
      const sanitizedSearch = search.trim().replace(/'/g, "''");
      if (sanitizedSearch) {
        countQuery = countQuery.or(`title.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
      }
    }

    // 필터가 있으면 카운트 쿼리에도 적용
    if (filters.category) {
      countQuery = countQuery.eq('category_id', filters.category);
    }
    if (filters.difficulty) {
      countQuery = countQuery.eq('difficulty', filters.difficulty);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      return failure(500, coursesErrorCodes.fetchError, countError.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // 코스 목록 조회
    const query = buildCoursesQuery(
      client,
      search,
      filters,
      sortBy as SortOption,
      page,
      limit
    );

    const { data, error } = await query;

    if (error) {
      return failure(500, coursesErrorCodes.fetchError, error.message);
    }

    if (!data) {
      return success({
        courses: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // 데이터 검증 및 변환
    const validatedCourses = [];
    for (const row of data) {
      const rowParse = CourseTableRowSchema.safeParse(row);
      
      if (!rowParse.success) {
        console.error('Course row validation failed:', rowParse.error);
        continue;
      }

      const validatedRow = rowParse.data;
      
      validatedCourses.push({
        id: validatedRow.id,
        title: validatedRow.title,
        description: validatedRow.description,
        difficulty: validatedRow.difficulty,
        enrollmentCount: validatedRow.enrollment_count,
        averageRating: validatedRow.average_rating,
        createdAt: validatedRow.created_at,
        instructor: {
          id: validatedRow.instructor?.id || '',
          fullName: validatedRow.instructor?.full_name || 'Unknown Instructor',
        },
        category: validatedRow.category ? {
          id: validatedRow.category.id,
          name: validatedRow.category.name,
        } : null,
      });
    }

    return success({
      courses: validatedCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });

  } catch (error) {
    console.error('getCourses error:', error);
    return failure(
      500,
      coursesErrorCodes.databaseError,
      'Failed to fetch courses'
    );
  }
};

/**
 * 코스 상세 조회 서비스
 */
export const getCourseById = async (
  client: SupabaseClient,
  courseId: string,
  userId?: string
): Promise<HandlerResult<CourseDetailResponse, CoursesServiceError, unknown>> => {
  try {
    // 코스 상세 정보 조회
    const { data: courseData, error: courseError } = await client
      .from('courses')
      .select(`
        id,
        title,
        description,
        curriculum,
        difficulty,
        status,
        enrollment_count,
        average_rating,
        created_at,
        instructor:users!courses_instructor_id_fkey(
          id,
          full_name
        ),
        category:categories(
          id,
          name
        )
      `)
      .eq('id', courseId)
      .eq('status', 'published') // published 상태만 조회
      .single();

    if (courseError) {
      if (courseError.code === 'PGRST116') {
        return failure(404, coursesErrorCodes.notFound, 'Course not found');
      }
      return failure(500, coursesErrorCodes.fetchError, courseError.message);
    }

    if (!courseData) {
      return failure(404, coursesErrorCodes.notFound, 'Course not found');
    }

    // 데이터 검증
    const rowParse = CourseTableRowSchema.safeParse(courseData);
    
    if (!rowParse.success) {
      return failure(
        500,
        coursesErrorCodes.validationError,
        'Course data validation failed',
        rowParse.error.format()
      );
    }

    const validatedRow = rowParse.data;

    // 수강신청 상태 확인 (사용자가 로그인한 경우)
    let isEnrolled = false;
    if (userId) {
      const { data: enrollmentData } = await client
        .from('enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('learner_id', userId)
        .eq('is_active', true)
        .single();
      
      isEnrolled = !!enrollmentData;
    }

    const courseDetail: CourseDetailResponse = {
      id: validatedRow.id,
      title: validatedRow.title,
      description: validatedRow.description,
      curriculum: validatedRow.curriculum,
      difficulty: validatedRow.difficulty,
      enrollmentCount: validatedRow.enrollment_count,
      averageRating: validatedRow.average_rating,
      createdAt: validatedRow.created_at,
      instructor: {
        id: validatedRow.instructor?.id || '',
        fullName: validatedRow.instructor?.full_name || 'Unknown Instructor',
      },
      category: validatedRow.category ? {
        id: validatedRow.category.id,
        name: validatedRow.category.name,
      } : null,
      isEnrolled,
    };

    return success(courseDetail);

  } catch (error) {
    console.error('getCourseById error:', error);
    return failure(
      500,
      coursesErrorCodes.databaseError,
      'Failed to fetch course details'
    );
  }
};

/**
 * 수강신청 상태 확인 서비스
 */
export const getEnrollmentStatus = async (
  client: SupabaseClient,
  courseId: string,
  userId: string
): Promise<HandlerResult<EnrollmentStatusResponse, CoursesServiceError, unknown>> => {
  try {
    const { data, error } = await client
      .from('enrollments')
      .select('enrolled_at')
      .eq('course_id', courseId)
      .eq('learner_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      return failure(500, coursesErrorCodes.fetchError, error.message);
    }

    const isEnrolled = !!data;
    const enrolledAt = data?.enrolled_at || null;

    return success({
      isEnrolled,
      enrolledAt,
    });

  } catch (error) {
    console.error('getEnrollmentStatus error:', error);
    return failure(
      500,
      coursesErrorCodes.databaseError,
      'Failed to check enrollment status'
    );
  }
};

// Course Management 관련 서비스 함수들

/**
 * 강사의 코스 목록 조회 서비스 (모든 상태 포함)
 */
export const getInstructorCourses = async (
  client: SupabaseClient,
  instructorId: string,
  params: InstructorCoursesQuery
): Promise<HandlerResult<InstructorCoursesResponse, CoursesServiceError, unknown>> => {
  try {
    const { status, page = 1, limit = 20 } = params;

    // 전체 개수 조회 (페이지네이션용)
    let countQuery = client
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('instructor_id', instructorId);

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      return failure(500, coursesErrorCodes.fetchError, countError.message);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // 코스 목록 조회
    let coursesQuery = client
      .from('courses')
      .select(`
        id,
        instructor_id,
        title,
        description,
        curriculum,
        difficulty,
        status,
        enrollment_count,
        average_rating,
        created_at,
        updated_at,
        category:categories(
          id,
          name
        )
      `)
      .eq('instructor_id', instructorId);

    if (status) {
      coursesQuery = coursesQuery.eq('status', status);
    }

    coursesQuery = coursesQuery
      .order('updated_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error } = await coursesQuery;

    if (error) {
      return failure(500, coursesErrorCodes.fetchError, error.message);
    }

    if (!data) {
      return success({
        courses: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // 데이터 검증 및 변환
    const validatedCourses: InstructorCourseResponse[] = [];
    for (const row of data) {
      const rowParse = InstructorCourseTableRowSchema.safeParse(row);
      
      if (!rowParse.success) {
        console.error('Instructor course row validation failed:', rowParse.error);
        continue;
      }

      const validatedRow = rowParse.data;
      
      validatedCourses.push({
        id: validatedRow.id,
        title: validatedRow.title,
        description: validatedRow.description,
        curriculum: validatedRow.curriculum,
        difficulty: validatedRow.difficulty,
        status: validatedRow.status,
        enrollmentCount: validatedRow.enrollment_count,
        averageRating: validatedRow.average_rating,
        createdAt: validatedRow.created_at,
        updatedAt: validatedRow.updated_at,
        category: validatedRow.category ? {
          id: validatedRow.category.id,
          name: validatedRow.category.name,
        } : null,
      });
    }

    return success({
      courses: validatedCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });

  } catch (error) {
    console.error('getInstructorCourses error:', error);
    return failure(
      500,
      coursesErrorCodes.databaseError,
      '강사 코스 목록 조회 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 코스 생성 서비스
 */
export const createCourse = async (
  client: SupabaseClient,
  instructorId: string,
  courseData: CreateCourseRequest
): Promise<HandlerResult<InstructorCourseResponse, CoursesServiceError, unknown>> => {
  try {
    // 입력 데이터 검증
    const validation = validateCourseData({
      title: courseData.title,
      description: courseData.description,
      curriculum: courseData.curriculum,
      categoryId: courseData.categoryId,
      difficulty: courseData.difficulty,
    });
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return failure(400, coursesErrorCodes.validationError, firstError);
    }

    // 카테고리 존재 확인
    const { data: categoryData, error: categoryError } = await client
      .from('categories')
      .select('id')
      .eq('id', courseData.categoryId)
      .eq('is_active', true)
      .single();

    if (categoryError || !categoryData) {
      return failure(400, coursesErrorCodes.categoryNotFound, '존재하지 않거나 비활성화된 카테고리입니다.');
    }

    // 동일 강사의 제목 중복 확인
    const { data: existingCourse, error: duplicateError } = await client
      .from('courses')
      .select('id')
      .eq('instructor_id', instructorId)
      .eq('title', courseData.title.trim())
      .single();

    if (duplicateError && duplicateError.code !== 'PGRST116') {
      return failure(500, coursesErrorCodes.databaseError, duplicateError.message);
    }

    if (existingCourse) {
      return failure(400, coursesErrorCodes.titleDuplicate, '이미 동일한 제목의 코스가 존재합니다.');
    }

    // 코스 생성
    const { data: newCourse, error: createError } = await client
      .from('courses')
      .insert({
        instructor_id: instructorId,
        title: courseData.title.trim(),
        description: courseData.description.trim(),
        curriculum: courseData.curriculum?.trim() || null,
        category_id: courseData.categoryId,
        difficulty: courseData.difficulty,
        status: 'draft', // 항상 draft 상태로 생성
      })
      .select(`
        id,
        instructor_id,
        title,
        description,
        curriculum,
        difficulty,
        status,
        enrollment_count,
        average_rating,
        created_at,
        updated_at,
        category:categories(
          id,
          name
        )
      `)
      .single();

    if (createError) {
      return failure(500, coursesErrorCodes.createError, '코스 생성 중 오류가 발생했습니다.');
    }

    if (!newCourse) {
      return failure(500, coursesErrorCodes.createError, '코스 생성에 실패했습니다.');
    }

    // 데이터 검증 및 변환
    const rowParse = InstructorCourseTableRowSchema.safeParse(newCourse);
    
    if (!rowParse.success) {
      return failure(
        500,
        coursesErrorCodes.validationError,
        '생성된 코스 데이터 검증에 실패했습니다.'
      );
    }

    const validatedRow = rowParse.data;

    return success({
      id: validatedRow.id,
      title: validatedRow.title,
      description: validatedRow.description,
      curriculum: validatedRow.curriculum,
      difficulty: validatedRow.difficulty,
      status: validatedRow.status,
      enrollmentCount: validatedRow.enrollment_count,
      averageRating: validatedRow.average_rating,
      createdAt: validatedRow.created_at,
      updatedAt: validatedRow.updated_at,
      category: validatedRow.category ? {
        id: validatedRow.category.id,
        name: validatedRow.category.name,
      } : null,
    });

  } catch (error) {
    console.error('createCourse error:', error);
    return failure(
      500,
      coursesErrorCodes.databaseError,
      '코스 생성 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 코스 수정 서비스
 */
export const updateCourse = async (
  client: SupabaseClient,
  courseId: string,
  instructorId: string,
  courseData: UpdateCourseRequest
): Promise<HandlerResult<InstructorCourseResponse, CoursesServiceError, unknown>> => {
  try {
    // 코스 소유권 확인
    const ownershipResult = await validateCourseOwnership(client, courseId, instructorId);
    if (!ownershipResult.ok) {
      return ownershipResult as HandlerResult<InstructorCourseResponse, CoursesServiceError, unknown>;
    }

    // 현재 코스 정보 조회
    const { data: currentCourse, error: fetchError } = await client
      .from('courses')
      .select('status, title, enrollment_count')
      .eq('id', courseId)
      .single();

    if (fetchError || !currentCourse) {
      return failure(404, coursesErrorCodes.notFound, '코스를 찾을 수 없습니다.');
    }

    // 수정할 데이터가 있는지 확인
    if (Object.keys(courseData).length === 0) {
      return failure(400, coursesErrorCodes.validationError, '수정할 데이터가 없습니다.');
    }

    // 입력 데이터 검증 (제공된 필드만)
    if (courseData.title !== undefined || courseData.description !== undefined || 
        courseData.categoryId !== undefined || courseData.difficulty !== undefined) {
      
      const dataToValidate = {
        title: courseData.title || currentCourse.title,
        description: courseData.description || '',
        categoryId: courseData.categoryId || '',
        difficulty: courseData.difficulty || 'beginner',
      };

      // 부분 검증 (제공된 필드만)
      if (courseData.title !== undefined) {
        const validation = validateCourseData({ ...dataToValidate, title: courseData.title });
        if (!validation.isValid && validation.errors.title) {
          return failure(400, coursesErrorCodes.validationError, validation.errors.title);
        }
      }

      if (courseData.description !== undefined) {
        const validation = validateCourseData({ ...dataToValidate, description: courseData.description });
        if (!validation.isValid && validation.errors.description) {
          return failure(400, coursesErrorCodes.validationError, validation.errors.description);
        }
      }
    }

    // 카테고리 변경 시 존재 확인
    if (courseData.categoryId) {
      const { data: categoryData, error: categoryError } = await client
        .from('categories')
        .select('id')
        .eq('id', courseData.categoryId)
        .eq('is_active', true)
        .single();

      if (categoryError || !categoryData) {
        return failure(400, coursesErrorCodes.categoryNotFound, '존재하지 않거나 비활성화된 카테고리입니다.');
      }
    }

    // 제목 변경 시 중복 확인
    if (courseData.title && courseData.title.trim() !== currentCourse.title) {
      const { data: existingCourse, error: duplicateError } = await client
        .from('courses')
        .select('id')
        .eq('instructor_id', instructorId)
        .eq('title', courseData.title.trim())
        .neq('id', courseId)
        .single();

      if (duplicateError && duplicateError.code !== 'PGRST116') {
        return failure(500, coursesErrorCodes.databaseError, duplicateError.message);
      }

      if (existingCourse) {
        return failure(400, coursesErrorCodes.titleDuplicate, '이미 동일한 제목의 코스가 존재합니다.');
      }
    }

    // 업데이트할 데이터 구성
    const updateData: Record<string, any> = {};
    
    if (courseData.title !== undefined) {
      updateData.title = courseData.title.trim();
    }
    if (courseData.description !== undefined) {
      updateData.description = courseData.description.trim();
    }
    if (courseData.curriculum !== undefined) {
      updateData.curriculum = courseData.curriculum?.trim() || null;
    }
    if (courseData.categoryId !== undefined) {
      updateData.category_id = courseData.categoryId;
    }
    if (courseData.difficulty !== undefined) {
      updateData.difficulty = courseData.difficulty;
    }

    // 코스 수정
    const { data: updatedCourse, error: updateError } = await client
      .from('courses')
      .update(updateData)
      .eq('id', courseId)
      .select(`
        id,
        instructor_id,
        title,
        description,
        curriculum,
        difficulty,
        status,
        enrollment_count,
        average_rating,
        created_at,
        updated_at,
        category:categories(
          id,
          name
        )
      `)
      .single();

    if (updateError) {
      return failure(500, coursesErrorCodes.updateError, '코스 수정 중 오류가 발생했습니다.');
    }

    if (!updatedCourse) {
      return failure(500, coursesErrorCodes.updateError, '코스 수정에 실패했습니다.');
    }

    // 데이터 검증 및 변환
    const rowParse = InstructorCourseTableRowSchema.safeParse(updatedCourse);
    
    if (!rowParse.success) {
      return failure(
        500,
        coursesErrorCodes.validationError,
        '수정된 코스 데이터 검증에 실패했습니다.'
      );
    }

    const validatedRow = rowParse.data;

    return success({
      id: validatedRow.id,
      title: validatedRow.title,
      description: validatedRow.description,
      curriculum: validatedRow.curriculum,
      difficulty: validatedRow.difficulty,
      status: validatedRow.status,
      enrollmentCount: validatedRow.enrollment_count,
      averageRating: validatedRow.average_rating,
      createdAt: validatedRow.created_at,
      updatedAt: validatedRow.updated_at,
      category: validatedRow.category ? {
        id: validatedRow.category.id,
        name: validatedRow.category.name,
      } : null,
    });

  } catch (error) {
    console.error('updateCourse error:', error);
    return failure(
      500,
      coursesErrorCodes.databaseError,
      '코스 수정 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 코스 상태 변경 서비스
 */
export const updateCourseStatus = async (
  client: SupabaseClient,
  courseId: string,
  instructorId: string,
  newStatus: 'draft' | 'published' | 'archived'
): Promise<HandlerResult<InstructorCourseResponse, CoursesServiceError, unknown>> => {
  try {
    // 코스 소유권 확인
    const ownershipResult = await validateCourseOwnership(client, courseId, instructorId);
    if (!ownershipResult.ok) {
      return ownershipResult as HandlerResult<InstructorCourseResponse, CoursesServiceError, unknown>;
    }

    // 현재 코스 정보 조회
    const { data: currentCourse, error: fetchError } = await client
      .from('courses')
      .select(`
        status,
        title,
        description,
        category_id,
        difficulty,
        enrollment_count
      `)
      .eq('id', courseId)
      .single();

    if (fetchError || !currentCourse) {
      return failure(404, coursesErrorCodes.notFound, '코스를 찾을 수 없습니다.');
    }

    // 상태 전환 가능 여부 검증
    const hasEnrollments = currentCourse.enrollment_count > 0;
    const transitionValidation = validateStatusTransition(
      currentCourse.status,
      newStatus,
      hasEnrollments
    );

    if (!transitionValidation.isValid) {
      return failure(400, coursesErrorCodes.invalidStatus, transitionValidation.message || '상태 전환이 불가능합니다.');
    }

    // published로 전환 시 필수 정보 완성 확인
    if (newStatus === 'published' && currentCourse.status === 'draft') {
      const publishValidation = validatePublishRequirements({
        title: currentCourse.title,
        description: currentCourse.description || '',
        categoryId: currentCourse.category_id || '',
        difficulty: currentCourse.difficulty,
      });

      if (!publishValidation.isValid) {
        return failure(400, coursesErrorCodes.publishRequirements, publishValidation.message || '게시 요구사항을 만족하지 않습니다.');
      }
    }

    // 상태 업데이트
    const { data: updatedCourse, error: updateError } = await client
      .from('courses')
      .update({ status: newStatus })
      .eq('id', courseId)
      .select(`
        id,
        instructor_id,
        title,
        description,
        curriculum,
        difficulty,
        status,
        enrollment_count,
        average_rating,
        created_at,
        updated_at,
        category:categories(
          id,
          name
        )
      `)
      .single();

    if (updateError) {
      return failure(500, coursesErrorCodes.statusUpdateError, '코스 상태 변경 중 오류가 발생했습니다.');
    }

    if (!updatedCourse) {
      return failure(500, coursesErrorCodes.statusUpdateError, '코스 상태 변경에 실패했습니다.');
    }

    // 데이터 검증 및 변환
    const rowParse = InstructorCourseTableRowSchema.safeParse(updatedCourse);
    
    if (!rowParse.success) {
      return failure(
        500,
        coursesErrorCodes.validationError,
        '상태 변경된 코스 데이터 검증에 실패했습니다.'
      );
    }

    const validatedRow = rowParse.data;

    return success({
      id: validatedRow.id,
      title: validatedRow.title,
      description: validatedRow.description,
      curriculum: validatedRow.curriculum,
      difficulty: validatedRow.difficulty,
      status: validatedRow.status,
      enrollmentCount: validatedRow.enrollment_count,
      averageRating: validatedRow.average_rating,
      createdAt: validatedRow.created_at,
      updatedAt: validatedRow.updated_at,
      category: validatedRow.category ? {
        id: validatedRow.category.id,
        name: validatedRow.category.name,
      } : null,
    });

  } catch (error) {
    console.error('updateCourseStatus error:', error);
    return failure(
      500,
      coursesErrorCodes.databaseError,
      '코스 상태 변경 중 오류가 발생했습니다.'
    );
  }
};

/**
 * 코스 소유권 확인 헬퍼 함수
 */
const validateCourseOwnership = async (
  client: SupabaseClient,
  courseId: string,
  instructorId: string
): Promise<HandlerResult<boolean, CoursesServiceError, unknown>> => {
  try {
    const { data: courseData, error } = await client
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return failure(404, coursesErrorCodes.notFound, '코스를 찾을 수 없습니다.');
      }
      return failure(500, coursesErrorCodes.databaseError, error.message);
    }

    if (!courseData) {
      return failure(404, coursesErrorCodes.notFound, '코스를 찾을 수 없습니다.');
    }

    if (courseData.instructor_id !== instructorId) {
      return failure(403, coursesErrorCodes.notOwner, '해당 코스에 대한 권한이 없습니다.');
    }

    return success(true);

  } catch (error) {
    console.error('validateCourseOwnership error:', error);
    return failure(
      500,
      coursesErrorCodes.databaseError,
      '코스 소유권 확인 중 오류가 발생했습니다.'
    );
  }
};
