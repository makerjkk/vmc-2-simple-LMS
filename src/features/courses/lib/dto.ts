// 백엔드 스키마를 프론트엔드에서 재사용하기 위한 DTO 재노출
export {
  CoursesQueryParamsSchema,
  CourseParamsSchema,
  EnrollmentStatusParamsSchema,
  CourseResponseSchema,
  CoursesResponseSchema,
  CourseDetailResponseSchema,
  EnrollmentStatusResponseSchema,
  type CoursesQueryParams,
  type CourseParams,
  type EnrollmentStatusParams,
  type CourseResponse,
  type CoursesResponse,
  type CourseDetailResponse,
  type EnrollmentStatusResponse,
} from '@/features/courses/backend/schema';
