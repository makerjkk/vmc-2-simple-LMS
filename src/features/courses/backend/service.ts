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
  type CoursesResponse,
  type CourseDetailResponse,
  type EnrollmentStatusResponse,
  type CoursesQueryParams,
} from './schema';
import {
  coursesErrorCodes,
  type CoursesServiceError,
} from './error';

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
