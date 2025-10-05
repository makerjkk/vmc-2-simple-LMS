import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import { assignmentErrorCodes } from './error';
import {
  CreateAssignmentLogRequestSchema,
  AssignmentLogsQuerySchema,
  InstructorAssignmentLogsQuerySchema,
  type CreateAssignmentLogRequest,
  type AssignmentLog,
  type AssignmentLogsQuery,
  type InstructorAssignmentLogsQuery,
  type AssignmentLogsResponse,
  type AssignmentLogTableRow,
} from './logs-schema';

/**
 * Assignment 상태 변경 로그 생성 서비스
 * 상태 변경 이력을 데이터베이스에 기록합니다.
 */
export const createAssignmentLog = async (
  client: SupabaseClient,
  data: CreateAssignmentLogRequest
): Promise<HandlerResult<AssignmentLog, string, unknown>> => {
  try {
    // 1. 요청 데이터 검증
    const parsedData = CreateAssignmentLogRequestSchema.safeParse(data);
    if (!parsedData.success) {
      return failure(400, assignmentErrorCodes.validationError, '입력 데이터가 올바르지 않습니다.');
    }

    const { assignmentId, changedBy, previousStatus, newStatus, changeReason, metadata } = parsedData.data;

    // 2. Assignment 존재 여부 확인
    const { data: assignmentData, error: assignmentError } = await client
      .from('assignments')
      .select('id, title')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      return failure(404, assignmentErrorCodes.notFound, 'Assignment를 찾을 수 없습니다.');
    }

    // 3. 사용자 존재 여부 확인
    const { data: userData, error: userError } = await client
      .from('users')
      .select('id, full_name, role')
      .eq('id', changedBy)
      .single();

    if (userError || !userData) {
      return failure(404, assignmentErrorCodes.unauthorized, '사용자를 찾을 수 없습니다.');
    }

    // 4. 로그 생성
    const now = new Date().toISOString();
    const { data: logData, error: logError } = await client
      .from('assignment_logs')
      .insert({
        assignment_id: assignmentId,
        changed_by: changedBy,
        previous_status: previousStatus,
        new_status: newStatus,
        change_reason: changeReason,
        metadata: metadata || {},
        created_at: now,
      })
      .select()
      .single();

    if (logError || !logData) {
      return failure(500, assignmentErrorCodes.logCreationFailed, '로그 생성에 실패했습니다.');
    }

    // 5. 응답 데이터 구성
    const response: AssignmentLog = {
      id: logData.id,
      assignmentId: logData.assignment_id,
      changedBy: logData.changed_by,
      changedByName: userData.full_name,
      previousStatus: logData.previous_status as 'draft' | 'published' | 'closed',
      newStatus: logData.new_status as 'draft' | 'published' | 'closed',
      changeReason: logData.change_reason as 'manual' | 'auto_close' | 'system',
      metadata: logData.metadata || {},
      createdAt: logData.created_at,
    };

    return success(response);

  } catch (error) {
    return failure(500, assignmentErrorCodes.databaseError, 'Assignment 로그 생성 중 오류가 발생했습니다.', error);
  }
};

/**
 * Assignment 상태 변경 이력 조회 서비스
 * 특정 Assignment의 상태 변경 이력을 시간순으로 조회합니다.
 */
export const getAssignmentLogs = async (
  client: SupabaseClient,
  params: AssignmentLogsQuery
): Promise<HandlerResult<AssignmentLogsResponse, string, unknown>> => {
  try {
    // 1. 요청 파라미터 검증
    const parsedParams = AssignmentLogsQuerySchema.safeParse(params);
    if (!parsedParams.success) {
      return failure(400, assignmentErrorCodes.validationError, '요청 파라미터가 올바르지 않습니다.');
    }

    const { assignmentId, changeReason, page, limit } = parsedParams.data;
    const offset = (page - 1) * limit;

    // 2. Assignment 존재 여부 확인
    const { data: assignmentData, error: assignmentError } = await client
      .from('assignments')
      .select('id')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      return failure(404, assignmentErrorCodes.notFound, 'Assignment를 찾을 수 없습니다.');
    }

    // 3. 로그 조회 쿼리 구성
    let query = client
      .from('assignment_logs')
      .select(`
        id,
        assignment_id,
        changed_by,
        previous_status,
        new_status,
        change_reason,
        metadata,
        created_at,
        users!inner(
          id,
          full_name
        )
      `, { count: 'exact' })
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false });

    // 4. 필터 적용
    if (changeReason) {
      query = query.eq('change_reason', changeReason);
    }

    // 5. 페이지네이션 적용
    const { data: logsData, error: logsError, count } = await query
      .range(offset, offset + limit - 1);

    if (logsError) {
      return failure(500, assignmentErrorCodes.logQueryFailed, '로그 조회 중 오류가 발생했습니다.');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // 6. 응답 데이터 구성
    const logs: AssignmentLog[] = (logsData || []).map((log: any) => ({
      id: log.id,
      assignmentId: log.assignment_id,
      changedBy: log.changed_by,
      changedByName: log.users.full_name,
      previousStatus: log.previous_status,
      newStatus: log.new_status,
      changeReason: log.change_reason,
      metadata: log.metadata || {},
      createdAt: log.created_at,
    }));

    const response: AssignmentLogsResponse = {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return success(response);

  } catch (error) {
    return failure(500, assignmentErrorCodes.databaseError, 'Assignment 로그 조회 중 오류가 발생했습니다.', error);
  }
};

/**
 * 강사별 Assignment 상태 변경 이력 조회 서비스
 * 특정 강사가 관리하는 Assignment들의 상태 변경 이력을 조회합니다.
 */
export const getInstructorAssignmentLogs = async (
  client: SupabaseClient,
  params: InstructorAssignmentLogsQuery
): Promise<HandlerResult<AssignmentLogsResponse, string, unknown>> => {
  try {
    // 1. 요청 파라미터 검증
    const parsedParams = InstructorAssignmentLogsQuerySchema.safeParse(params);
    if (!parsedParams.success) {
      return failure(400, assignmentErrorCodes.validationError, '요청 파라미터가 올바르지 않습니다.');
    }

    const { instructorId, assignmentId, changeReason, page, limit } = parsedParams.data;
    const offset = (page - 1) * limit;

    // 2. 강사 존재 여부 및 권한 확인
    const { data: instructorData, error: instructorError } = await client
      .from('users')
      .select('id, role')
      .eq('id', instructorId)
      .eq('role', 'instructor')
      .single();

    if (instructorError || !instructorData) {
      return failure(403, assignmentErrorCodes.notInstructor, '강사 권한이 없습니다.');
    }

    // 3. 로그 조회 쿼리 구성 (강사가 소유한 코스의 Assignment만)
    let query = client
      .from('assignment_logs')
      .select(`
        id,
        assignment_id,
        changed_by,
        previous_status,
        new_status,
        change_reason,
        metadata,
        created_at,
        users!inner(
          id,
          full_name
        ),
        assignments!inner(
          id,
          title,
          courses!inner(
            id,
            instructor_id
          )
        )
      `, { count: 'exact' })
      .eq('assignments.courses.instructor_id', instructorId)
      .order('created_at', { ascending: false });

    // 4. 필터 적용
    if (assignmentId) {
      query = query.eq('assignment_id', assignmentId);
    }

    if (changeReason) {
      query = query.eq('change_reason', changeReason);
    }

    // 5. 페이지네이션 적용
    const { data: logsData, error: logsError, count } = await query
      .range(offset, offset + limit - 1);

    if (logsError) {
      return failure(500, assignmentErrorCodes.logQueryFailed, '로그 조회 중 오류가 발생했습니다.');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // 6. 응답 데이터 구성
    const logs: AssignmentLog[] = (logsData || []).map((log: any) => ({
      id: log.id,
      assignmentId: log.assignment_id,
      changedBy: log.changed_by,
      changedByName: log.users.full_name,
      previousStatus: log.previous_status,
      newStatus: log.new_status,
      changeReason: log.change_reason,
      metadata: log.metadata || {},
      createdAt: log.created_at,
    }));

    const response: AssignmentLogsResponse = {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return success(response);

  } catch (error) {
    return failure(500, assignmentErrorCodes.databaseError, '강사 Assignment 로그 조회 중 오류가 발생했습니다.', error);
  }
};

/**
 * Assignment 로그 통계 조회 서비스
 * 특정 Assignment의 상태 변경 통계를 조회합니다.
 */
export const getAssignmentLogStats = async (
  client: SupabaseClient,
  assignmentId: string
): Promise<HandlerResult<{
  totalChanges: number;
  manualChanges: number;
  autoCloseChanges: number;
  systemChanges: number;
  lastChangeAt: string | null;
}, string, unknown>> => {
  try {
    // 1. Assignment 존재 여부 확인
    const { data: assignmentData, error: assignmentError } = await client
      .from('assignments')
      .select('id')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignmentData) {
      return failure(404, assignmentErrorCodes.notFound, 'Assignment를 찾을 수 없습니다.');
    }

    // 2. 통계 조회
    const { data: statsData, error: statsError } = await client
      .from('assignment_logs')
      .select('change_reason, created_at')
      .eq('assignment_id', assignmentId);

    if (statsError) {
      return failure(500, assignmentErrorCodes.logQueryFailed, '로그 통계 조회 중 오류가 발생했습니다.');
    }

    const logs = statsData || [];
    const totalChanges = logs.length;
    const manualChanges = logs.filter(log => log.change_reason === 'manual').length;
    const autoCloseChanges = logs.filter(log => log.change_reason === 'auto_close').length;
    const systemChanges = logs.filter(log => log.change_reason === 'system').length;
    const lastChangeAt = logs.length > 0 
      ? logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null;

    const response = {
      totalChanges,
      manualChanges,
      autoCloseChanges,
      systemChanges,
      lastChangeAt,
    };

    return success(response);

  } catch (error) {
    return failure(500, assignmentErrorCodes.databaseError, 'Assignment 로그 통계 조회 중 오류가 발생했습니다.', error);
  }
};
