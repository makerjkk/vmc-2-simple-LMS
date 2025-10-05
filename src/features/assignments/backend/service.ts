import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import { createAssignmentLog } from './logs-service';
import {
  type AssignmentDetailResponse,
  type AssignmentTableRow,
  type SubmissionTableRow,
  type CourseTableRow,
  type CreateSubmissionRequest,
  type UpdateSubmissionRequest,
  type SubmissionResponse,
  CreateSubmissionRequestSchema,
  UpdateSubmissionRequestSchema,
  // 강사용 스키마 추가
  type CreateAssignmentRequest,
  type UpdateAssignmentRequest,
  type AssignmentStatusUpdate,
  type InstructorAssignmentsQuery,
  type InstructorAssignmentsResponse,
  type InstructorAssignmentResponse,
  type AssignmentSubmissionsQuery,
  type AssignmentSubmissionsResponse,
  type SubmissionDetailResponse,
  CreateAssignmentRequestSchema,
  UpdateAssignmentRequestSchema,
  AssignmentStatusUpdateSchema,
  // 채점 관련 스키마 추가
  type GradeSubmissionRequest,
  type GradeSubmissionResponse,
  type SubmissionForGrading,
  type SubmissionsForGradingResponse,
  GradeSubmissionRequestSchema,
} from './schema';
import {
  assignmentErrorCodes,
  type AssignmentServiceError,
  submissionErrorCodes,
  type SubmissionServiceError,
  gradingErrorCodes,
  type GradingServiceError,
} from './error';

/**
 * 과제 상세 정보 조회 서비스
 * 권한 검증 및 제출물 정보를 포함하여 반환
 */
export const getAssignmentDetail = async (
  client: SupabaseClient,
  assignmentId: string,
  userId: string
): Promise<HandlerResult<AssignmentDetailResponse, string, unknown>> => {
  try {
    // 1. 과제 존재 여부 및 기본 정보 조회
    const { data: assignmentData, error: assignmentError } = await client
      .from('assignments')
      .select(`
        id,
        course_id,
        title,
        description,
        due_date,
        score_weight,
        allow_late_submission,
        allow_resubmission,
        status,
        courses!inner(
          id,
          title
        )
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      return failure(404, assignmentErrorCodes.notFound, '과제를 찾을 수 없습니다.');
    }

    // 2. 과제 상태 확인 (published만 허용)
    if (assignmentData.status !== 'published') {
      return failure(404, assignmentErrorCodes.notPublished, '아직 공개되지 않은 과제입니다.');
    }

    // 3. 사용자의 해당 코스 수강 여부 확인
    const { data: enrollmentData, error: enrollmentError } = await client
      .from('enrollments')
      .select('id')
      .eq('learner_id', userId)
      .eq('course_id', assignmentData.course_id)
      .eq('is_active', true)
      .single();

    if (enrollmentError || !enrollmentData) {
      return failure(403, assignmentErrorCodes.notEnrolled, '수강 중인 코스가 아닙니다.');
    }

    // 4. 사용자의 제출물 정보 조회 (있는 경우)
    const { data: submissionData, error: submissionError } = await client
      .from('submissions')
      .select(`
        id,
        assignment_id,
        learner_id,
        content,
        link_url,
        is_late,
        status,
        score,
        feedback,
        graded_at,
        graded_by,
        submitted_at,
        updated_at
      `)
      .eq('assignment_id', assignmentId)
      .eq('learner_id', userId)
      .single();

    // 제출물이 없는 경우는 에러가 아님
    const submission = submissionData && !submissionError ? {
      id: submissionData.id,
      status: submissionData.status as 'submitted' | 'graded' | 'resubmission_required',
      submittedAt: submissionData.submitted_at,
      isLate: submissionData.is_late,
      content: submissionData.content,
      link: submissionData.link_url,
      score: submissionData.score,
      feedback: submissionData.feedback,
    } : null;

    // 5. 응답 데이터 구성
    const response: AssignmentDetailResponse = {
      id: assignmentData.id,
      title: assignmentData.title,
      description: assignmentData.description,
      dueDate: assignmentData.due_date,
      scoreWeight: assignmentData.score_weight,
      allowLateSubmission: assignmentData.allow_late_submission,
      allowResubmission: assignmentData.allow_resubmission,
      status: assignmentData.status as 'draft' | 'published' | 'closed',
      course: {
        id: assignmentData.courses[0].id,
        title: assignmentData.courses[0].title,
      },
      submission,
    };

    return success(response);

  } catch (error) {
    return failure(
      500,
      assignmentErrorCodes.databaseError,
      '과제 정보 조회 중 오류가 발생했습니다.',
      error
    );
  }
};

/**
 * 제출물 생성 서비스
 * 마감일, 지각 허용 정책, 중복 제출 등을 검증하여 제출물을 생성
 */
export const createSubmission = async (
  client: SupabaseClient,
  assignmentId: string,
  userId: string,
  data: CreateSubmissionRequest
): Promise<HandlerResult<SubmissionResponse, string, unknown>> => {
  try {
    // 1. 요청 데이터 검증
    const parsedData = CreateSubmissionRequestSchema.safeParse(data);
    if (!parsedData.success) {
      return failure(400, submissionErrorCodes.validationError, '입력 데이터가 올바르지 않습니다.');
    }

    // 2. 과제 존재 여부 및 정보 조회
    const { data: assignmentData, error: assignmentError } = await client
      .from('assignments')
      .select(`
        id,
        course_id,
        title,
        due_date,
        allow_late_submission,
        allow_resubmission,
        status
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      return failure(404, submissionErrorCodes.submissionNotFound, '과제를 찾을 수 없습니다.');
    }

    // 3. 과제 상태 확인 (published만 허용)
    if (assignmentData.status !== 'published') {
      return failure(400, submissionErrorCodes.assignmentNotPublished, '아직 공개되지 않은 과제입니다.');
    }

    // 4. 사용자의 해당 코스 수강 여부 확인
    const { data: enrollmentData, error: enrollmentError } = await client
      .from('enrollments')
      .select('id')
      .eq('learner_id', userId)
      .eq('course_id', assignmentData.course_id)
      .eq('is_active', true)
      .single();

    if (enrollmentError || !enrollmentData) {
      return failure(403, submissionErrorCodes.notEnrolled, '수강 중인 코스가 아닙니다.');
    }

    // 5. 기존 제출물 확인 (중복 제출 방지)
    const { data: existingSubmission, error: existingError } = await client
      .from('submissions')
      .select('id, status')
      .eq('assignment_id', assignmentId)
      .eq('learner_id', userId)
      .single();

    if (existingSubmission && !existingError) {
      return failure(409, submissionErrorCodes.duplicateSubmission, '이미 제출한 과제입니다.');
    }

    // 6. 마감일 검증 및 지각 여부 판단
    const now = new Date();
    const dueDate = new Date(assignmentData.due_date);
    const isLate = now > dueDate;

    if (isLate && !assignmentData.allow_late_submission) {
      return failure(400, submissionErrorCodes.lateSubmissionNotAllowed, '마감일이 지나 제출할 수 없습니다.');
    }

    // 7. 제출물 생성
    const submissionRecord = {
      assignment_id: assignmentId,
      learner_id: userId,
      content: parsedData.data.content,
      link_url: parsedData.data.linkUrl || null,
      is_late: isLate,
      status: 'submitted' as const,
      submitted_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { data: submissionData, error: submissionError } = await client
      .from('submissions')
      .insert(submissionRecord)
      .select()
      .single();

    if (submissionError || !submissionData) {
      return failure(500, submissionErrorCodes.databaseError, '제출물 저장 중 오류가 발생했습니다.');
    }

    // 8. 응답 데이터 구성
    const response: SubmissionResponse = {
      id: submissionData.id,
      assignmentId: submissionData.assignment_id,
      content: submissionData.content,
      linkUrl: submissionData.link_url,
      isLate: submissionData.is_late,
      status: submissionData.status as 'submitted' | 'graded' | 'resubmission_required',
      submittedAt: submissionData.submitted_at,
      canResubmit: assignmentData.allow_resubmission,
    };

    return success(response);

  } catch (error) {
    return failure(
      500,
      submissionErrorCodes.databaseError,
      '제출물 생성 중 오류가 발생했습니다.',
      error
    );
  }
};

/**
 * 제출물 업데이트 서비스 (재제출)
 * 재제출 허용 정책을 검증하여 기존 제출물을 업데이트
 */
export const updateSubmission = async (
  client: SupabaseClient,
  assignmentId: string,
  userId: string,
  data: UpdateSubmissionRequest
): Promise<HandlerResult<SubmissionResponse, string, unknown>> => {
  try {
    // 1. 요청 데이터 검증
    const parsedData = UpdateSubmissionRequestSchema.safeParse(data);
    if (!parsedData.success) {
      return failure(400, submissionErrorCodes.validationError, '입력 데이터가 올바르지 않습니다.');
    }

    // 2. 과제 존재 여부 및 정보 조회
    const { data: assignmentData, error: assignmentError } = await client
      .from('assignments')
      .select(`
        id,
        course_id,
        title,
        due_date,
        allow_late_submission,
        allow_resubmission,
        status
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      return failure(404, submissionErrorCodes.submissionNotFound, '과제를 찾을 수 없습니다.');
    }

    // 3. 과제 상태 확인
    if (assignmentData.status === 'closed') {
      return failure(400, submissionErrorCodes.submissionClosed, '마감된 과제는 재제출할 수 없습니다.');
    }

    if (assignmentData.status !== 'published') {
      return failure(400, submissionErrorCodes.assignmentNotPublished, '아직 공개되지 않은 과제입니다.');
    }

    // 4. 재제출 허용 정책 확인
    if (!assignmentData.allow_resubmission) {
      return failure(400, submissionErrorCodes.resubmissionNotAllowed, '재제출이 허용되지 않는 과제입니다.');
    }

    // 5. 사용자의 해당 코스 수강 여부 확인
    const { data: enrollmentData, error: enrollmentError } = await client
      .from('enrollments')
      .select('id')
      .eq('learner_id', userId)
      .eq('course_id', assignmentData.course_id)
      .eq('is_active', true)
      .single();

    if (enrollmentError || !enrollmentData) {
      return failure(403, submissionErrorCodes.notEnrolled, '수강 중인 코스가 아닙니다.');
    }

    // 6. 기존 제출물 확인
    const { data: existingSubmission, error: existingError } = await client
      .from('submissions')
      .select('id, status')
      .eq('assignment_id', assignmentId)
      .eq('learner_id', userId)
      .single();

    if (existingError || !existingSubmission) {
      return failure(404, submissionErrorCodes.submissionNotFound, '기존 제출물을 찾을 수 없습니다.');
    }

    // 7. 마감일 검증 및 지각 여부 판단
    const now = new Date();
    const dueDate = new Date(assignmentData.due_date);
    const isLate = now > dueDate;

    if (isLate && !assignmentData.allow_late_submission) {
      return failure(400, submissionErrorCodes.lateSubmissionNotAllowed, '마감일이 지나 재제출할 수 없습니다.');
    }

    // 8. 제출물 업데이트
    const updateRecord = {
      content: parsedData.data.content,
      link_url: parsedData.data.linkUrl || null,
      is_late: isLate,
      status: 'submitted' as const,
      submitted_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { data: submissionData, error: submissionError } = await client
      .from('submissions')
      .update(updateRecord)
      .eq('id', existingSubmission.id)
      .select()
      .single();

    if (submissionError || !submissionData) {
      return failure(500, submissionErrorCodes.databaseError, '제출물 업데이트 중 오류가 발생했습니다.');
    }

    // 9. 응답 데이터 구성
    const response: SubmissionResponse = {
      id: submissionData.id,
      assignmentId: submissionData.assignment_id,
      content: submissionData.content,
      linkUrl: submissionData.link_url,
      isLate: submissionData.is_late,
      status: submissionData.status as 'submitted' | 'graded' | 'resubmission_required',
      submittedAt: submissionData.submitted_at,
      canResubmit: assignmentData.allow_resubmission,
    };

    return success(response);

  } catch (error) {
    return failure(
      500,
      submissionErrorCodes.databaseError,
      '제출물 업데이트 중 오류가 발생했습니다.',
      error
    );
  }
};

/**
 * 제출물 조회 서비스
 * 사용자의 특정 과제에 대한 제출물 정보를 조회
 */
export const getSubmission = async (
  client: SupabaseClient,
  assignmentId: string,
  userId: string
): Promise<HandlerResult<SubmissionResponse | null, string, unknown>> => {
  try {
    // 1. 과제 존재 여부 및 정보 조회
    const { data: assignmentData, error: assignmentError } = await client
      .from('assignments')
      .select(`
        id,
        course_id,
        allow_resubmission,
        status
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      return failure(404, submissionErrorCodes.submissionNotFound, '과제를 찾을 수 없습니다.');
    }

    // 2. 사용자의 해당 코스 수강 여부 확인
    const { data: enrollmentData, error: enrollmentError } = await client
      .from('enrollments')
      .select('id')
      .eq('learner_id', userId)
      .eq('course_id', assignmentData.course_id)
      .eq('is_active', true)
      .single();

    if (enrollmentError || !enrollmentData) {
      return failure(403, submissionErrorCodes.notEnrolled, '수강 중인 코스가 아닙니다.');
    }

    // 3. 제출물 조회
    const { data: submissionData, error: submissionError } = await client
      .from('submissions')
      .select(`
        id,
        assignment_id,
        learner_id,
        content,
        link_url,
        is_late,
        status,
        submitted_at,
        updated_at
      `)
      .eq('assignment_id', assignmentId)
      .eq('learner_id', userId)
      .single();

    // 제출물이 없는 경우 null 반환
    if (submissionError || !submissionData) {
      return success(null);
    }

    // 4. 응답 데이터 구성
    const response: SubmissionResponse = {
      id: submissionData.id,
      assignmentId: submissionData.assignment_id,
      content: submissionData.content,
      linkUrl: submissionData.link_url,
      isLate: submissionData.is_late,
      status: submissionData.status as 'submitted' | 'graded' | 'resubmission_required',
      submittedAt: submissionData.submitted_at,
      canResubmit: assignmentData.allow_resubmission,
    };

    return success(response);

  } catch (error) {
    return failure(
      500,
      submissionErrorCodes.databaseError,
      '제출물 조회 중 오류가 발생했습니다.',
      error
    );
  }
};

// ===== 강사용 서비스 함수들 =====

/**
 * 강사용 과제 생성 서비스
 * 코스 소유권 검증 및 점수 비중 합계 검증 포함
 */
export const createAssignmentForInstructor = async (
  client: SupabaseClient,
  courseId: string,
  instructorId: string,
  data: CreateAssignmentRequest
): Promise<HandlerResult<InstructorAssignmentResponse, string, unknown>> => {
  try {
    // 1. 요청 데이터 검증
    const parsedData = CreateAssignmentRequestSchema.safeParse(data);
    if (!parsedData.success) {
      return failure(400, assignmentErrorCodes.validationError, '입력 데이터가 올바르지 않습니다.');
    }

    // 2. 강사 권한 및 코스 소유권 검증
    const { data: courseData, error: courseError } = await client
      .from('courses')
      .select('id, instructor_id, title')
      .eq('id', courseId)
      .eq('instructor_id', instructorId)
      .single();

    if (courseError || !courseData) {
      return failure(403, assignmentErrorCodes.notCourseOwner, '해당 코스에 대한 권한이 없습니다.');
    }

    // 3. 기존 과제들의 점수 비중 합계 확인
    const { data: existingAssignments, error: assignmentsError } = await client
      .from('assignments')
      .select('score_weight')
      .eq('course_id', courseId)
      .neq('status', 'draft'); // draft 상태가 아닌 과제들만

    if (assignmentsError) {
      return failure(500, assignmentErrorCodes.fetchError, '기존 과제 정보 조회에 실패했습니다.');
    }

    const currentTotalWeight = existingAssignments?.reduce((sum, assignment) => sum + assignment.score_weight, 0) || 0;
    const newTotalWeight = currentTotalWeight + parsedData.data.scoreWeight;

    // 점수 비중 합계가 100을 초과하는 경우 경고 (차단하지는 않음)
    if (newTotalWeight > 100) {
      // 경고 메시지와 함께 계속 진행
      console.warn(`Score weight total exceeds 100%: ${newTotalWeight}%`);
    }

    // 4. 과제 생성
    const now = new Date().toISOString();
    const assignmentRecord = {
      course_id: courseId,
      title: parsedData.data.title,
      description: parsedData.data.description,
      due_date: parsedData.data.dueDate,
      score_weight: parsedData.data.scoreWeight,
      allow_late_submission: parsedData.data.allowLateSubmission,
      allow_resubmission: parsedData.data.allowResubmission,
      status: 'draft' as const,
      created_at: now,
      updated_at: now,
    };

    const { data: assignmentData, error: assignmentError } = await client
      .from('assignments')
      .insert(assignmentRecord)
      .select()
      .single();

    if (assignmentError || !assignmentData) {
      return failure(500, assignmentErrorCodes.createFailed, '과제 생성에 실패했습니다.');
    }

    // 5. 응답 데이터 구성
    const response: InstructorAssignmentResponse = {
      id: assignmentData.id,
      courseId: assignmentData.course_id,
      title: assignmentData.title,
      description: assignmentData.description,
      dueDate: assignmentData.due_date,
      scoreWeight: assignmentData.score_weight,
      allowLateSubmission: assignmentData.allow_late_submission,
      allowResubmission: assignmentData.allow_resubmission,
      status: assignmentData.status as 'draft' | 'published' | 'closed',
      submissionCount: 0,
      gradedCount: 0,
      createdAt: assignmentData.created_at,
      updatedAt: assignmentData.updated_at,
    };

    return success(response);

  } catch (error) {
    return failure(
      500,
      assignmentErrorCodes.databaseError,
      '과제 생성 중 오류가 발생했습니다.',
      error
    );
  }
};

/**
 * 강사용 과제 수정 서비스
 * 제출물 존재 여부에 따른 수정 제한 적용
 */
export const updateAssignmentForInstructor = async (
  client: SupabaseClient,
  assignmentId: string,
  instructorId: string,
  data: UpdateAssignmentRequest
): Promise<HandlerResult<InstructorAssignmentResponse, string, unknown>> => {
  try {
    // 1. 요청 데이터 검증
    const parsedData = UpdateAssignmentRequestSchema.safeParse(data);
    if (!parsedData.success) {
      return failure(400, assignmentErrorCodes.validationError, '입력 데이터가 올바르지 않습니다.');
    }

    // 2. 과제 존재 여부 및 소유권 검증
    const { data: assignmentData, error: assignmentError } = await client
      .from('assignments')
      .select(`
        id,
        course_id,
        title,
        description,
        due_date,
        score_weight,
        allow_late_submission,
        allow_resubmission,
        status,
        created_at,
        updated_at,
        courses!inner(instructor_id)
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      return failure(404, assignmentErrorCodes.notFound, '과제를 찾을 수 없습니다.');
    }

    // 강사 권한 검증
    if ((assignmentData.courses as any).instructor_id !== instructorId) {
      return failure(403, assignmentErrorCodes.notCourseOwner, '해당 과제에 대한 권한이 없습니다.');
    }

    // 3. 제출물 존재 여부 확인
    const { data: submissionsData, error: submissionsError } = await client
      .from('submissions')
      .select('id')
      .eq('assignment_id', assignmentId);

    if (submissionsError) {
      return failure(500, assignmentErrorCodes.fetchError, '제출물 정보 조회에 실패했습니다.');
    }

    const hasSubmissions = submissionsData && submissionsData.length > 0;

    // 4. 게시된 과제이고 제출물이 있는 경우 수정 제한
    if (assignmentData.status === 'published' && hasSubmissions) {
      // 핵심 정보(마감일, 점수 비중) 수정 시도 시 제한
      if (parsedData.data.dueDate || parsedData.data.scoreWeight !== undefined) {
        return failure(400, assignmentErrorCodes.cannotEditPublishedAssignment, 
          '제출물이 있는 게시된 과제는 마감일과 점수 비중을 수정할 수 없습니다.');
      }
    }

    // 5. 점수 비중 변경 시 합계 검증
    if (parsedData.data.scoreWeight !== undefined) {
      const { data: otherAssignments, error: otherAssignmentsError } = await client
        .from('assignments')
        .select('score_weight')
        .eq('course_id', assignmentData.course_id)
        .neq('id', assignmentId)
        .neq('status', 'draft');

      if (otherAssignmentsError) {
        return failure(500, assignmentErrorCodes.fetchError, '기존 과제 정보 조회에 실패했습니다.');
      }

      const otherTotalWeight = otherAssignments?.reduce((sum, assignment) => sum + assignment.score_weight, 0) || 0;
      const newTotalWeight = otherTotalWeight + parsedData.data.scoreWeight;

      if (newTotalWeight > 100) {
        console.warn(`Score weight total exceeds 100%: ${newTotalWeight}%`);
      }
    }

    // 6. 과제 정보 업데이트
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (parsedData.data.title) updateData.title = parsedData.data.title;
    if (parsedData.data.description) updateData.description = parsedData.data.description;
    if (parsedData.data.dueDate) updateData.due_date = parsedData.data.dueDate;
    if (parsedData.data.scoreWeight !== undefined) updateData.score_weight = parsedData.data.scoreWeight;
    if (parsedData.data.allowLateSubmission !== undefined) updateData.allow_late_submission = parsedData.data.allowLateSubmission;
    if (parsedData.data.allowResubmission !== undefined) updateData.allow_resubmission = parsedData.data.allowResubmission;

    const { data: updatedAssignment, error: updateError } = await client
      .from('assignments')
      .update(updateData)
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError || !updatedAssignment) {
      return failure(500, assignmentErrorCodes.updateFailed, '과제 수정에 실패했습니다.');
    }

    // 7. 제출물 통계 조회
    const { data: submissionStats } = await client
      .from('submissions')
      .select('status')
      .eq('assignment_id', assignmentId);

    const submissionCount = submissionStats?.length || 0;
    const gradedCount = submissionStats?.filter(s => s.status === 'graded').length || 0;

    // 8. 응답 데이터 구성
    const response: InstructorAssignmentResponse = {
      id: updatedAssignment.id,
      courseId: updatedAssignment.course_id,
      title: updatedAssignment.title,
      description: updatedAssignment.description,
      dueDate: updatedAssignment.due_date,
      scoreWeight: updatedAssignment.score_weight,
      allowLateSubmission: updatedAssignment.allow_late_submission,
      allowResubmission: updatedAssignment.allow_resubmission,
      status: updatedAssignment.status as 'draft' | 'published' | 'closed',
      submissionCount,
      gradedCount,
      createdAt: updatedAssignment.created_at,
      updatedAt: updatedAssignment.updated_at,
    };

    return success(response);

  } catch (error) {
    return failure(
      500,
      assignmentErrorCodes.databaseError,
      '과제 수정 중 오류가 발생했습니다.',
      error
    );
  }
};

/**
 * 강사용 과제 삭제 서비스
 * 제출물이 있는 경우 삭제 불가
 */
export const deleteAssignmentForInstructor = async (
  client: SupabaseClient,
  assignmentId: string,
  instructorId: string
): Promise<HandlerResult<{ success: boolean }, string, unknown>> => {
  try {
    // 1. 과제 존재 여부 및 소유권 검증
    const { data: assignmentData, error: assignmentError } = await client
      .from('assignments')
      .select(`
        id,
        status,
        courses!inner(instructor_id)
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      return failure(404, assignmentErrorCodes.notFound, '과제를 찾을 수 없습니다.');
    }

    // 강사 권한 검증
    if ((assignmentData.courses as any).instructor_id !== instructorId) {
      return failure(403, assignmentErrorCodes.notCourseOwner, '해당 과제에 대한 권한이 없습니다.');
    }

    // 2. 제출물 존재 여부 확인
    const { data: submissionsData, error: submissionsError } = await client
      .from('submissions')
      .select('id')
      .eq('assignment_id', assignmentId);

    if (submissionsError) {
      return failure(500, assignmentErrorCodes.fetchError, '제출물 정보 조회에 실패했습니다.');
    }

    if (submissionsData && submissionsData.length > 0) {
      return failure(400, assignmentErrorCodes.cannotDeleteWithSubmissions, 
        '제출물이 있는 과제는 삭제할 수 없습니다.');
    }

    // 3. 과제 삭제
    const { error: deleteError } = await client
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (deleteError) {
      return failure(500, assignmentErrorCodes.deleteFailed, '과제 삭제에 실패했습니다.');
    }

    return success({ success: true });

  } catch (error) {
    return failure(
      500,
      assignmentErrorCodes.databaseError,
      '과제 삭제 중 오류가 발생했습니다.',
      error
    );
  }
};

/**
 * 과제 상태 전환 서비스
 * 비즈니스 룰에 따른 상태 전환 검증 포함
 */
export const updateAssignmentStatus = async (
  client: SupabaseClient,
  assignmentId: string,
  instructorId: string,
  data: AssignmentStatusUpdate
): Promise<HandlerResult<InstructorAssignmentResponse, string, unknown>> => {
  try {
    // 1. 요청 데이터 검증
    const parsedData = AssignmentStatusUpdateSchema.safeParse(data);
    if (!parsedData.success) {
      return failure(400, assignmentErrorCodes.validationError, '유효하지 않은 상태입니다.');
    }

    // 2. 과제 존재 여부 및 소유권 검증
    const { data: assignmentData, error: assignmentError } = await client
      .from('assignments')
      .select(`
        id,
        course_id,
        title,
        description,
        due_date,
        score_weight,
        allow_late_submission,
        allow_resubmission,
        status,
        created_at,
        updated_at,
        courses!inner(instructor_id)
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      return failure(404, assignmentErrorCodes.notFound, '과제를 찾을 수 없습니다.');
    }

    // 강사 권한 검증
    if ((assignmentData.courses as any).instructor_id !== instructorId) {
      return failure(403, assignmentErrorCodes.notCourseOwner, '해당 과제에 대한 권한이 없습니다.');
    }

    const currentStatus = assignmentData.status;
    const newStatus = parsedData.data.status;

    // 3. 상태 전환 규칙 검증
    if (currentStatus === newStatus) {
      return failure(400, assignmentErrorCodes.invalidStatusTransition, '동일한 상태로는 전환할 수 없습니다.');
    }

    // 상태 전환 규칙 검증
    const validTransitions = {
      draft: ['published'],
      published: ['closed'],
      closed: ['published'], // 마감일이 미래인 경우에만 허용
    };

    if (!validTransitions[currentStatus as keyof typeof validTransitions]?.includes(newStatus)) {
      return failure(400, assignmentErrorCodes.invalidStatusTransition, 
        `${currentStatus}에서 ${newStatus}로 상태 전환이 불가능합니다.`);
    }

    // closed에서 published로 전환 시 마감일 검증
    if (currentStatus === 'closed' && newStatus === 'published') {
      const dueDate = new Date(assignmentData.due_date);
      const now = new Date();
      
      if (dueDate <= now) {
        return failure(400, assignmentErrorCodes.invalidStatusTransition, 
          '마감일이 지난 과제는 다시 게시할 수 없습니다.');
      }
    }

    // 4. 상태 업데이트
    const { data: updatedAssignment, error: updateError } = await client
      .from('assignments')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError || !updatedAssignment) {
      return failure(500, assignmentErrorCodes.statusUpdateFailed, '상태 변경에 실패했습니다.');
    }

    // 4.1. 상태 변경 로그 생성
    try {
      await createAssignmentLog(client, {
        assignmentId,
        changedBy: instructorId,
        previousStatus: currentStatus as 'draft' | 'published' | 'closed',
        newStatus: newStatus as 'draft' | 'published' | 'closed',
        changeReason: 'manual',
        metadata: {
          userAgent: 'web-app', // 실제 구현에서는 요청 헤더에서 가져올 수 있음
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logError) {
      // 로그 생성 실패는 경고로 처리 (상태 변경은 성공했으므로)
      console.warn(`Assignment ${assignmentId} 상태 변경 로그 생성 실패:`, logError);
    }

    // 5. 제출물 통계 조회
    const { data: submissionStats } = await client
      .from('submissions')
      .select('status')
      .eq('assignment_id', assignmentId);

    const submissionCount = submissionStats?.length || 0;
    const gradedCount = submissionStats?.filter(s => s.status === 'graded').length || 0;

    // 6. 응답 데이터 구성
    const response: InstructorAssignmentResponse = {
      id: updatedAssignment.id,
      courseId: updatedAssignment.course_id,
      title: updatedAssignment.title,
      description: updatedAssignment.description,
      dueDate: updatedAssignment.due_date,
      scoreWeight: updatedAssignment.score_weight,
      allowLateSubmission: updatedAssignment.allow_late_submission,
      allowResubmission: updatedAssignment.allow_resubmission,
      status: updatedAssignment.status as 'draft' | 'published' | 'closed',
      submissionCount,
      gradedCount,
      createdAt: updatedAssignment.created_at,
      updatedAt: updatedAssignment.updated_at,
    };

    return success(response);

  } catch (error) {
    return failure(
      500,
      assignmentErrorCodes.databaseError,
      '상태 변경 중 오류가 발생했습니다.',
      error
    );
  }
};

/**
 * 강사용 과제 목록 조회 서비스
 * 페이지네이션 및 필터링 지원
 */
export const getInstructorAssignments = async (
  client: SupabaseClient,
  authUserId: string,
  params: InstructorAssignmentsQuery
): Promise<HandlerResult<InstructorAssignmentsResponse, string, unknown>> => {
  try {
    const { courseId, status, page = 1, limit = 20 } = params;

    // 1. Auth ID를 내부 사용자 ID로 변환
    const { data: userData, error: userError } = await client
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single();

    if (userError || !userData) {
      return failure(401, assignmentErrorCodes.unauthorized, '사용자를 찾을 수 없습니다.');
    }

    // 2. 코스 소유권 검증
    const { data: courseData, error: courseError } = await client
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('instructor_id', userData.id)
      .single();

    if (courseError || !courseData) {
      return failure(403, assignmentErrorCodes.notCourseOwner, '해당 코스에 대한 권한이 없습니다.');
    }

    // 3. 전체 개수 조회
    let countQuery = client
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId);

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      return failure(500, assignmentErrorCodes.fetchError, '과제 개수 조회에 실패했습니다.');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // 4. 과제 목록 조회
    let assignmentsQuery = client
      .from('assignments')
      .select(`
        id,
        course_id,
        title,
        description,
        due_date,
        score_weight,
        allow_late_submission,
        allow_resubmission,
        status,
        created_at,
        updated_at
      `)
      .eq('course_id', courseId);

    if (status) {
      assignmentsQuery = assignmentsQuery.eq('status', status);
    }

    assignmentsQuery = assignmentsQuery
      .order('updated_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const { data: assignmentsData, error: assignmentsError } = await assignmentsQuery;

    if (assignmentsError) {
      return failure(500, assignmentErrorCodes.fetchError, '과제 목록 조회에 실패했습니다.');
    }

    if (!assignmentsData) {
      return success({
        assignments: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    // 4. 각 과제별 제출물 통계 조회
    const assignmentIds = assignmentsData.map(a => a.id);
    const { data: submissionStats } = await client
      .from('submissions')
      .select('assignment_id, status')
      .in('assignment_id', assignmentIds);

    // 5. 응답 데이터 구성
    const assignments: InstructorAssignmentResponse[] = assignmentsData.map(assignment => {
      const assignmentSubmissions = submissionStats?.filter(s => s.assignment_id === assignment.id) || [];
      const submissionCount = assignmentSubmissions.length;
      const gradedCount = assignmentSubmissions.filter(s => s.status === 'graded').length;

      return {
        id: assignment.id,
        courseId: assignment.course_id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        scoreWeight: assignment.score_weight,
        allowLateSubmission: assignment.allow_late_submission,
        allowResubmission: assignment.allow_resubmission,
        status: assignment.status as 'draft' | 'published' | 'closed',
        submissionCount,
        gradedCount,
        createdAt: assignment.created_at,
        updatedAt: assignment.updated_at,
      };
    });

    const response: InstructorAssignmentsResponse = {
      assignments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return success(response);

  } catch (error) {
    return failure(
      500,
      assignmentErrorCodes.databaseError,
      '과제 목록 조회 중 오류가 발생했습니다.',
      error
    );
  }
};

/**
 * 강사용 제출물 목록 조회 서비스
 * 필터링 및 통계 정보 포함
 */
export const getAssignmentSubmissions = async (
  client: SupabaseClient,
  assignmentId: string,
  instructorId: string,
  params: AssignmentSubmissionsQuery
): Promise<HandlerResult<AssignmentSubmissionsResponse, string, unknown>> => {
  try {
    const { status, isLate, page = 1, limit = 20 } = params;

    // 1. 과제 존재 여부 및 소유권 검증
    const { data: assignmentData, error: assignmentError } = await client
      .from('assignments')
      .select(`
        id,
        courses!inner(instructor_id)
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      return failure(404, assignmentErrorCodes.notFound, '과제를 찾을 수 없습니다.');
    }

    // 강사 권한 검증
    if ((assignmentData.courses as any).instructor_id !== instructorId) {
      return failure(403, assignmentErrorCodes.notCourseOwner, '해당 과제에 대한 권한이 없습니다.');
    }

    // 2. 전체 개수 조회
    let countQuery = client
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('assignment_id', assignmentId);

    if (status) {
      countQuery = countQuery.eq('status', status);
    }
    if (isLate !== undefined) {
      countQuery = countQuery.eq('is_late', isLate);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      return failure(500, assignmentErrorCodes.fetchError, '제출물 개수 조회에 실패했습니다.');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // 3. 제출물 목록 조회
    let submissionsQuery = client
      .from('submissions')
      .select(`
        id,
        assignment_id,
        learner_id,
        content,
        link_url,
        is_late,
        status,
        score,
        feedback,
        submitted_at,
        graded_at,
        graded_by,
        updated_at,
        users!submissions_learner_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('assignment_id', assignmentId);

    if (status) {
      submissionsQuery = submissionsQuery.eq('status', status);
    }
    if (isLate !== undefined) {
      submissionsQuery = submissionsQuery.eq('is_late', isLate);
    }

    submissionsQuery = submissionsQuery
      .order('submitted_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const { data: submissionsData, error: submissionsError } = await submissionsQuery;

    if (submissionsError) {
      return failure(500, assignmentErrorCodes.fetchError, '제출물 목록 조회에 실패했습니다.');
    }

    if (!submissionsData) {
      return success({
        submissions: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        stats: {
          totalSubmissions: 0,
          gradedSubmissions: 0,
          lateSubmissions: 0,
          averageScore: null,
        },
      });
    }

    // 4. 통계 정보 조회
    const { data: allSubmissions } = await client
      .from('submissions')
      .select('status, is_late, score')
      .eq('assignment_id', assignmentId);

    const stats = {
      totalSubmissions: allSubmissions?.length || 0,
      gradedSubmissions: allSubmissions?.filter(s => s.status === 'graded').length || 0,
      lateSubmissions: allSubmissions?.filter(s => s.is_late).length || 0,
      averageScore: allSubmissions && allSubmissions.length > 0 
        ? allSubmissions
            .filter(s => s.score !== null)
            .reduce((sum, s, _, arr) => sum + (s.score || 0) / arr.length, 0) 
        : null,
    };

    // 5. 응답 데이터 구성
    const submissions: SubmissionDetailResponse[] = submissionsData.map(submission => ({
      id: submission.id,
      assignmentId: submission.assignment_id,
      learner: {
        id: (submission.users as any).id,
        fullName: (submission.users as any).full_name,
        email: (submission.users as any).email,
      },
      content: submission.content,
      linkUrl: submission.link_url,
      isLate: submission.is_late,
      status: submission.status as 'submitted' | 'graded' | 'resubmission_required',
      score: submission.score,
      feedback: submission.feedback,
      submittedAt: submission.submitted_at,
      gradedAt: submission.graded_at,
      gradedBy: submission.graded_by,
      updatedAt: submission.updated_at,
    }));

    const response: AssignmentSubmissionsResponse = {
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      stats,
    };

    return success(response);

  } catch (error) {
    return failure(
      500,
      assignmentErrorCodes.databaseError,
      '제출물 목록 조회 중 오류가 발생했습니다.',
      error
    );
  }
};

// ===== 채점 관련 서비스 =====

/**
 * 제출물 채점 서비스
 * 강사가 제출물에 점수와 피드백을 부여하거나 재제출을 요청
 */
export const gradeSubmission = async (
  client: SupabaseClient,
  submissionId: string,
  graderId: string,
  data: GradeSubmissionRequest
): Promise<HandlerResult<GradeSubmissionResponse, string, unknown>> => {
  try {
    // 1. 요청 데이터 검증
    const parsedData = GradeSubmissionRequestSchema.safeParse(data);
    if (!parsedData.success) {
      return failure(400, gradingErrorCodes.validationError, '입력 데이터가 올바르지 않습니다.');
    }

    const { score, feedback, action } = parsedData.data;

    // 2. 제출물 존재 여부 및 정보 조회
    const { data: submissionData, error: submissionError } = await client
      .from('submissions')
      .select(`
        id,
        assignment_id,
        learner_id,
        status,
        assignments!inner(
          id,
          course_id,
          title,
          status,
          courses!inner(
            id,
            instructor_id
          )
        )
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError || !submissionData) {
      return failure(404, gradingErrorCodes.submissionNotFound, '제출물을 찾을 수 없습니다.');
    }

    // 3. 권한 검증 (강사 소유 코스인지 확인)
    const assignment = submissionData.assignments as any;
    const course = assignment.courses as any;
    
    if (course.instructor_id !== graderId) {
      return failure(403, gradingErrorCodes.notInstructorOwned, '해당 코스의 강사만 채점할 수 있습니다.');
    }

    // 4. 제출물 상태 검증
    if (submissionData.status !== 'submitted' && submissionData.status !== 'resubmission_required') {
      return failure(400, gradingErrorCodes.submissionNotSubmitted, '제출된 상태의 제출물만 채점할 수 있습니다.');
    }

    // 5. 자신의 제출물 채점 방지
    if (submissionData.learner_id === graderId) {
      return failure(400, gradingErrorCodes.cannotGradeOwnSubmission, '자신의 제출물은 채점할 수 없습니다.');
    }

    // 6. 과제 상태 검증
    if (assignment.status === 'closed') {
      return failure(400, gradingErrorCodes.assignmentClosed, '마감된 과제는 채점할 수 없습니다.');
    }

    // 7. 액션별 검증
    if (action === 'grade' && (score === undefined || score === null)) {
      return failure(400, gradingErrorCodes.invalidScore, '채점 완료 시 점수를 입력해야 합니다.');
    }

    // 8. 트랜잭션으로 제출물 업데이트 및 로그 생성
    const now = new Date().toISOString();
    const newStatus = action === 'grade' ? 'graded' : 'resubmission_required';
    const finalScore = action === 'grade' ? score : null;

    // 제출물 업데이트
    const { data: updatedSubmission, error: updateError } = await client
      .from('submissions')
      .update({
        status: newStatus,
        score: finalScore,
        feedback,
        graded_at: now,
        graded_by: graderId,
        updated_at: now,
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError || !updatedSubmission) {
      return failure(500, gradingErrorCodes.gradingFailed, '채점 저장 중 오류가 발생했습니다.');
    }

    // 채점 이력 로그 생성
    const { error: logError } = await client
      .from('grade_logs')
      .insert({
        submission_id: submissionId,
        grader_id: graderId,
        action,
        score: finalScore,
        feedback,
        created_at: now,
      });

    if (logError) {
      // 로그 생성 실패는 경고로 처리하고 채점은 성공으로 간주
      console.warn('채점 이력 로그 생성 실패:', logError);
    }

    // 9. 응답 데이터 구성
    const response: GradeSubmissionResponse = {
      id: updatedSubmission.id,
      assignmentId: updatedSubmission.assignment_id,
      learnerId: updatedSubmission.learner_id,
      status: updatedSubmission.status as 'graded' | 'resubmission_required',
      score: updatedSubmission.score,
      feedback: updatedSubmission.feedback!,
      gradedAt: updatedSubmission.graded_at!,
      gradedBy: updatedSubmission.graded_by!,
    };

    return success(response);

  } catch (error) {
    return failure(
      500,
      gradingErrorCodes.databaseError,
      '채점 처리 중 오류가 발생했습니다.',
      error
    );
  }
};

/**
 * 강사용 제출물 목록 조회 서비스 (채점용)
 * 과제별 제출물 목록을 채점에 필요한 정보와 함께 조회
 */
export const getSubmissionsForGrading = async (
  client: SupabaseClient,
  assignmentId: string,
  instructorId: string,
  params: {
    status?: 'submitted' | 'graded' | 'resubmission_required';
    isLate?: boolean;
    page?: number;
    limit?: number;
  } = {}
): Promise<HandlerResult<SubmissionsForGradingResponse, string, unknown>> => {
  try {
    const { status, isLate, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    // 1. 과제 존재 여부 및 권한 검증
    const { data: assignmentData, error: assignmentError } = await client
      .from('assignments')
      .select(`
        id,
        title,
        course_id,
        courses!inner(
          id,
          instructor_id
        )
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      return failure(404, gradingErrorCodes.assignmentNotFound, '과제를 찾을 수 없습니다.');
    }

    const course = assignmentData.courses as any;
    if (course.instructor_id !== instructorId) {
      return failure(403, gradingErrorCodes.notInstructorOwned, '해당 과제의 강사만 접근할 수 있습니다.');
    }

    // 2. 필터 조건 구성
    let query = client
      .from('submissions')
      .select(`
        id,
        assignment_id,
        content,
        link_url,
        is_late,
        status,
        score,
        feedback,
        submitted_at,
        graded_at,
        users!submissions_learner_id_fkey(
          id,
          full_name,
          email
        )
      `, { count: 'exact' })
      .eq('assignment_id', assignmentId);

    if (status) {
      query = query.eq('status', status);
    }

    if (isLate !== undefined) {
      query = query.eq('is_late', isLate);
    }

    // 3. 페이지네이션 적용
    const { data: submissionsData, error: submissionsError, count } = await query
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (submissionsError) {
      return failure(500, gradingErrorCodes.databaseError, '제출물 목록 조회 중 오류가 발생했습니다.');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // 4. 통계 정보 계산
    const { data: statsData, error: statsError } = await client
      .from('submissions')
      .select('status')
      .eq('assignment_id', assignmentId);

    if (statsError) {
      return failure(500, gradingErrorCodes.databaseError, '통계 정보 조회 중 오류가 발생했습니다.');
    }

    const stats = {
      total: statsData?.length || 0,
      pending: statsData?.filter(s => s.status === 'submitted').length || 0,
      graded: statsData?.filter(s => s.status === 'graded').length || 0,
      resubmissionRequired: statsData?.filter(s => s.status === 'resubmission_required').length || 0,
    };

    // 5. 응답 데이터 구성
    const submissions: SubmissionForGrading[] = (submissionsData || []).map(submission => ({
      id: submission.id,
      assignmentId: submission.assignment_id,
      assignmentTitle: assignmentData.title,
      learnerName: (submission.users as any).full_name,
      learnerEmail: (submission.users as any).email,
      content: submission.content,
      linkUrl: submission.link_url,
      isLate: submission.is_late,
      status: submission.status as 'submitted' | 'graded' | 'resubmission_required',
      score: submission.score,
      feedback: submission.feedback,
      submittedAt: submission.submitted_at,
      gradedAt: submission.graded_at,
    }));

    const response: SubmissionsForGradingResponse = {
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      stats,
    };

    return success(response);

  } catch (error) {
    return failure(
      500,
      gradingErrorCodes.databaseError,
      '제출물 목록 조회 중 오류가 발생했습니다.',
      error
    );
  }
};

/**
 * 채점용 제출물 상세 조회 서비스
 * 특정 제출물의 상세 정보를 채점에 필요한 모든 정보와 함께 조회
 */
export const getSubmissionDetailForGrading = async (
  client: SupabaseClient,
  submissionId: string,
  instructorId: string
): Promise<HandlerResult<SubmissionForGrading, string, unknown>> => {
  try {
    // 1. 제출물 존재 여부 및 정보 조회
    const { data: submissionData, error: submissionError } = await client
      .from('submissions')
      .select(`
        id,
        assignment_id,
        content,
        link_url,
        is_late,
        status,
        score,
        feedback,
        submitted_at,
        graded_at,
        users!submissions_learner_id_fkey(
          id,
          full_name,
          email
        ),
        assignments!inner(
          id,
          title,
          course_id,
          courses!inner(
            id,
            instructor_id
          )
        )
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError || !submissionData) {
      return failure(404, gradingErrorCodes.submissionNotFound, '제출물을 찾을 수 없습니다.');
    }

    // 2. 권한 검증
    const assignment = submissionData.assignments as any;
    const course = assignment.courses as any;
    
    if (course.instructor_id !== instructorId) {
      return failure(403, gradingErrorCodes.notInstructorOwned, '해당 제출물에 접근할 권한이 없습니다.');
    }

    // 3. 응답 데이터 구성
    const response: SubmissionForGrading = {
      id: submissionData.id,
      assignmentId: submissionData.assignment_id,
      assignmentTitle: assignment.title,
      learnerName: (submissionData.users as any).full_name,
      learnerEmail: (submissionData.users as any).email,
      content: submissionData.content,
      linkUrl: submissionData.link_url,
      isLate: submissionData.is_late,
      status: submissionData.status as 'submitted' | 'graded' | 'resubmission_required',
      score: submissionData.score,
      feedback: submissionData.feedback,
      submittedAt: submissionData.submitted_at,
      gradedAt: submissionData.graded_at,
    };

    return success(response);

  } catch (error) {
    return failure(
      500,
      gradingErrorCodes.databaseError,
      '제출물 상세 조회 중 오류가 발생했습니다.',
      error
    );
  }
};

// ===== 학습자용 서비스 함수들 =====

/**
 * 학습자용 과제 목록 조회 서비스
 * 수강 중인 모든 코스의 과제를 조회하고 제출 상태 포함
 */
export const getLearnerAssignments = async (
  client: SupabaseClient,
  authUserId: string,
  params: LearnerAssignmentsQuery
): Promise<HandlerResult<LearnerAssignmentsResponse, string, unknown>> => {
  try {
    const { status = 'all', courseId, page = 1, limit = 20 } = params;

    // 1. Auth ID를 내부 사용자 ID로 변환
    const { data: userData, error: userError } = await client
      .from('users')
      .select('id, role')
      .eq('auth_user_id', authUserId)
      .single();

    if (userError || !userData) {
      return failure(401, assignmentErrorCodes.unauthorized, '사용자를 찾을 수 없습니다.');
    }

    if (userData.role !== 'learner') {
      return failure(403, assignmentErrorCodes.unauthorized, 'Learner 권한이 필요합니다.');
    }

    // 2. 수강 중인 코스 ID 목록 조회
    let enrollmentQuery = client
      .from('enrollments')
      .select('course_id')
      .eq('learner_id', userData.id)
      .eq('is_active', true);

    if (courseId) {
      enrollmentQuery = enrollmentQuery.eq('course_id', courseId);
    }

    const { data: enrollments, error: enrollmentError } = await enrollmentQuery;

    if (enrollmentError) {
      return failure(500, assignmentErrorCodes.fetchError, '수강 정보 조회에 실패했습니다.');
    }

    if (!enrollments || enrollments.length === 0) {
      return success({
        assignments: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        stats: { total: 0, upcoming: 0, submitted: 0, graded: 0, overdue: 0 },
      });
    }

    const courseIds = enrollments.map(e => e.course_id);

    // 3. 과제 목록 조회 (published만)
    let assignmentsQuery = client
      .from('assignments')
      .select(`
        id,
        course_id,
        title,
        description,
        due_date,
        score_weight,
        allow_late_submission,
        allow_resubmission,
        status,
        created_at,
        courses!inner(
          id,
          title
        )
      `)
      .eq('status', 'published')
      .in('course_id', courseIds);

    // 상태별 필터링
    const now = new Date();
    if (status === 'upcoming') {
      assignmentsQuery = assignmentsQuery.gte('due_date', now.toISOString());
    } else if (status === 'overdue') {
      assignmentsQuery = assignmentsQuery.lt('due_date', now.toISOString());
    }

    const { data: assignmentsData, error: assignmentsError } = await assignmentsQuery
      .order('due_date', { ascending: true });

    if (assignmentsError) {
      return failure(500, assignmentErrorCodes.fetchError, '과제 목록 조회에 실패했습니다.');
    }

    if (!assignmentsData || assignmentsData.length === 0) {
      return success({
        assignments: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        stats: { total: 0, upcoming: 0, submitted: 0, graded: 0, overdue: 0 },
      });
    }

    // 4. 제출물 정보 조회
    const assignmentIds = assignmentsData.map(a => a.id);
    const { data: submissions } = await client
      .from('submissions')
      .select('assignment_id, status, score, feedback, submitted_at, graded_at, is_late')
      .eq('learner_id', userData.id)
      .in('assignment_id', assignmentIds);

    const submissionMap = new Map(
      submissions?.map(s => [s.assignment_id, s]) || []
    );

    // 5. 응답 데이터 구성
    let filteredAssignments = assignmentsData.map(assignment => {
      const course = assignment.courses as any;
      const submission = submissionMap.get(assignment.id);
      const dueDate = new Date(assignment.due_date);
      const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: assignment.id,
        courseId: assignment.course_id,
        courseTitle: course.title,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        scoreWeight: assignment.score_weight,
        allowLateSubmission: assignment.allow_late_submission,
        allowResubmission: assignment.allow_resubmission,
        status: assignment.status as 'draft' | 'published' | 'closed',
        isSubmitted: !!submission,
        submissionStatus: submission?.status || 'not_submitted',
        score: submission?.score || null,
        feedback: submission?.feedback || null,
        submittedAt: submission?.submitted_at || null,
        gradedAt: submission?.graded_at || null,
        isLate: submission?.is_late || null,
        daysLeft,
        createdAt: assignment.created_at,
      } as LearnerAssignmentResponse;
    });

    // 6. 상태별 추가 필터링
    if (status === 'submitted') {
      filteredAssignments = filteredAssignments.filter(a => a.isSubmitted && a.submissionStatus === 'submitted');
    } else if (status === 'graded') {
      filteredAssignments = filteredAssignments.filter(a => a.submissionStatus === 'graded');
    }

    // 7. 통계 계산
    const stats = {
      total: filteredAssignments.length,
      upcoming: filteredAssignments.filter(a => a.daysLeft >= 0 && !a.isSubmitted).length,
      submitted: filteredAssignments.filter(a => a.submissionStatus === 'submitted').length,
      graded: filteredAssignments.filter(a => a.submissionStatus === 'graded').length,
      overdue: filteredAssignments.filter(a => a.daysLeft < 0 && !a.isSubmitted).length,
    };

    // 8. 페이지네이션 적용
    const total = filteredAssignments.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAssignments = filteredAssignments.slice(startIndex, endIndex);

    return success({
      assignments: paginatedAssignments,
      pagination: { page, limit, total, totalPages },
      stats,
    });

  } catch (error) {
    return failure(
      500,
      assignmentErrorCodes.databaseError,
      '과제 목록 조회 중 오류가 발생했습니다.',
      error
    );
  }
};
