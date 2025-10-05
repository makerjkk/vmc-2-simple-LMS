import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import { calculateProgress } from '@/lib/utils/progress';
import { getDaysUntilDue } from '@/lib/utils/date';
import {
  type DashboardResponse,
  type CourseProgress,
  type UpcomingAssignment,
  type RecentFeedback,
} from './schema';
import {
  dashboardErrorCodes,
  type DashboardServiceError,
} from './error';

/**
 * 대시보드 데이터 조회 서비스
 */
export const getDashboardData = async (
  client: SupabaseClient,
  userId: string
): Promise<HandlerResult<DashboardResponse, string, unknown>> => {
  try {
    // 1. 사용자 역할 확인 (Learner만 허용)
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, role')
      .eq('auth_user_id', userId)
      .single();

    if (userError || !user) {
      return failure(404, dashboardErrorCodes.userNotFound, '사용자를 찾을 수 없습니다.');
    }

    if (user.role !== 'learner') {
      return failure(403, dashboardErrorCodes.invalidRole, 'Learner 권한이 필요합니다.');
    }

    // 2. 수강 중인 코스 목록과 진행률 조회 (내부 사용자 ID 사용)
    const coursesResult = await getEnrolledCoursesWithProgress(client, user.id);
    if (!coursesResult.ok) {
      return failure(500, dashboardErrorCodes.fetchError, '코스 정보 조회에 실패했습니다.');
    }

    // 3. 마감 임박 과제 조회 (30일 이내)
    const upcomingAssignmentsResult = await getUpcomingAssignments(client, user.id);
    if (!upcomingAssignmentsResult.ok) {
      return failure(500, dashboardErrorCodes.fetchError, '마감 임박 과제 조회에 실패했습니다.');
    }

    // 4. 최근 피드백 조회 (7일 이내, 최대 5개)
    const recentFeedbackResult = await getRecentFeedback(client, user.id);
    if (!recentFeedbackResult.ok) {
      return failure(500, dashboardErrorCodes.fetchError, '최근 피드백 조회에 실패했습니다.');
    }

    const dashboardData: DashboardResponse = {
      courses: coursesResult.data,
      upcomingAssignments: upcomingAssignmentsResult.data,
      recentFeedback: recentFeedbackResult.data,
    };

    return success(dashboardData);

  } catch (error) {
    return failure(500, dashboardErrorCodes.databaseError, '대시보드 데이터 조회 중 오류가 발생했습니다.', error);
  }
};

/**
 * 수강 중인 코스 목록과 진행률 조회
 */
const getEnrolledCoursesWithProgress = async (
  client: SupabaseClient,
  userId: string
): Promise<HandlerResult<CourseProgress[], string, unknown>> => {
  try {
    // 수강 중인 코스 목록 조회
    const { data: enrollments, error: enrollmentError } = await client
      .from('enrollments')
      .select(`
        course_id,
        courses!inner(
          id,
          title,
          description,
          status
        )
      `)
      .eq('learner_id', userId)
      .eq('is_active', true)
      .eq('courses.status', 'published');

    if (enrollmentError) {
      return failure(500, dashboardErrorCodes.fetchError, '수강 중인 코스 조회에 실패했습니다.', enrollmentError);
    }

    if (!enrollments || enrollments.length === 0) {
      return success([]);
    }

    // 각 코스별 과제 정보와 제출 상태 조회
    const coursesWithProgress: CourseProgress[] = [];

    for (const enrollment of enrollments) {
      const course = enrollment.courses as any;
      if (!course) continue;

      // 해당 코스의 published 과제 수 조회
      const { data: assignments, error: assignmentError } = await client
        .from('assignments')
        .select('id, title, status, due_date')
        .eq('course_id', course.id)
        .eq('status', 'published');

      if (assignmentError) {
        return failure(500, dashboardErrorCodes.fetchError, '과제 정보 조회에 실패했습니다.', assignmentError);
      }

      const totalAssignments = assignments?.length || 0;

      // 해당 코스에서 완료한 과제 수 조회 (graded 상태)
      const { data: submissions, error: submissionError } = await client
        .from('submissions')
        .select('id')
        .eq('learner_id', userId)
        .eq('status', 'graded')
        .in('assignment_id', assignments?.map(a => a.id) || []);

      if (submissionError) {
        return failure(500, dashboardErrorCodes.fetchError, '제출물 정보 조회에 실패했습니다.', submissionError);
      }

      const completedAssignments = submissions?.length || 0;
      const progress = calculateProgress(completedAssignments, totalAssignments);

      coursesWithProgress.push({
        id: course.id,
        title: course.title,
        description: course.description,
        progress,
        totalAssignments,
        completedAssignments,
        status: 'published' as const,
      });
    }

    return success(coursesWithProgress);

  } catch (error) {
    return failure(500, dashboardErrorCodes.fetchError, '코스 진행률 조회 중 오류가 발생했습니다.', error);
  }
};

/**
 * 마감 임박 과제 조회 (30일 이내 미제출 과제)
 */
const getUpcomingAssignments = async (
  client: SupabaseClient,
  userId: string
): Promise<HandlerResult<UpcomingAssignment[], string, unknown>> => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // 먼저 수강 중인 코스 ID 목록 조회
    const { data: enrollments, error: enrollmentError } = await client
      .from('enrollments')
      .select('course_id')
      .eq('learner_id', userId)
      .eq('is_active', true);

    if (enrollmentError) {
      return failure(500, dashboardErrorCodes.fetchError, '수강 정보 조회에 실패했습니다.', enrollmentError);
    }

    if (!enrollments || enrollments.length === 0) {
      return success([]);
    }

    const courseIds = enrollments.map(e => e.course_id);

    // 수강 중인 코스의 마감 임박 과제 조회
    const { data: assignments, error: assignmentError } = await client
      .from('assignments')
      .select(`
        id,
        title,
        due_date,
        course_id,
        status,
        courses!inner(
          id,
          title
        )
      `)
      .eq('status', 'published')
      .gte('due_date', new Date().toISOString())
      .lte('due_date', thirtyDaysFromNow.toISOString())
      .in('course_id', courseIds);

    if (assignmentError) {
      return failure(500, dashboardErrorCodes.fetchError, '마감 임박 과제 조회에 실패했습니다.', assignmentError);
    }

    if (!assignments || assignments.length === 0) {
      return success([]);
    }

    // 이미 제출한 과제 제외
    const { data: submissions, error: submissionError } = await client
      .from('submissions')
      .select('assignment_id')
      .eq('learner_id', userId)
      .in('assignment_id', assignments.map(a => a.id));

    if (submissionError) {
      return failure(500, dashboardErrorCodes.fetchError, '제출물 정보 조회에 실패했습니다.', submissionError);
    }

    const submittedAssignmentIds = new Set(submissions?.map(s => s.assignment_id) || []);

    const upcomingAssignments: UpcomingAssignment[] = assignments
      .filter(assignment => !submittedAssignmentIds.has(assignment.id))
      .map(assignment => {
        const assignmentData = assignment as any;
        // due_date를 ISO 8601 형식으로 변환
        const dueDate = new Date(assignmentData.due_date).toISOString();
        return {
          id: assignmentData.id,
          title: assignmentData.title,
          courseTitle: assignmentData.courses?.title || '',
          courseId: assignmentData.course_id,
          dueDate,
          daysLeft: getDaysUntilDue(assignmentData.due_date),
        };
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return success(upcomingAssignments);

  } catch (error) {
    return failure(500, dashboardErrorCodes.fetchError, '마감 임박 과제 조회 중 오류가 발생했습니다.', error);
  }
};

/**
 * 최근 피드백 조회 (7일 이내, 최대 5개)
 */
const getRecentFeedback = async (
  client: SupabaseClient,
  userId: string
): Promise<HandlerResult<RecentFeedback[], string, unknown>> => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 최근 7일 이내 받은 피드백 조회
    const { data: submissions, error: submissionError } = await client
      .from('submissions')
      .select(`
        id,
        score,
        feedback,
        graded_at,
        assignments!inner(
          id,
          title,
          courses!inner(
            title
          )
        )
      `)
      .eq('learner_id', userId)
      .eq('status', 'graded')
      .not('feedback', 'is', null)
      .gte('graded_at', sevenDaysAgo.toISOString())
      .order('graded_at', { ascending: false })
      .limit(5);

    if (submissionError) {
      return failure(500, dashboardErrorCodes.fetchError, '최근 피드백 조회에 실패했습니다.', submissionError);
    }

    if (!submissions || submissions.length === 0) {
      return success([]);
    }

    const recentFeedback: RecentFeedback[] = submissions.map(submission => {
      const submissionData = submission as any;
      // graded_at을 ISO 8601 형식으로 변환
      const feedbackDate = submissionData.graded_at ? new Date(submissionData.graded_at).toISOString() : new Date().toISOString();
      return {
        id: submissionData.id,
        assignmentTitle: submissionData.assignments?.title || '',
        assignmentId: submissionData.assignments?.id || '',
        courseTitle: submissionData.assignments?.courses?.title || '',
        score: submissionData.score || 0,
        feedback: submissionData.feedback || '',
        feedbackDate,
      };
    });

    return success(recentFeedback);

  } catch (error) {
    return failure(500, dashboardErrorCodes.fetchError, '최근 피드백 조회 중 오류가 발생했습니다.', error);
  }
};
