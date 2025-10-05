import { z } from 'zod';

/**
 * 코스 진행률 스키마
 */
export const CourseProgressSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  progress: z.number().min(0).max(100),
  totalAssignments: z.number().min(0),
  completedAssignments: z.number().min(0),
  status: z.enum(['published']),
});

/**
 * 마감 임박 과제 스키마
 */
export const UpcomingAssignmentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  courseTitle: z.string().min(1),
  courseId: z.string().uuid(),
  dueDate: z.string().datetime(),
  daysLeft: z.number().min(0),
});

/**
 * 최근 피드백 스키마
 */
export const RecentFeedbackSchema = z.object({
  id: z.string().uuid(),
  assignmentTitle: z.string().min(1),
  assignmentId: z.string().uuid(),
  courseTitle: z.string().min(1),
  score: z.number().min(0).max(100),
  feedback: z.string().min(1),
  feedbackDate: z.string().datetime(),
});

/**
 * 대시보드 응답 스키마
 */
export const DashboardResponseSchema = z.object({
  courses: z.array(CourseProgressSchema),
  upcomingAssignments: z.array(UpcomingAssignmentSchema),
  recentFeedback: z.array(RecentFeedbackSchema),
});

/**
 * 타입 정의
 */
export type CourseProgress = z.infer<typeof CourseProgressSchema>;
export type UpcomingAssignment = z.infer<typeof UpcomingAssignmentSchema>;
export type RecentFeedback = z.infer<typeof RecentFeedbackSchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
