/**
 * 운영자 대시보드 관련 DTO 재노출
 * 백엔드 스키마를 프론트엔드에서 사용할 수 있도록 재노출
 */

export type {
  OperatorStatsResponse,
  RecentReportsResponse,
  PendingActionsResponse,
} from '@/features/operator-dashboard/backend/schema';

export {
  OperatorStatsResponseSchema,
  RecentReportsResponseSchema,
  PendingActionsResponseSchema,
} from '@/features/operator-dashboard/backend/schema';
