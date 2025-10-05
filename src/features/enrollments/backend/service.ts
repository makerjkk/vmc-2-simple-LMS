import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  EnrollmentResponseSchema,
  EnrollmentTableRowSchema,
  CourseStatusRowSchema,
  type EnrollmentResponse,
} from './schema';
import {
  enrollmentsErrorCodes,
  type EnrollmentsServiceError,
} from './error';

/**
 * 수강신청 생성 서비스
 */
export const createEnrollment = async (
  client: SupabaseClient,
  courseId: string,
  userId: string
): Promise<HandlerResult<EnrollmentResponse, EnrollmentsServiceError, unknown>> => {
  try {
    // 1. 코스 상태 확인 (published 상태만 수강신청 가능)
    const { data: courseData, error: courseError } = await client
      .from('courses')
      .select('id, status, title')
      .eq('id', courseId)
      .single();

    if (courseError) {
      if (courseError.code === 'PGRST116') {
        return failure(404, enrollmentsErrorCodes.courseNotFound, 'Course not found');
      }
      return failure(500, enrollmentsErrorCodes.databaseError, courseError.message);
    }

    // 코스 상태 검증
    const courseStatusParse = CourseStatusRowSchema.safeParse(courseData);
    if (!courseStatusParse.success) {
      return failure(
        500,
        enrollmentsErrorCodes.validationError,
        'Course data validation failed'
      );
    }

    const course = courseStatusParse.data;
    if (course.status !== 'published') {
      return failure(
        400,
        enrollmentsErrorCodes.courseNotAvailable,
        'Course is not available for enrollment'
      );
    }

    // 2. 중복 수강신청 확인
    const { data: existingEnrollment, error: checkError } = await client
      .from('enrollments')
      .select('id, is_active')
      .eq('course_id', courseId)
      .eq('learner_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return failure(500, enrollmentsErrorCodes.databaseError, checkError.message);
    }

    // 이미 활성 상태로 수강신청되어 있는 경우
    if (existingEnrollment && existingEnrollment.is_active) {
      return failure(
        400,
        enrollmentsErrorCodes.duplicateEnrollment,
        'Already enrolled in this course'
      );
    }

    // 3. 수강신청 생성 또는 재활성화
    let enrollmentData;
    let enrollmentError;

    if (existingEnrollment && !existingEnrollment.is_active) {
      // 기존 수강신청을 재활성화
      const { data, error } = await client
        .from('enrollments')
        .update({
          is_active: true,
          enrolled_at: new Date().toISOString(),
        })
        .eq('id', existingEnrollment.id)
        .select()
        .single();
      
      enrollmentData = data;
      enrollmentError = error;
    } else {
      // 새로운 수강신청 생성
      const { data, error } = await client
        .from('enrollments')
        .insert({
          course_id: courseId,
          learner_id: userId,
          enrolled_at: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single();
      
      enrollmentData = data;
      enrollmentError = error;
    }

    if (enrollmentError) {
      // 중복 키 에러 처리 (동시성 문제)
      if (enrollmentError.code === '23505') {
        return failure(
          400,
          enrollmentsErrorCodes.duplicateEnrollment,
          'Already enrolled in this course'
        );
      }
      return failure(500, enrollmentsErrorCodes.databaseError, enrollmentError.message);
    }

    if (!enrollmentData) {
      return failure(
        500,
        enrollmentsErrorCodes.databaseError,
        'Failed to create enrollment'
      );
    }

    // 데이터 검증
    const enrollmentParse = EnrollmentTableRowSchema.safeParse(enrollmentData);
    if (!enrollmentParse.success) {
      return failure(
        500,
        enrollmentsErrorCodes.validationError,
        'Enrollment data validation failed',
        enrollmentParse.error.format()
      );
    }

    const validatedEnrollment = enrollmentParse.data;

    const response: EnrollmentResponse = {
      id: validatedEnrollment.id,
      courseId: validatedEnrollment.course_id,
      learnerId: validatedEnrollment.learner_id,
      enrolledAt: validatedEnrollment.enrolled_at,
      isActive: validatedEnrollment.is_active,
    };

    return success(response);

  } catch (error) {
    console.error('createEnrollment error:', error);
    return failure(
      500,
      enrollmentsErrorCodes.databaseError,
      'Failed to create enrollment'
    );
  }
};

/**
 * 수강취소 서비스
 */
export const deleteEnrollment = async (
  client: SupabaseClient,
  courseId: string,
  userId: string
): Promise<HandlerResult<void, EnrollmentsServiceError, unknown>> => {
  try {
    // 1. 기존 수강신청 확인
    const { data: existingEnrollment, error: checkError } = await client
      .from('enrollments')
      .select('id, is_active')
      .eq('course_id', courseId)
      .eq('learner_id', userId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return failure(404, enrollmentsErrorCodes.enrollmentNotFound, 'Enrollment not found');
      }
      return failure(500, enrollmentsErrorCodes.databaseError, checkError.message);
    }

    if (!existingEnrollment || !existingEnrollment.is_active) {
      return failure(404, enrollmentsErrorCodes.enrollmentNotFound, 'Active enrollment not found');
    }

    // 2. 수강신청 비활성화 (소프트 삭제)
    const { error: updateError } = await client
      .from('enrollments')
      .update({ is_active: false })
      .eq('id', existingEnrollment.id);

    if (updateError) {
      return failure(500, enrollmentsErrorCodes.databaseError, updateError.message);
    }

    return success(undefined);

  } catch (error) {
    console.error('deleteEnrollment error:', error);
    return failure(
      500,
      enrollmentsErrorCodes.databaseError,
      'Failed to cancel enrollment'
    );
  }
};

/**
 * 사용자의 수강신청 목록 조회 서비스
 */
export const getUserEnrollments = async (
  client: SupabaseClient,
  userId: string
): Promise<HandlerResult<EnrollmentResponse[], EnrollmentsServiceError, unknown>> => {
  try {
    const { data, error } = await client
      .from('enrollments')
      .select('*')
      .eq('learner_id', userId)
      .eq('is_active', true)
      .order('enrolled_at', { ascending: false });

    if (error) {
      return failure(500, enrollmentsErrorCodes.databaseError, error.message);
    }

    if (!data) {
      return success([]);
    }

    // 데이터 검증 및 변환
    const validatedEnrollments: EnrollmentResponse[] = [];
    for (const row of data) {
      const enrollmentParse = EnrollmentTableRowSchema.safeParse(row);
      
      if (!enrollmentParse.success) {
        console.error('Enrollment row validation failed:', enrollmentParse.error);
        continue;
      }

      const validatedRow = enrollmentParse.data;
      
      validatedEnrollments.push({
        id: validatedRow.id,
        courseId: validatedRow.course_id,
        learnerId: validatedRow.learner_id,
        enrolledAt: validatedRow.enrolled_at,
        isActive: validatedRow.is_active,
      });
    }

    return success(validatedEnrollments);

  } catch (error) {
    console.error('getUserEnrollments error:', error);
    return failure(
      500,
      enrollmentsErrorCodes.databaseError,
      'Failed to fetch user enrollments'
    );
  }
};
