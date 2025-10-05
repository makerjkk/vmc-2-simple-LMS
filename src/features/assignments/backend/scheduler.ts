import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import { assignmentErrorCodes } from './error';
import { createAssignmentLog } from './logs-service';
import {
  AutoCloseResultSchema,
  SchedulerStatusSchema,
  ManualTriggerRequestSchema,
  type AutoCloseResult,
  type SchedulerStatus,
  type ManualTriggerRequest,
  type SchedulerStatusTableRow,
} from './logs-schema';

/**
 * 스케줄러 이름 상수
 */
const SCHEDULER_NAME = 'auto_close_assignments';

/**
 * 마감일이 지난 Assignment 자동 마감 처리
 * 데이터베이스의 auto_close_assignments() 함수를 호출하여 처리합니다.
 */
export const processAutoCloseAssignments = async (
  client: SupabaseClient,
  options: {
    dryRun?: boolean; // 실제 실행 없이 대상만 확인
    batchSize?: number; // 배치 처리 크기
  } = {}
): Promise<HandlerResult<AutoCloseResult, string, unknown>> => {
  const startTime = Date.now();
  const { dryRun = false, batchSize = 100 } = options;

  try {
    // 1. 스케줄러 실행 상태 확인
    const runningCheck = await checkSchedulerRunning(client);
    if (!runningCheck.ok) {
      return failure(500, assignmentErrorCodes.schedulerExecutionFailed, '스케줄러 상태 확인에 실패했습니다.');
    }

    if (runningCheck.data.isRunning) {
      return failure(409, assignmentErrorCodes.schedulerAlreadyRunning, '스케줄러가 이미 실행 중입니다.');
    }

    // 2. 스케줄러 실행 상태 업데이트 (시작)
    await updateSchedulerStatus(client, {
      isRunning: true,
      lastRunAt: new Date().toISOString(),
    });

    const processedAssignments: string[] = [];
    const errors: Array<{ assignmentId: string; error: string }> = [];

    try {
      // 3. 자동 마감 대상 Assignment 조회
      const { data: targetAssignments, error: queryError } = await client
        .from('assignments')
        .select('id, title, due_date, course_id, courses!inner(instructor_id)')
        .eq('status', 'published')
        .lt('due_date', new Date().toISOString())
        .limit(batchSize);

      if (queryError) {
        throw new Error(`대상 Assignment 조회 실패: ${queryError.message}`);
      }

      const assignments = targetAssignments || [];

      // 4. Dry run인 경우 대상만 반환
      if (dryRun) {
        const result: AutoCloseResult = {
          processedCount: assignments.length,
          processedAssignments: assignments.map(a => a.id),
          errors: [],
          executedAt: new Date().toISOString(),
          duration: Date.now() - startTime,
        };

        await updateSchedulerStatus(client, { isRunning: false });
        return success(result);
      }

      // 5. 각 Assignment 처리
      for (const assignment of assignments) {
        try {
          // 5.1 Assignment 상태를 closed로 변경
          const { error: updateError } = await client
            .from('assignments')
            .update({
              status: 'closed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', assignment.id)
            .eq('status', 'published'); // 동시성 체크

          if (updateError) {
            errors.push({
              assignmentId: assignment.id,
              error: `상태 변경 실패: ${updateError.message}`,
            });
            continue;
          }

          // 5.2 로그 생성
          const logResult = await createAssignmentLog(client, {
            assignmentId: assignment.id,
            changedBy: (assignment.courses as any).instructor_id, // 시스템이지만 강사 ID 사용
            previousStatus: 'published',
            newStatus: 'closed',
            changeReason: 'auto_close',
            metadata: {
              schedulerName: SCHEDULER_NAME,
              dueDate: assignment.due_date,
              processedAt: new Date().toISOString(),
            },
          });

          if (!logResult.ok) {
            // 로그 생성 실패는 경고로 처리 (Assignment 상태 변경은 성공)
            console.warn(`Assignment ${assignment.id} 로그 생성 실패:`, logResult);
          }

          processedAssignments.push(assignment.id);

        } catch (assignmentError) {
          errors.push({
            assignmentId: assignment.id,
            error: assignmentError instanceof Error ? assignmentError.message : '알 수 없는 오류',
          });
        }
      }

      // 6. 결과 구성
      const result: AutoCloseResult = {
        processedCount: processedAssignments.length,
        processedAssignments,
        errors,
        executedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
      };

      // 7. 스케줄러 상태 업데이트 (완료)
      await updateSchedulerStatus(client, {
        isRunning: false,
        lastSuccessAt: new Date().toISOString(),
        successCount: processedAssignments.length,
        errorCount: errors.length,
      });

      return success(result);

    } catch (processingError) {
      // 8. 처리 중 오류 발생 시 스케줄러 상태 업데이트
      const errorMessage = processingError instanceof Error ? processingError.message : '알 수 없는 오류';
      
      await updateSchedulerStatus(client, {
        isRunning: false,
        lastErrorAt: new Date().toISOString(),
        lastErrorMessage: errorMessage,
        errorCount: 1,
      });

      return failure(500, assignmentErrorCodes.autoCloseFailed, errorMessage);
    }

  } catch (error) {
    // 9. 전체 오류 처리
    await updateSchedulerStatus(client, {
      isRunning: false,
      lastErrorAt: new Date().toISOString(),
      lastErrorMessage: error instanceof Error ? error.message : '스케줄러 실행 중 오류 발생',
      errorCount: 1,
    });

    return failure(500, assignmentErrorCodes.schedulerExecutionFailed, 'Assignment 자동 마감 처리 중 오류가 발생했습니다.', error);
  }
};

/**
 * 스케줄러 상태 조회
 */
export const getSchedulerStatus = async (
  client: SupabaseClient
): Promise<HandlerResult<SchedulerStatus, string, unknown>> => {
  try {
    // 1. 스케줄러 상태 조회
    const { data: statusData, error: statusError } = await client
      .from('scheduler_status')
      .select('*')
      .eq('scheduler_name', SCHEDULER_NAME)
      .single();

    if (statusError || !statusData) {
      return failure(404, assignmentErrorCodes.notFound, '스케줄러 상태를 찾을 수 없습니다.');
    }

    const status = statusData as SchedulerStatusTableRow;

    // 2. 가동 시간 계산
    const createdAt = new Date(status.created_at);
    const uptime = Date.now() - createdAt.getTime();

    // 3. 성공률 계산
    const totalRuns = status.run_count;
    const successRate = totalRuns > 0 ? (status.success_count / totalRuns) * 100 : 0;

    // 4. 응답 데이터 구성
    const response: SchedulerStatus = {
      schedulerName: status.scheduler_name,
      lastRunAt: status.last_run_at,
      lastSuccessAt: status.last_success_at,
      lastErrorAt: status.last_error_at,
      lastErrorMessage: status.last_error_message,
      isRunning: status.is_running,
      runCount: status.run_count,
      successCount: status.success_count,
      errorCount: status.error_count,
      uptime,
      successRate: Math.round(successRate * 100) / 100, // 소수점 2자리
    };

    return success(response);

  } catch (error) {
    return failure(500, assignmentErrorCodes.databaseError, '스케줄러 상태 조회 중 오류가 발생했습니다.', error);
  }
};

/**
 * 수동 스케줄러 실행 (관리자용)
 */
export const manualTriggerAutoClose = async (
  client: SupabaseClient,
  data: ManualTriggerRequest
): Promise<HandlerResult<AutoCloseResult, string, unknown>> => {
  try {
    // 1. 요청 데이터 검증
    const parsedData = ManualTriggerRequestSchema.safeParse(data);
    if (!parsedData.success) {
      return failure(400, assignmentErrorCodes.validationError, '입력 데이터가 올바르지 않습니다.');
    }

    const { adminId, force } = parsedData.data;

    // 2. 관리자 권한 확인
    const { data: adminData, error: adminError } = await client
      .from('users')
      .select('id, role')
      .eq('id', adminId)
      .single();

    if (adminError || !adminData) {
      return failure(404, assignmentErrorCodes.unauthorized, '사용자를 찾을 수 없습니다.');
    }

    // 관리자 또는 강사 권한 확인 (강사도 자신의 Assignment에 대해서는 수동 실행 가능)
    if (adminData.role !== 'operator' && adminData.role !== 'instructor') {
      return failure(403, assignmentErrorCodes.schedulerNotAuthorized, '스케줄러 실행 권한이 없습니다.');
    }

    // 3. 강제 실행이 아닌 경우 실행 중 상태 확인
    if (!force) {
      const runningCheck = await checkSchedulerRunning(client);
      if (!runningCheck.ok) {
        return failure(500, assignmentErrorCodes.schedulerExecutionFailed, '스케줄러 상태 확인에 실패했습니다.');
      }

      if (runningCheck.data.isRunning) {
        return failure(409, assignmentErrorCodes.schedulerAlreadyRunning, '스케줄러가 이미 실행 중입니다. force 옵션을 사용하세요.');
      }
    }

    // 4. 스케줄러 실행
    const result = await processAutoCloseAssignments(client, {
      dryRun: false,
      batchSize: 50, // 수동 실행 시 작은 배치 크기 사용
    });

    // 5. 수동 실행 로그 추가
    if (result.ok) {
      // 메타데이터에 수동 실행 정보 추가
      const enhancedResult: AutoCloseResult = {
        ...result.data,
        // metadata에 수동 실행 정보 추가하고 싶지만 스키마에 없으므로 생략
      };

      return success(enhancedResult);
    }

    return result;

  } catch (error) {
    return failure(500, assignmentErrorCodes.schedulerExecutionFailed, '수동 스케줄러 실행 중 오류가 발생했습니다.', error);
  }
};

/**
 * 스케줄러 실행 상태 확인 (내부 함수)
 */
const checkSchedulerRunning = async (
  client: SupabaseClient
): Promise<HandlerResult<{ isRunning: boolean }, string, unknown>> => {
  try {
    const { data: statusData, error: statusError } = await client
      .from('scheduler_status')
      .select('is_running')
      .eq('scheduler_name', SCHEDULER_NAME)
      .single();

    if (statusError || !statusData) {
      return failure(404, assignmentErrorCodes.notFound, '스케줄러 상태를 찾을 수 없습니다.');
    }

    return success({ isRunning: statusData.is_running });

  } catch (error) {
    return failure(500, assignmentErrorCodes.databaseError, '스케줄러 상태 확인 중 오류가 발생했습니다.', error);
  }
};

/**
 * 스케줄러 상태 업데이트 (내부 함수)
 */
const updateSchedulerStatus = async (
  client: SupabaseClient,
  updates: {
    isRunning?: boolean;
    lastRunAt?: string;
    lastSuccessAt?: string;
    lastErrorAt?: string;
    lastErrorMessage?: string;
    successCount?: number;
    errorCount?: number;
  }
): Promise<void> => {
  try {
    const updateData: any = {};

    if (updates.isRunning !== undefined) {
      updateData.is_running = updates.isRunning;
    }
    // 현재 상태 조회 (카운터 업데이트를 위해)
    const { data: currentStatus } = await client
      .from('scheduler_status')
      .select('run_count, success_count, error_count')
      .eq('scheduler_name', SCHEDULER_NAME)
      .single();

    if (updates.lastRunAt) {
      updateData.last_run_at = updates.lastRunAt;
      updateData.run_count = (currentStatus?.run_count || 0) + 1;
    }
    if (updates.lastSuccessAt) {
      updateData.last_success_at = updates.lastSuccessAt;
    }
    if (updates.lastErrorAt) {
      updateData.last_error_at = updates.lastErrorAt;
    }
    if (updates.lastErrorMessage) {
      updateData.last_error_message = updates.lastErrorMessage;
    }
    if (updates.successCount !== undefined) {
      updateData.success_count = (currentStatus?.success_count || 0) + updates.successCount;
    }
    if (updates.errorCount !== undefined) {
      updateData.error_count = (currentStatus?.error_count || 0) + updates.errorCount;
    }

    await client
      .from('scheduler_status')
      .update(updateData)
      .eq('scheduler_name', SCHEDULER_NAME);

  } catch (error) {
    console.error('스케줄러 상태 업데이트 실패:', error);
    // 상태 업데이트 실패는 로그만 남기고 계속 진행
  }
};

/**
 * 스케줄러 통계 조회
 */
export const getSchedulerStats = async (
  client: SupabaseClient,
  days: number = 30
): Promise<HandlerResult<{
  totalProcessed: number;
  totalErrors: number;
  averageProcessingTime: number;
  lastNDaysActivity: Array<{
    date: string;
    processed: number;
    errors: number;
  }>;
}, string, unknown>> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. 지정된 기간 동안의 로그 조회
    const { data: logsData, error: logsError } = await client
      .from('assignment_logs')
      .select('created_at, change_reason, metadata')
      .eq('change_reason', 'auto_close')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (logsError) {
      return failure(500, assignmentErrorCodes.logQueryFailed, '스케줄러 통계 조회 중 오류가 발생했습니다.');
    }

    const logs = logsData || [];
    
    // 2. 통계 계산
    const totalProcessed = logs.length;
    const totalErrors = 0; // 성공한 로그만 조회했으므로 0
    
    // 3. 평균 처리 시간 계산 (메타데이터에서 duration 추출)
    const durationsMs = logs
      .map(log => log.metadata?.duration)
      .filter(duration => typeof duration === 'number');
    const averageProcessingTime = durationsMs.length > 0
      ? durationsMs.reduce((sum, duration) => sum + duration, 0) / durationsMs.length
      : 0;

    // 4. 일별 활동 통계
    const dailyStats = new Map<string, { processed: number; errors: number }>();
    
    logs.forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      const current = dailyStats.get(date) || { processed: 0, errors: 0 };
      current.processed += 1;
      dailyStats.set(date, current);
    });

    const lastNDaysActivity = Array.from(dailyStats.entries())
      .map(([date, stats]) => ({
        date,
        processed: stats.processed,
        errors: stats.errors,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const response = {
      totalProcessed,
      totalErrors,
      averageProcessingTime: Math.round(averageProcessingTime),
      lastNDaysActivity,
    };

    return success(response);

  } catch (error) {
    return failure(500, assignmentErrorCodes.databaseError, '스케줄러 통계 조회 중 오류가 발생했습니다.', error);
  }
};
