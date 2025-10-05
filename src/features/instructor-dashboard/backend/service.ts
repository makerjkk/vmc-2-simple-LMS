import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  type InstructorDashboardResponse,
  type InstructorCourse,
  type PendingSubmission,
  type RecentSubmission,
  type InstructorStats,
} from './schema';
import {
  instructorDashboardErrorCodes,
  type InstructorDashboardServiceError,
} from './error';

/**
 * Instructor 대시보드 데이터 조회 서비스
 */
export const getInstructorDashboardData = async (
  client: SupabaseClient,
  instructorId: string
): Promise<HandlerResult<InstructorDashboardResponse, string, unknown>> => {
  try {
    // 1. 사용자 역할 확인 (Instructor만 허용)
    const { data: user, error: userError } = await client
      .from('users')
      .select('id, role')
      .eq('id', instructorId)
      .single();

    if (userError || !user) {
      return failure(404, instructorDashboardErrorCodes.userNotFound, '사용자를 찾을 수 없습니다.');
    }

    if (user.role !== 'instructor') {
      return failure(403, instructorDashboardErrorCodes.invalidRole, 'Instructor 권한이 필요합니다.');
    }

    // 2. 강사의 코스 목록과 통계 조회
    const coursesResult = await getInstructorCoursesWithStats(client, instructorId);
    if (!coursesResult.ok) {
      return failure(500, instructorDashboardErrorCodes.fetchError, '코스 정보 조회에 실패했습니다.');
    }

    // 3. 채점 대기 제출물 조회
    const pendingSubmissionsResult = await getPendingGradingSubmissions(client, instructorId);
    if (!pendingSubmissionsResult.ok) {
      return failure(500, instructorDashboardErrorCodes.fetchError, '채점 대기 제출물 조회에 실패했습니다.');
    }

    // 4. 최근 제출물 조회 (7일 이내, 최대 10개)
    const recentSubmissionsResult = await getRecentSubmissions(client, instructorId);
    if (!recentSubmissionsResult.ok) {
      return failure(500, instructorDashboardErrorCodes.fetchError, '최근 제출물 조회에 실패했습니다.');
    }

    // 5. 통계 계산
    const stats = calculateInstructorStats(
      coursesResult.data,
      pendingSubmissionsResult.data
    );

    const dashboardData: InstructorDashboardResponse = {
      stats,
      courses: coursesResult.data,
      pendingSubmissions: pendingSubmissionsResult.data,
      recentSubmissions: recentSubmissionsResult.data,
    };

    return success(dashboardData);

  } catch (error) {
    return failure(500, instructorDashboardErrorCodes.databaseError, 'Instructor 대시보드 데이터 조회 중 오류가 발생했습니다.', error);
  }
};

/**
 * 강사의 코스 목록과 통계 조회
 */
const getInstructorCoursesWithStats = async (
  client: SupabaseClient,
  instructorId: string
): Promise<HandlerResult<InstructorCourse[], string, unknown>> => {
  try {
    const { data: courses, error } = await client
      .from('courses')
      .select(`
        id,
        title,
        status,
        enrollment_count,
        average_rating,
        created_at,
        updated_at
      `)
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false });

    if (error) {
      return failure(500, instructorDashboardErrorCodes.databaseError, '코스 조회 중 오류가 발생했습니다.', error);
    }

    const instructorCourses: InstructorCourse[] = (courses || []).map(course => ({
      id: course.id,
      title: course.title,
      status: course.status as 'draft' | 'published' | 'archived',
      enrollmentCount: course.enrollment_count,
      averageRating: course.average_rating,
      createdAt: course.created_at,
      updatedAt: course.updated_at,
    }));

    return success(instructorCourses);

  } catch (error) {
    return failure(500, instructorDashboardErrorCodes.databaseError, '코스 조회 중 오류가 발생했습니다.', error);
  }
};

/**
 * 채점 대기 제출물 조회
 */
const getPendingGradingSubmissions = async (
  client: SupabaseClient,
  instructorId: string
): Promise<HandlerResult<PendingSubmission[], string, unknown>> => {
  try {
    const { data: submissions, error } = await client
      .from('submissions')
      .select(`
        id,
        submitted_at,
        is_late,
        assignments!inner(
          id,
          title,
          due_date,
          courses!inner(
            id,
            title,
            instructor_id
          )
        ),
        users!inner(
          id,
          full_name
        )
      `)
      .eq('status', 'submitted')
      .eq('assignments.courses.instructor_id', instructorId)
      .order('submitted_at', { ascending: true })
      .limit(50); // 최대 50개로 제한

    if (error) {
      return failure(500, instructorDashboardErrorCodes.databaseError, '채점 대기 제출물 조회 중 오류가 발생했습니다.', error);
    }

    const pendingSubmissions: PendingSubmission[] = (submissions || []).map(submission => {
      const assignment = submission.assignments as any;
      const course = assignment.courses as any;
      const user = submission.users as any;
      
      // 마감일 지남 계산
      const dueDate = new Date(assignment.due_date);
      const submittedDate = new Date(submission.submitted_at);
      const now = new Date();
      
      let daysOverdue: number | null = null;
      if (submittedDate > dueDate) {
        daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        id: submission.id,
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        courseTitle: course.title,
        learnerName: user.full_name,
        submittedAt: submission.submitted_at,
        isLate: submission.is_late,
        daysOverdue,
      };
    });

    return success(pendingSubmissions);

  } catch (error) {
    return failure(500, instructorDashboardErrorCodes.databaseError, '채점 대기 제출물 조회 중 오류가 발생했습니다.', error);
  }
};

/**
 * 최근 제출물 조회 (7일 이내)
 */
const getRecentSubmissions = async (
  client: SupabaseClient,
  instructorId: string
): Promise<HandlerResult<RecentSubmission[], string, unknown>> => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: submissions, error } = await client
      .from('submissions')
      .select(`
        id,
        submitted_at,
        status,
        is_late,
        assignments!inner(
          id,
          title,
          courses!inner(
            id,
            title,
            instructor_id
          )
        ),
        users!inner(
          id,
          full_name
        )
      `)
      .eq('assignments.courses.instructor_id', instructorId)
      .gte('submitted_at', sevenDaysAgo.toISOString())
      .order('submitted_at', { ascending: false })
      .limit(10); // 최대 10개

    if (error) {
      return failure(500, instructorDashboardErrorCodes.databaseError, '최근 제출물 조회 중 오류가 발생했습니다.', error);
    }

    const recentSubmissions: RecentSubmission[] = (submissions || []).map(submission => {
      const assignment = submission.assignments as any;
      const course = assignment.courses as any;
      const user = submission.users as any;

      return {
        id: submission.id,
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        courseTitle: course.title,
        learnerName: user.full_name,
        submittedAt: submission.submitted_at,
        status: submission.status as 'submitted' | 'graded' | 'resubmission_required',
        isLate: submission.is_late,
      };
    });

    return success(recentSubmissions);

  } catch (error) {
    return failure(500, instructorDashboardErrorCodes.databaseError, '최근 제출물 조회 중 오류가 발생했습니다.', error);
  }
};

/**
 * Instructor 통계 계산
 */
const calculateInstructorStats = (
  courses: InstructorCourse[],
  pendingSubmissions: PendingSubmission[]
): InstructorStats => {
  // 총 코스 수
  const totalCourses = courses.length;

  // 총 수강생 수 (모든 코스의 수강생 수 합계)
  const totalStudents = courses.reduce((sum, course) => sum + course.enrollmentCount, 0);

  // 채점 대기 수
  const pendingGrades = pendingSubmissions.length;

  // 평균 평점 계산 (평점이 있는 코스들만)
  const coursesWithRating = courses.filter(course => course.averageRating !== null);
  const averageRating = coursesWithRating.length > 0
    ? coursesWithRating.reduce((sum, course) => sum + (course.averageRating || 0), 0) / coursesWithRating.length
    : 0;

  return {
    totalCourses,
    totalStudents,
    pendingGrades,
    averageRating: Math.round(averageRating * 100) / 100, // 소수점 2자리
  };
};
