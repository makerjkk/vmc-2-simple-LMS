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
} from './schema';
import {
  assignmentErrorCodes,
  type AssignmentServiceError,
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
