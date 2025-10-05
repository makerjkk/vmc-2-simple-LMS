import { z } from 'zod';

/**
 * Instructor 코스 스키마
 */
export const InstructorCourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.enum(['draft', 'published', 'archived']),
  enrollmentCount: z.number(),
  averageRating: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * 채점 대기 제출물 스키마
 */
export const PendingSubmissionSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  assignmentTitle: z.string(),
  courseTitle: z.string(),
  learnerName: z.string(),
  submittedAt: z.string(),
  isLate: z.boolean(),
  daysOverdue: z.number().nullable(),
});

/**
 * 최근 제출물 스키마
 */
export const RecentSubmissionSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  assignmentTitle: z.string(),
  courseTitle: z.string(),
  learnerName: z.string(),
  submittedAt: z.string(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  isLate: z.boolean(),
});

/**
 * 대시보드 통계 스키마
 */
export const InstructorStatsSchema = z.object({
  totalCourses: z.number(),
  totalStudents: z.number(),
  pendingGrades: z.number(),
  averageRating: z.number(),
});

/**
 * Instructor 대시보드 응답 스키마
 */
export const InstructorDashboardResponseSchema = z.object({
  stats: InstructorStatsSchema,
  courses: z.array(InstructorCourseSchema),
  pendingSubmissions: z.array(PendingSubmissionSchema),
  recentSubmissions: z.array(RecentSubmissionSchema),
});

// 타입 추출
export type InstructorCourse = z.infer<typeof InstructorCourseSchema>;
export type PendingSubmission = z.infer<typeof PendingSubmissionSchema>;
export type RecentSubmission = z.infer<typeof RecentSubmissionSchema>;
export type InstructorStats = z.infer<typeof InstructorStatsSchema>;
export type InstructorDashboardResponse = z.infer<typeof InstructorDashboardResponseSchema>;
