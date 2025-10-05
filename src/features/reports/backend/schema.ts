import { z } from 'zod';

/**
 * 신고 목록 조회 쿼리 파라미터 스키마
 */
export const ReportsQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: z.enum(['received', 'investigating', 'resolved']).optional(),
  reportedType: z.enum(['course', 'assignment', 'submission', 'user']).optional(),
  sortBy: z.enum(['created_at', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ReportsQueryParams = z.infer<typeof ReportsQuerySchema>;

/**
 * 신고 파라미터 스키마 (URL 파라미터)
 */
export const ReportParamsSchema = z.object({
  id: z.string().uuid('유효하지 않은 신고 ID입니다.'),
});

export type ReportParams = z.infer<typeof ReportParamsSchema>;

/**
 * 신고 상태 업데이트 스키마
 */
export const UpdateReportStatusSchema = z.object({
  status: z.enum(['investigating', 'resolved'], {
    errorMap: () => ({ message: '유효하지 않은 상태입니다. investigating 또는 resolved만 허용됩니다.' }),
  }),
  actionTaken: z.string().min(1, '처리 내용을 입력해주세요.').optional(),
});

export type UpdateReportStatusRequest = z.infer<typeof UpdateReportStatusSchema>;

/**
 * 신고 액션 실행 스키마
 */
export const ExecuteReportActionSchema = z.object({
  actionType: z.enum(['warn', 'invalidate_submission', 'restrict_account', 'dismiss'], {
    errorMap: () => ({ message: '유효하지 않은 액션 타입입니다.' }),
  }),
  reason: z.string().min(1, '처리 사유를 입력해주세요.'),
  actionDetails: z.record(z.any()).optional(),
});

export type ExecuteReportActionRequest = z.infer<typeof ExecuteReportActionSchema>;

/**
 * 신고 응답 스키마
 */
export const ReportResponseSchema = z.object({
  id: z.string().uuid(),
  reporterId: z.string().uuid(),
  reporterName: z.string(),
  reportedType: z.enum(['course', 'assignment', 'submission', 'user']),
  reportedId: z.string().uuid(),
  reportedTitle: z.string().nullable(),
  reason: z.string(),
  content: z.string(),
  status: z.enum(['received', 'investigating', 'resolved']),
  actionTaken: z.string().nullable(),
  handledBy: z.string().uuid().nullable(),
  handledByName: z.string().nullable(),
  handledAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ReportResponse = z.infer<typeof ReportResponseSchema>;

/**
 * 신고 목록 응답 스키마
 */
export const ReportsListResponseSchema = z.object({
  reports: z.array(ReportResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type ReportsListResponse = z.infer<typeof ReportsListResponseSchema>;

/**
 * 신고 액션 응답 스키마
 */
export const ReportActionResponseSchema = z.object({
  id: z.string().uuid(),
  reportId: z.string().uuid(),
  actionType: z.enum(['warn', 'invalidate_submission', 'restrict_account', 'dismiss']),
  actionDetails: z.record(z.any()).nullable(),
  performedBy: z.string().uuid(),
  performedByName: z.string(),
  performedAt: z.string().datetime(),
});

export type ReportActionResponse = z.infer<typeof ReportActionResponseSchema>;

/**
 * 신고 상세 응답 스키마 (액션 히스토리 포함)
 */
export const ReportDetailResponseSchema = ReportResponseSchema.extend({
  actions: z.array(ReportActionResponseSchema),
});

export type ReportDetailResponse = z.infer<typeof ReportDetailResponseSchema>;
