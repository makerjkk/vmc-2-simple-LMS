import { z } from 'zod';

// 수강신청 요청 스키마
export const EnrollmentRequestSchema = z.object({
  courseId: z.string().uuid({ message: 'Course ID must be a valid UUID.' }),
});

export type EnrollmentRequest = z.infer<typeof EnrollmentRequestSchema>;

// 수강취소 파라미터 스키마
export const EnrollmentDeleteParamsSchema = z.object({
  courseId: z.string().uuid({ message: 'Course ID must be a valid UUID.' }),
});

export type EnrollmentDeleteParams = z.infer<typeof EnrollmentDeleteParamsSchema>;

// 수강신청 응답 스키마
export const EnrollmentResponseSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  learnerId: z.string().uuid(),
  enrolledAt: z.string(),
  isActive: z.boolean(),
});

export type EnrollmentResponse = z.infer<typeof EnrollmentResponseSchema>;

// 수강신청 상태 응답 스키마
export const EnrollmentStatusResponseSchema = z.object({
  isEnrolled: z.boolean(),
  enrolledAt: z.string().nullable(),
});

export type EnrollmentStatusResponse = z.infer<typeof EnrollmentStatusResponseSchema>;

// 데이터베이스 테이블 행 스키마
export const EnrollmentTableRowSchema = z.object({
  id: z.string().uuid(),
  learner_id: z.string().uuid(),
  course_id: z.string().uuid(),
  enrolled_at: z.string(),
  is_active: z.boolean(),
});

export type EnrollmentTableRow = z.infer<typeof EnrollmentTableRowSchema>;

// 코스 상태 확인을 위한 스키마
export const CourseStatusRowSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'published', 'archived']),
  title: z.string(),
});

export type CourseStatusRow = z.infer<typeof CourseStatusRowSchema>;
