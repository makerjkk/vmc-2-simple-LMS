import { z } from 'zod';

// 성적 조회 파라미터 스키마
export const GradeParamsSchema = z.object({
  courseId: z.string().uuid().optional(),
});

export type GradeParams = z.infer<typeof GradeParamsSchema>;

// 과제별 성적 스키마
export const AssignmentGradeSchema = z.object({
  assignmentId: z.string().uuid(),
  assignmentTitle: z.string(),
  dueDate: z.string(),
  scoreWeight: z.number(),
  status: z.enum(['submitted', 'graded', 'resubmission_required', 'not_submitted']),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  isLate: z.boolean(),
  submittedAt: z.string().nullable(),
  canResubmit: z.boolean(),
});

export type AssignmentGrade = z.infer<typeof AssignmentGradeSchema>;

// 코스별 성적 스키마
export const CourseGradeSchema = z.object({
  courseId: z.string().uuid(),
  courseTitle: z.string(),
  courseDescription: z.string().nullable(),
  assignments: z.array(AssignmentGradeSchema),
  totalScore: z.number(),
  averageScore: z.number(),
  progress: z.number(),
  totalAssignments: z.number(),
  completedAssignments: z.number(),
});

export type CourseGrade = z.infer<typeof CourseGradeSchema>;

// 성적 요약 스키마
export const GradeSummarySchema = z.object({
  totalCourses: z.number(),
  totalAssignments: z.number(),
  completedAssignments: z.number(),
  overallProgress: z.number(),
  averageScore: z.number(),
  totalScore: z.number(),
});

export type GradeSummary = z.infer<typeof GradeSummarySchema>;

// 성적 조회 응답 스키마
export const GradesResponseSchema = z.object({
  courses: z.array(CourseGradeSchema),
  summary: GradeSummarySchema,
});

export type GradesResponse = z.infer<typeof GradesResponseSchema>;

// 데이터베이스 테이블 행 스키마들
export const SubmissionTableRowSchema = z.object({
  id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  learner_id: z.string().uuid(),
  content: z.string(),
  link_url: z.string().nullable(),
  is_late: z.boolean(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  graded_at: z.string().nullable(),
  graded_by: z.string().uuid().nullable(),
  submitted_at: z.string(),
  updated_at: z.string(),
});

export type SubmissionTableRow = z.infer<typeof SubmissionTableRowSchema>;

export const AssignmentTableRowSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  due_date: z.string(),
  score_weight: z.number(),
  allow_late_submission: z.boolean(),
  allow_resubmission: z.boolean(),
  status: z.enum(['draft', 'published', 'closed']),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AssignmentTableRow = z.infer<typeof AssignmentTableRowSchema>;

export const CourseTableRowSchema = z.object({
  id: z.string().uuid(),
  instructor_id: z.string().uuid(),
  category_id: z.string().uuid().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  curriculum: z.string().nullable(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  status: z.enum(['draft', 'published', 'archived']),
  enrollment_count: z.number(),
  average_rating: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CourseTableRow = z.infer<typeof CourseTableRowSchema>;

export const EnrollmentTableRowSchema = z.object({
  id: z.string().uuid(),
  learner_id: z.string().uuid(),
  course_id: z.string().uuid(),
  enrolled_at: z.string(),
  is_active: z.boolean(),
});

export type EnrollmentTableRow = z.infer<typeof EnrollmentTableRowSchema>;

// ===== 채점 이력 관련 스키마 =====

// 채점 이력 테이블 행 스키마
export const GradeLogTableRowSchema = z.object({
  id: z.string().uuid(),
  submission_id: z.string().uuid(),
  grader_id: z.string().uuid(),
  action: z.enum(['grade', 'request_resubmission']),
  score: z.number().nullable(),
  feedback: z.string(),
  created_at: z.string(),
});

export type GradeLogTableRow = z.infer<typeof GradeLogTableRowSchema>;

// 채점 이력 응답 스키마
export const GradeLogSchema = z.object({
  id: z.string().uuid(),
  submissionId: z.string().uuid(),
  graderId: z.string().uuid(),
  graderName: z.string(),
  action: z.enum(['grade', 'request_resubmission']),
  score: z.number().nullable(),
  feedback: z.string(),
  createdAt: z.string(),
});

export type GradeLog = z.infer<typeof GradeLogSchema>;

// 채점 이력 목록 응답 스키마
export const GradeLogsResponseSchema = z.object({
  logs: z.array(GradeLogSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type GradeLogsResponse = z.infer<typeof GradeLogsResponseSchema>;

// 채점 이력 생성 요청 스키마
export const CreateGradeLogRequestSchema = z.object({
  submissionId: z.string().uuid(),
  graderId: z.string().uuid(),
  action: z.enum(['grade', 'request_resubmission']),
  score: z.number().min(0).max(100).nullable(),
  feedback: z.string().min(1).max(2000),
});

export type CreateGradeLogRequest = z.infer<typeof CreateGradeLogRequestSchema>;