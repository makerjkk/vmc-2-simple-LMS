import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
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
} from './schema';
import {
  assignmentErrorCodes,
  type AssignmentServiceError,
  submissionErrorCodes,
  type SubmissionServiceError,
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
