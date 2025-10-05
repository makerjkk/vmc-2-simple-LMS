import { Hono } from 'hono';
import { respond } from '@/backend/http/response';
import type { AppEnv } from '@/backend/hono/context';
import { contextKeys } from '@/backend/hono/context';
import { 
  processAutoCloseAssignments, 
  getSchedulerStatus, 
  manualTriggerAutoClose,
  getSchedulerStats,
} from './scheduler';
import { getAssignmentLogs, getInstructorAssignmentLogs } from './logs-service';
import { assignmentErrorCodes } from './error';

/**
 * Assignment 스케줄러 관련 라우트 등록
 */
export const registerSchedulerRoutes = (app: Hono<AppEnv>) => {
  // POST /api/assignments/scheduler/trigger - 수동 스케줄러 실행
  app.post('/api/assignments/scheduler/trigger', async (c) => {
    const supabase = c.get(contextKeys.supabase);
    const logger = c.get(contextKeys.logger);

    try {
      const body = await c.req.json();
      const { adminId, force = false } = body;

      if (!adminId) {
        return respond(c, {
          ok: false,
          status: 400,
          error: {
            code: assignmentErrorCodes.validationError,
            message: '관리자 ID가 필요합니다.',
          },
        });
      }

      logger?.info?.('수동 스케줄러 실행 요청', { adminId, force });

      const result = await manualTriggerAutoClose(supabase, { adminId, force });
      
      if (result.ok) {
        logger?.info?.('수동 스케줄러 실행 완료', { 
          processedCount: result.data.processedCount,
          errorCount: result.data.errors.length,
          duration: result.data.duration,
        });
      } else {
        logger?.error?.('수동 스케줄러 실행 실패', result);
      }

      return respond(c, result);

    } catch (error) {
      logger?.error?.('수동 스케줄러 실행 중 오류', error);
      return respond(c, {
        ok: false,
        status: 500,
        error: {
          code: assignmentErrorCodes.schedulerExecutionFailed,
          message: '수동 스케줄러 실행 중 오류가 발생했습니다.',
        },
      });
    }
  });

  // POST /api/assignments/scheduler/auto-close - 자동 마감 처리 (시스템용)
  app.post('/api/assignments/scheduler/auto-close', async (c) => {
    const supabase = c.get(contextKeys.supabase);
    const logger = c.get(contextKeys.logger);

    try {
      const body = await c.req.json();
      const { dryRun = false, batchSize = 100 } = body;

      logger?.info?.('자동 마감 처리 시작', { dryRun, batchSize });

      const result = await processAutoCloseAssignments(supabase, { dryRun, batchSize });
      
      if (result.ok) {
        logger?.info?.('자동 마감 처리 완료', { 
          processedCount: result.data.processedCount,
          errorCount: result.data.errors.length,
          duration: result.data.duration,
        });
      } else {
        logger?.error?.('자동 마감 처리 실패', result);
      }

      return respond(c, result);

    } catch (error) {
      logger?.error?.('자동 마감 처리 중 오류', error);
      return respond(c, {
        ok: false,
        status: 500,
        error: {
          code: assignmentErrorCodes.autoCloseFailed,
          message: '자동 마감 처리 중 오류가 발생했습니다.',
        },
      });
    }
  });

  // GET /api/assignments/scheduler/status - 스케줄러 상태 조회
  app.get('/api/assignments/scheduler/status', async (c) => {
    const supabase = c.get(contextKeys.supabase);
    const logger = c.get(contextKeys.logger);

    try {
      logger?.info?.('스케줄러 상태 조회 요청');

      const result = await getSchedulerStatus(supabase);
      
      if (result.ok) {
        logger?.info?.('스케줄러 상태 조회 완료', { 
          isRunning: result.data.isRunning,
          runCount: result.data.runCount,
          successRate: result.data.successRate,
        });
      } else {
        logger?.error?.('스케줄러 상태 조회 실패', result);
      }

      return respond(c, result);

    } catch (error) {
      logger?.error?.('스케줄러 상태 조회 중 오류', error);
      return respond(c, {
        ok: false,
        status: 500,
        error: {
          code: assignmentErrorCodes.databaseError,
          message: '스케줄러 상태 조회 중 오류가 발생했습니다.',
        },
      });
    }
  });

  // GET /api/assignments/scheduler/stats - 스케줄러 통계 조회
  app.get('/api/assignments/scheduler/stats', async (c) => {
    const supabase = c.get(contextKeys.supabase);
    const logger = c.get(contextKeys.logger);

    try {
      const days = parseInt(c.req.query('days') || '30');
      
      if (days < 1 || days > 365) {
        return respond(c, {
          ok: false,
          status: 400,
          error: {
            code: assignmentErrorCodes.validationError,
            message: '조회 기간은 1일 이상 365일 이하여야 합니다.',
          },
        });
      }

      logger?.info?.('스케줄러 통계 조회 요청', { days });

      const result = await getSchedulerStats(supabase, days);
      
      if (result.ok) {
        logger?.info?.('스케줄러 통계 조회 완료', { 
          totalProcessed: result.data.totalProcessed,
          totalErrors: result.data.totalErrors,
          days,
        });
      } else {
        logger?.error?.('스케줄러 통계 조회 실패', result);
      }

      return respond(c, result);

    } catch (error) {
      logger?.error?.('스케줄러 통계 조회 중 오류', error);
      return respond(c, {
        ok: false,
        status: 500,
        error: {
          code: assignmentErrorCodes.databaseError,
          message: '스케줄러 통계 조회 중 오류가 발생했습니다.',
        },
      });
    }
  });

  // GET /api/assignments/logs/:assignmentId - Assignment 로그 조회
  app.get('/api/assignments/logs/:assignmentId', async (c) => {
    const supabase = c.get(contextKeys.supabase);
    const logger = c.get(contextKeys.logger);

    try {
      const assignmentId = c.req.param('assignmentId');
      const changeReason = c.req.query('changeReason') as 'manual' | 'auto_close' | 'system' | undefined;
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');

      if (!assignmentId) {
        return respond(c, {
          ok: false,
          status: 400,
          error: {
            code: assignmentErrorCodes.validationError,
            message: 'Assignment ID가 필요합니다.',
          },
        });
      }

      logger?.info?.('Assignment 로그 조회 요청', { assignmentId, changeReason, page, limit });

      const result = await getAssignmentLogs(supabase, {
        assignmentId,
        changeReason,
        page,
        limit,
      });
      
      if (result.ok) {
        logger?.info?.('Assignment 로그 조회 완료', { 
          assignmentId,
          totalLogs: result.data.pagination.total,
          page,
        });
      } else {
        logger?.error?.('Assignment 로그 조회 실패', result);
      }

      return respond(c, result);

    } catch (error) {
      logger?.error?.('Assignment 로그 조회 중 오류', error);
      return respond(c, {
        ok: false,
        status: 500,
        error: {
          code: assignmentErrorCodes.logQueryFailed,
          message: 'Assignment 로그 조회 중 오류가 발생했습니다.',
        },
      });
    }
  });

  // GET /api/assignments/logs/instructor/:instructorId - 강사별 로그 조회
  app.get('/api/assignments/logs/instructor/:instructorId', async (c) => {
    const supabase = c.get(contextKeys.supabase);
    const logger = c.get(contextKeys.logger);

    try {
      const instructorId = c.req.param('instructorId');
      const assignmentId = c.req.query('assignmentId');
      const changeReason = c.req.query('changeReason') as 'manual' | 'auto_close' | 'system' | undefined;
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');

      if (!instructorId) {
        return respond(c, {
          ok: false,
          status: 400,
          error: {
            code: assignmentErrorCodes.validationError,
            message: '강사 ID가 필요합니다.',
          },
        });
      }

      logger?.info?.('강사별 로그 조회 요청', { instructorId, assignmentId, changeReason, page, limit });

      const result = await getInstructorAssignmentLogs(supabase, {
        instructorId,
        assignmentId,
        changeReason,
        page,
        limit,
      });
      
      if (result.ok) {
        logger?.info?.('강사별 로그 조회 완료', { 
          instructorId,
          totalLogs: result.data.pagination.total,
          page,
        });
      } else {
        logger?.error?.('강사별 로그 조회 실패', result);
      }

      return respond(c, result);

    } catch (error) {
      logger?.error?.('강사별 로그 조회 중 오류', error);
      return respond(c, {
        ok: false,
        status: 500,
        error: {
          code: assignmentErrorCodes.logQueryFailed,
          message: '강사별 로그 조회 중 오류가 발생했습니다.',
        },
      });
    }
  });
};
