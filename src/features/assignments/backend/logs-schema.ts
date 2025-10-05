import { z } from 'zod';

// Assignment 로그 생성 요청 스키마
export const CreateAssignmentLogRequestSchema = z.object({
  assignmentId: z.string().uuid('올바른 Assignment ID를 입력해주세요.'),
  changedBy: z.string().uuid('올바른 사용자 ID를 입력해주세요.'),
  previousStatus: z.enum(['draft', 'published', 'closed'], {
    errorMap: () => ({ message: '올바른 이전 상태를 입력해주세요.' }),
  }),
  newStatus: z.enum(['draft', 'published', 'closed'], {
    errorMap: () => ({ message: '올바른 새 상태를 입력해주세요.' }),
  }),
  changeReason: z.enum(['manual', 'auto_close', 'system'], {
    errorMap: () => ({ message: '올바른 변경 사유를 입력해주세요.' }),
  }),
  metadata: z.record(z.any()).optional().default({}),
});

export type CreateAssignmentLogRequest = z.infer<typeof CreateAssignmentLogRequestSchema>;

// Assignment 로그 테이블 행 스키마
export const AssignmentLogTableRowSchema = z.object({
  id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  changed_by: z.string().uuid(),
  previous_status: z.enum(['draft', 'published', 'closed']),
  new_status: z.enum(['draft', 'published', 'closed']),
  change_reason: z.enum(['manual', 'auto_close', 'system']),
  metadata: z.record(z.any()),
  created_at: z.string(),
});

export type AssignmentLogTableRow = z.infer<typeof AssignmentLogTableRowSchema>;

// Assignment 로그 응답 스키마
export const AssignmentLogSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  changedBy: z.string().uuid(),
  changedByName: z.string(),
  previousStatus: z.enum(['draft', 'published', 'closed']),
  newStatus: z.enum(['draft', 'published', 'closed']),
  changeReason: z.enum(['manual', 'auto_close', 'system']),
  metadata: z.record(z.any()),
  createdAt: z.string(),
});

export type AssignmentLog = z.infer<typeof AssignmentLogSchema>;

// Assignment 로그 목록 쿼리 스키마
export const AssignmentLogsQuerySchema = z.object({
  assignmentId: z.string().uuid('올바른 Assignment ID를 입력해주세요.'),
  changeReason: z.enum(['manual', 'auto_close', 'system']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type AssignmentLogsQuery = z.infer<typeof AssignmentLogsQuerySchema>;

// 강사별 Assignment 로그 쿼리 스키마
export const InstructorAssignmentLogsQuerySchema = z.object({
  instructorId: z.string().uuid('올바른 강사 ID를 입력해주세요.'),
  assignmentId: z.string().uuid().optional(),
  changeReason: z.enum(['manual', 'auto_close', 'system']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type InstructorAssignmentLogsQuery = z.infer<typeof InstructorAssignmentLogsQuerySchema>;

// Assignment 로그 목록 응답 스키마
export const AssignmentLogsResponseSchema = z.object({
  logs: z.array(AssignmentLogSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});

export type AssignmentLogsResponse = z.infer<typeof AssignmentLogsResponseSchema>;

// 스케줄러 결과 스키마
export const AutoCloseResultSchema = z.object({
  processedCount: z.number().int().min(0),
  processedAssignments: z.array(z.string().uuid()),
  errors: z.array(z.object({
    assignmentId: z.string().uuid(),
    error: z.string(),
  })),
  executedAt: z.string(),
  duration: z.number().min(0), // 실행 시간 (밀리초)
});

export type AutoCloseResult = z.infer<typeof AutoCloseResultSchema>;

// 스케줄러 상태 테이블 행 스키마
export const SchedulerStatusTableRowSchema = z.object({
  id: z.string().uuid(),
  scheduler_name: z.string(),
  last_run_at: z.string().nullable(),
  last_success_at: z.string().nullable(),
  last_error_at: z.string().nullable(),
  last_error_message: z.string().nullable(),
  is_running: z.boolean(),
  run_count: z.number().int().min(0),
  success_count: z.number().int().min(0),
  error_count: z.number().int().min(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export type SchedulerStatusTableRow = z.infer<typeof SchedulerStatusTableRowSchema>;

// 스케줄러 상태 응답 스키마
export const SchedulerStatusSchema = z.object({
  schedulerName: z.string(),
  lastRunAt: z.string().nullable(),
  lastSuccessAt: z.string().nullable(),
  lastErrorAt: z.string().nullable(),
  lastErrorMessage: z.string().nullable(),
  isRunning: z.boolean(),
  runCount: z.number().int().min(0),
  successCount: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  uptime: z.number().min(0), // 가동 시간 (밀리초)
  successRate: z.number().min(0).max(100), // 성공률 (%)
});

export type SchedulerStatus = z.infer<typeof SchedulerStatusSchema>;

// 수동 스케줄러 실행 요청 스키마
export const ManualTriggerRequestSchema = z.object({
  adminId: z.string().uuid('올바른 관리자 ID를 입력해주세요.'),
  force: z.boolean().optional().default(false), // 강제 실행 여부
});

export type ManualTriggerRequest = z.infer<typeof ManualTriggerRequestSchema>;
