import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import {
  operatorDashboardErrorCodes,
  type OperatorDashboardServiceError,
} from './error';
import type {
  OperatorStatsResponse,
  RecentReportsResponse,
  PendingActionsResponse,
} from './schema';

/**
 * 운영자 대시보드 통계 조회
 */
export const getOperatorStats = async (
  supabase: SupabaseClient
): Promise<HandlerResult<OperatorStatsResponse, OperatorDashboardServiceError>> => {
  try {
    // 병렬로 모든 통계 데이터 조회
    const [
      reportsStats,
      usersStats,
      contentStats,
      activityStats,
    ] = await Promise.all([
      getReportsStats(supabase),
      getUsersStats(supabase),
      getContentStats(supabase),
      getActivityStats(supabase),
    ]);

    return success({
      reports: reportsStats,
      users: usersStats,
      content: contentStats,
      activity: activityStats,
    });

  } catch (error) {
    return failure(500, operatorDashboardErrorCodes.databaseError, '통계 데이터 조회 중 오류가 발생했습니다.', error);
  }
};

/**
 * 신고 관련 통계 조회
 */
const getReportsStats = async (supabase: SupabaseClient) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 전체 신고 수
  const { count: totalReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true });

  // 처리 대기 신고 수 (received + investigating)
  const { count: pendingReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .in('status', ['received', 'investigating']);

  // 해결된 신고 수
  const { count: resolvedReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'resolved');

  // 오늘 접수된 신고 수
  const { count: todayReceived } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  return {
    total: totalReports || 0,
    pending: pendingReports || 0,
    resolved: resolvedReports || 0,
    todayReceived: todayReceived || 0,
  };
};

/**
 * 사용자 관련 통계 조회
 */
const getUsersStats = async (supabase: SupabaseClient) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // 전체 사용자 수
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // 역할별 사용자 수
  const { count: learners } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'learner');

  const { count: instructors } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'instructor');

  const { count: operators } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'operator');

  // 이번 주 신규 가입자 수
  const { count: newThisWeek } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneWeekAgo.toISOString());

  return {
    total: totalUsers || 0,
    learners: learners || 0,
    instructors: instructors || 0,
    operators: operators || 0,
    newThisWeek: newThisWeek || 0,
  };
};

/**
 * 콘텐츠 관련 통계 조회
 */
const getContentStats = async (supabase: SupabaseClient) => {
  // 전체 코스 수
  const { count: totalCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true });

  // 게시된 코스 수
  const { count: publishedCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  // 전체 과제 수
  const { count: totalAssignments } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true });

  // 전체 제출물 수
  const { count: totalSubmissions } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true });

  return {
    totalCourses: totalCourses || 0,
    publishedCourses: publishedCourses || 0,
    totalAssignments: totalAssignments || 0,
    totalSubmissions: totalSubmissions || 0,
  };
};

/**
 * 시스템 활동 통계 조회
 */
const getActivityStats = async (supabase: SupabaseClient) => {
  const today = new Date();
  const oneWeekAgo = new Date();
  const oneMonthAgo = new Date();
  
  oneWeekAgo.setDate(today.getDate() - 7);
  oneMonthAgo.setDate(today.getDate() - 30);

  // 일일 활성 사용자 (오늘 제출물이 있는 사용자)
  const { data: dailySubmissions } = await supabase
    .from('submissions')
    .select('learner_id')
    .gte('submitted_at', today.toISOString());

  // 주간 활성 사용자
  const { data: weeklySubmissions } = await supabase
    .from('submissions')
    .select('learner_id')
    .gte('submitted_at', oneWeekAgo.toISOString());

  // 월간 활성 사용자
  const { data: monthlySubmissions } = await supabase
    .from('submissions')
    .select('learner_id')
    .gte('submitted_at', oneMonthAgo.toISOString());

  // 중복 제거하여 고유 사용자 수 계산
  const uniqueDailyUsers = new Set(dailySubmissions?.map(s => s.learner_id) || []);
  const uniqueWeeklyUsers = new Set(weeklySubmissions?.map(s => s.learner_id) || []);
  const uniqueMonthlyUsers = new Set(monthlySubmissions?.map(s => s.learner_id) || []);

  return {
    dailyActiveUsers: uniqueDailyUsers.size,
    weeklyActiveUsers: uniqueWeeklyUsers.size,
    monthlyActiveUsers: uniqueMonthlyUsers.size,
  };
};

/**
 * 최근 신고 목록 조회
 */
export const getRecentReports = async (
  supabase: SupabaseClient,
  limit: number = 10
): Promise<HandlerResult<RecentReportsResponse, OperatorDashboardServiceError>> => {
  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        id,
        reported_type,
        reason,
        status,
        created_at,
        reporter:users!reports_reporter_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return failure(500, operatorDashboardErrorCodes.fetchError, '최근 신고 목록 조회 중 오류가 발생했습니다.', error);
    }

    return success({
      reports: reports?.map(report => ({
        id: report.id,
        reporterName: (report.reporter as any)?.full_name || '알 수 없음',
        reportedType: report.reported_type,
        reason: report.reason,
        status: report.status,
        createdAt: report.created_at,
      })) || [],
    });

  } catch (error) {
    return failure(500, operatorDashboardErrorCodes.databaseError, '데이터베이스 오류가 발생했습니다.', error);
  }
};

/**
 * 처리 대기 액션 조회
 */
export const getPendingActions = async (
  supabase: SupabaseClient
): Promise<HandlerResult<PendingActionsResponse, OperatorDashboardServiceError>> => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // 처리 대기 신고 수
    const { count: pendingReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .in('status', ['received', 'investigating']);

    // 긴급 신고 수 (3일 이상 미처리)
    const { count: urgentReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .in('status', ['received', 'investigating'])
      .lt('created_at', threeDaysAgo.toISOString());

    // 최근 액션 목록
    const { data: recentActions, error: actionsError } = await supabase
      .from('report_actions')
      .select(`
        id,
        report_id,
        action_type,
        performed_at,
        performer:users!report_actions_performed_by_fkey(full_name)
      `)
      .order('performed_at', { ascending: false })
      .limit(5);

    if (actionsError) {
      return failure(500, operatorDashboardErrorCodes.fetchError, '최근 액션 목록 조회 중 오류가 발생했습니다.', actionsError);
    }

    return success({
      pendingReports: pendingReports || 0,
      urgentReports: urgentReports || 0,
      recentActions: recentActions?.map(action => ({
        id: action.id,
        reportId: action.report_id,
        actionType: action.action_type,
        performedByName: (action.performer as any)?.full_name || '알 수 없음',
        performedAt: action.performed_at,
      })) || [],
    });

  } catch (error) {
    return failure(500, operatorDashboardErrorCodes.databaseError, '데이터베이스 오류가 발생했습니다.', error);
  }
};
