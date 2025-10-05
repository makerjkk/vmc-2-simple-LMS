/**
 * 신고 관련 DTO 재노출
 * 백엔드 스키마를 프론트엔드에서 사용할 수 있도록 재노출
 */

export type {
  ReportsQueryParams,
  ReportParams,
  UpdateReportStatusRequest,
  ExecuteReportActionRequest,
  ReportResponse,
  ReportsListResponse,
  ReportActionResponse,
  ReportDetailResponse,
} from '@/features/reports/backend/schema';

export {
  ReportsQuerySchema,
  ReportParamsSchema,
  UpdateReportStatusSchema,
  ExecuteReportActionSchema,
  ReportResponseSchema,
  ReportsListResponseSchema,
  ReportActionResponseSchema,
  ReportDetailResponseSchema,
} from '@/features/reports/backend/schema';
