import { z } from 'zod';

// 과제 상세 조회 파라미터 스키마
export const AssignmentParamsSchema = z.object({
  id: z.string().uuid({ message: 'Assignment id must be a valid UUID.' }),
});

export type AssignmentParams = z.infer<typeof AssignmentParamsSchema>;

// 과제 상세 응답 스키마
export const AssignmentDetailResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  dueDate: z.string(),
  scoreWeight: z.number(),
  allowLateSubmission: z.boolean(),
  allowResubmission: z.boolean(),
  status: z.enum(['draft', 'published', 'closed']),
  course: z.object({
    id: z.string().uuid(),
    title: z.string(),
  }),
  submission: z.object({
    id: z.string().uuid(),
    status: z.enum(['submitted', 'graded', 'resubmission_required']),
    submittedAt: z.string(),
    isLate: z.boolean(),
    content: z.string(),
    link: z.string().nullable(),
    score: z.number().nullable(),
    feedback: z.string().nullable(),
  }).nullable(),
});

export type AssignmentDetailResponse = z.infer<typeof AssignmentDetailResponseSchema>;

// 데이터베이스 테이블 행 스키마
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

// 제출물 테이블 행 스키마
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

// 코스 테이블 행 스키마 (조인용)
export const CourseTableRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
});

export type CourseTableRow = z.infer<typeof CourseTableRowSchema>;
