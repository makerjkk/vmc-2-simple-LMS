/**
 * 대시보드 관련 DTO (Data Transfer Object) 재노출
 * 프론트엔드에서 백엔드 스키마를 재사용하기 위한 파일
 */

// 백엔드 스키마 재노출
export {
  CourseProgressSchema,
  UpcomingAssignmentSchema,
  RecentFeedbackSchema,
  DashboardResponseSchema,
  type CourseProgress,
  type UpcomingAssignment,
  type RecentFeedback,
  type DashboardResponse,
} from '../backend/schema';

// 에러 코드 재노출
export {
  dashboardErrorCodes,
  type DashboardServiceError,
} from '../backend/error';
