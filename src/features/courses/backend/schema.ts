import { z } from 'zod';

// 코스 목록 조회 파라미터 스키마
export const CoursesQueryParamsSchema = z.object({
  search: z.string().optional(),
  category: z.string().uuid().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  sortBy: z.enum(['latest', 'popular']).optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20),
});

export type CoursesQueryParams = z.infer<typeof CoursesQueryParamsSchema>;

// 코스 상세 조회 파라미터 스키마
export const CourseParamsSchema = z.object({
  id: z.string().uuid({ message: 'Course id must be a valid UUID.' }),
});

export type CourseParams = z.infer<typeof CourseParamsSchema>;

// 수강신청 상태 조회 파라미터 스키마
export const EnrollmentStatusParamsSchema = z.object({
  courseId: z.string().uuid({ message: 'Course id must be a valid UUID.' }),
});

export type EnrollmentStatusParams = z.infer<typeof EnrollmentStatusParamsSchema>;

// 코스 응답 스키마
export const CourseResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  enrollmentCount: z.number(),
  averageRating: z.number(),
  createdAt: z.string(),
  instructor: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
  }),
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).nullable(),
  isEnrolled: z.boolean().optional(), // 수강신청 상태 추가
});

export type CourseResponse = z.infer<typeof CourseResponseSchema>;

// 코스 목록 응답 스키마
export const CoursesResponseSchema = z.object({
  courses: z.array(CourseResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type CoursesResponse = z.infer<typeof CoursesResponseSchema>;

// 코스 상세 응답 스키마
export const CourseDetailResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  curriculum: z.string().nullable().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  enrollmentCount: z.number(),
  averageRating: z.number(),
  createdAt: z.string(),
  instructor: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
  }),
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).nullable(),
  isEnrolled: z.boolean().optional(),
});

export type CourseDetailResponse = z.infer<typeof CourseDetailResponseSchema>;

// 수강신청 상태 응답 스키마
export const EnrollmentStatusResponseSchema = z.object({
  isEnrolled: z.boolean(),
  enrolledAt: z.string().nullable(),
});

export type EnrollmentStatusResponse = z.infer<typeof EnrollmentStatusResponseSchema>;

// 데이터베이스 테이블 행 스키마
export const CourseTableRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  curriculum: z.string().nullable().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  status: z.enum(['draft', 'published', 'archived']),
  enrollment_count: z.number(),
  average_rating: z.number(),
  created_at: z.string(),
  instructor: z.object({
    id: z.string().uuid(),
    full_name: z.string(),
  }).nullable(),
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).nullable(),
});

export type CourseTableRow = z.infer<typeof CourseTableRowSchema>;

// 수강신청 테이블 행 스키마
export const EnrollmentTableRowSchema = z.object({
  id: z.string().uuid(),
  learner_id: z.string().uuid(),
  course_id: z.string().uuid(),
  enrolled_at: z.string(),
  is_active: z.boolean(),
});

export type EnrollmentTableRow = z.infer<typeof EnrollmentTableRowSchema>;

// Course Management 관련 스키마들

// 코스 생성 요청 스키마
export const CreateCourseRequestSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  curriculum: z.string().max(5000).optional(),
  categoryId: z.string().uuid(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
});

export type CreateCourseRequest = z.infer<typeof CreateCourseRequestSchema>;

// 코스 수정 요청 스키마
export const UpdateCourseRequestSchema = CreateCourseRequestSchema.partial();

export type UpdateCourseRequest = z.infer<typeof UpdateCourseRequestSchema>;

// 코스 상태 변경 요청 스키마
export const CourseStatusUpdateSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']),
});

export type CourseStatusUpdate = z.infer<typeof CourseStatusUpdateSchema>;

// 강사 코스 목록 조회 파라미터 스키마
export const InstructorCoursesQuerySchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
});

export type InstructorCoursesQuery = z.infer<typeof InstructorCoursesQuerySchema>;

// 강사용 코스 응답 스키마 (상태 포함)
export const InstructorCourseResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  curriculum: z.string().nullable().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  status: z.enum(['draft', 'published', 'archived']),
  enrollmentCount: z.number(),
  averageRating: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).nullable(),
});

export type InstructorCourseResponse = z.infer<typeof InstructorCourseResponseSchema>;

// 강사 코스 목록 응답 스키마
export const InstructorCoursesResponseSchema = z.object({
  courses: z.array(InstructorCourseResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type InstructorCoursesResponse = z.infer<typeof InstructorCoursesResponseSchema>;

// 강사용 코스 테이블 행 스키마 (updated_at 포함)
export const InstructorCourseTableRowSchema = z.object({
  id: z.string().uuid(),
  instructor_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  curriculum: z.string().nullable().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  status: z.enum(['draft', 'published', 'archived']),
  enrollment_count: z.number(),
  average_rating: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  category: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).nullable(),
});

export type InstructorCourseTableRow = z.infer<typeof InstructorCourseTableRowSchema>;