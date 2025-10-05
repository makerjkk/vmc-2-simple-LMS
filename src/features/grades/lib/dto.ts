/**
 * 성적 조회 관련 DTO (Data Transfer Object)
 * 백엔드 스키마를 프론트엔드에서 재사용하기 위한 재노출
 */

// 백엔드 스키마에서 타입 재노출
export type {
  GradeParams,
  AssignmentGrade,
  CourseGrade,
  GradeSummary,
  GradesResponse,
} from '../backend/schema';

// 백엔드 스키마 재노출
export {
  GradeParamsSchema,
  AssignmentGradeSchema,
  CourseGradeSchema,
  GradeSummarySchema,
  GradesResponseSchema,
} from '../backend/schema';
