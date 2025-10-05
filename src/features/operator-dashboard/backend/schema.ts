import { z } from 'zod';

/**
 * 운영자 대시보드 통계 응답 스키마
 */
export const OperatorStatsResponseSchema = z.object({
  // 신고 관련 통계
  reports: z.object({
    total: z.number().int().min(0),
    pending: z.number().int().min(0), // received + investigating
    resolved: z.number().int().min(0),
    todayReceived: z.number().int().min(0),
  }),
  
  // 사용자 관련 통계
  users: z.object({
    total: z.number().int().min(0),
    learners: z.number().int().min(0),
    instructors: z.number().int().min(0),
    operators: z.number().int().min(0),
    newThisWeek: z.number().int().min(0),
  }),
  
  // 콘텐츠 관련 통계
  content: z.object({
    totalCourses: z.number().int().min(0),
    publishedCourses: z.number().int().min(0),
    totalAssignments: z.number().int().min(0),
    totalSubmissions: z.number().int().min(0),
  }),
  
  // 시스템 활동 통계
  activity: z.object({
    dailyActiveUsers: z.number().int().min(0),
    weeklyActiveUsers: z.number().int().min(0),
    monthlyActiveUsers: z.number().int().min(0),
  }),
});

export type OperatorStatsResponse = z.infer<typeof OperatorStatsResponseSchema>;

/**
 * 최근 신고 목록 응답 스키마
 */
export const RecentReportsResponseSchema = z.object({
  reports: z.array(z.object({
    id: z.string().uuid(),
    reporterName: z.string(),
    reportedType: z.enum(['course', 'assignment', 'submission', 'user']),
    reason: z.string(),
    status: z.enum(['received', 'investigating', 'resolved']),
    createdAt: z.string().datetime(),
  })),
});

export type RecentReportsResponse = z.infer<typeof RecentReportsResponseSchema>;

/**
 * 처리 대기 액션 응답 스키마
 */
export const PendingActionsResponseSchema = z.object({
  pendingReports: z.number().int().min(0),
  urgentReports: z.number().int().min(0), // 3일 이상 미처리
  recentActions: z.array(z.object({
    id: z.string().uuid(),
    reportId: z.string().uuid(),
    actionType: z.enum(['warn', 'invalidate_submission', 'restrict_account', 'dismiss']),
    performedByName: z.string(),
    performedAt: z.string().datetime(),
  })),
});

export type PendingActionsResponse = z.infer<typeof PendingActionsResponseSchema>;
