import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import {
  reportsErrorCodes,
  reportActionsErrorCodes,
  type ReportsServiceError,
  type ReportActionsServiceError,
} from './error';
import type {
  ReportsQueryParams,
  ReportsListResponse,
  ReportDetailResponse,
  UpdateReportStatusRequest,
  ExecuteReportActionRequest,
  ReportActionResponse,
} from './schema';

/**
 * 신고 목록 조회
 */
export const getReports = async (
  supabase: SupabaseClient,
  params: ReportsQueryParams
): Promise<HandlerResult<ReportsListResponse, ReportsServiceError>> => {
  try {
    const { page, limit, status, reportedType, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;

    // 기본 쿼리 구성
    let query = supabase
      .from('reports')
      .select(`
        id,
        reporter_id,
        reported_type,
        reported_id,
        reason,
        content,
        status,
        action_taken,
        handled_by,
        handled_at,
        created_at,
        updated_at,
        reporter:users!reports_reporter_id_fkey(full_name),
        handler:users!reports_handled_by_fkey(full_name)
      `);

    // 필터 적용
    if (status) {
      query = query.eq('status', status);
    }
    if (reportedType) {
      query = query.eq('reported_type', reportedType);
    }

    // 정렬 적용
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // 페이지네이션 적용
    query = query.range(offset, offset + limit - 1);

    const { data: reports, error, count } = await query;

    if (error) {
      return failure(500, reportsErrorCodes.fetchError, '신고 목록 조회 중 오류가 발생했습니다.', error);
    }

    // 전체 개수 조회
    const { count: totalCount, error: countError } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq(status ? 'status' : 'id', status || reports?.[0]?.id || '');

    if (countError && !status) {
      // 전체 개수 조회를 위한 별도 쿼리
      const { count: allCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });
      
      const total = allCount || 0;
      const totalPages = Math.ceil(total / limit);

      return success({
        reports: reports?.map(report => ({
          id: report.id,
          reporterId: report.reporter_id,
          reporterName: (report.reporter as any)?.full_name || '알 수 없음',
          reportedType: report.reported_type,
          reportedId: report.reported_id,
          reportedTitle: null, // 별도 조회 필요
          reason: report.reason,
          content: report.content,
          status: report.status,
          actionTaken: report.action_taken,
          handledBy: report.handled_by,
          handledByName: (report.handler as any)?.full_name || null,
          handledAt: report.handled_at,
          createdAt: report.created_at,
          updatedAt: report.updated_at,
        })) || [],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    }

    const total = totalCount || 0;
    const totalPages = Math.ceil(total / limit);

    return success({
      reports: reports?.map(report => ({
        id: report.id,
        reporterId: report.reporter_id,
        reporterName: (report.reporter as any)?.full_name || '알 수 없음',
        reportedType: report.reported_type,
        reportedId: report.reported_id,
        reportedTitle: null, // 별도 조회 필요
        reason: report.reason,
        content: report.content,
        status: report.status,
        actionTaken: report.action_taken,
        handledBy: report.handled_by,
        handledByName: (report.handler as any)?.full_name || null,
        handledAt: report.handled_at,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
      })) || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });

  } catch (error) {
    return failure(500, reportsErrorCodes.databaseError, '데이터베이스 오류가 발생했습니다.', error);
  }
};

/**
 * 신고 상세 조회 (액션 히스토리 포함)
 */
export const getReportById = async (
  supabase: SupabaseClient,
  reportId: string
): Promise<HandlerResult<ReportDetailResponse, ReportsServiceError>> => {
  try {
    // 신고 기본 정보 조회
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        id,
        reporter_id,
        reported_type,
        reported_id,
        reason,
        content,
        status,
        action_taken,
        handled_by,
        handled_at,
        created_at,
        updated_at,
        reporter:users!reports_reporter_id_fkey(full_name),
        handler:users!reports_handled_by_fkey(full_name)
      `)
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return failure(404, reportsErrorCodes.reportNotFound, '신고를 찾을 수 없습니다.');
    }

    // 액션 히스토리 조회
    const { data: actions, error: actionsError } = await supabase
      .from('report_actions')
      .select(`
        id,
        report_id,
        action_type,
        action_details,
        performed_by,
        performed_at,
        performer:users!report_actions_performed_by_fkey(full_name)
      `)
      .eq('report_id', reportId)
      .order('performed_at', { ascending: false });

    if (actionsError) {
      return failure(500, reportsErrorCodes.fetchError, '액션 히스토리 조회 중 오류가 발생했습니다.', actionsError);
    }

    return success({
      id: report.id,
      reporterId: report.reporter_id,
      reporterName: (report.reporter as any)?.full_name || '알 수 없음',
      reportedType: report.reported_type,
      reportedId: report.reported_id,
      reportedTitle: null, // 별도 조회 필요
      reason: report.reason,
      content: report.content,
      status: report.status,
      actionTaken: report.action_taken,
      handledBy: report.handled_by,
      handledByName: (report.handler as any)?.full_name || null,
      handledAt: report.handled_at,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      actions: actions?.map(action => ({
        id: action.id,
        reportId: action.report_id,
        actionType: action.action_type,
        actionDetails: action.action_details,
        performedBy: action.performed_by,
        performedByName: (action.performer as any)?.full_name || '알 수 없음',
        performedAt: action.performed_at,
      })) || [],
    });

  } catch (error) {
    return failure(500, reportsErrorCodes.databaseError, '데이터베이스 오류가 발생했습니다.', error);
  }
};

/**
 * 신고 상태 업데이트
 */
export const updateReportStatus = async (
  supabase: SupabaseClient,
  reportId: string,
  updateData: UpdateReportStatusRequest,
  operatorId: string
): Promise<HandlerResult<{ success: boolean }, ReportsServiceError>> => {
  try {
    // 신고 존재 여부 확인
    const { data: existingReport, error: fetchError } = await supabase
      .from('reports')
      .select('id, status')
      .eq('id', reportId)
      .single();

    if (fetchError || !existingReport) {
      return failure(404, reportsErrorCodes.reportNotFound, '신고를 찾을 수 없습니다.');
    }

    // 상태 전환 유효성 검사
    const currentStatus = existingReport.status;
    const newStatus = updateData.status;

    if (currentStatus === newStatus) {
      return failure(400, reportsErrorCodes.statusTransitionError, '이미 해당 상태입니다.');
    }

    // 상태 전환 규칙 검증
    if (currentStatus === 'resolved') {
      return failure(400, reportsErrorCodes.statusTransitionError, '이미 해결된 신고는 상태를 변경할 수 없습니다.');
    }

    // 상태 업데이트
    const updateFields: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'investigating') {
      updateFields.handled_by = operatorId;
      updateFields.handled_at = new Date().toISOString();
    } else if (newStatus === 'resolved') {
      updateFields.handled_by = operatorId;
      updateFields.handled_at = new Date().toISOString();
      if (updateData.actionTaken) {
        updateFields.action_taken = updateData.actionTaken;
      }
    }

    const { error: updateError } = await supabase
      .from('reports')
      .update(updateFields)
      .eq('id', reportId);

    if (updateError) {
      return failure(500, reportsErrorCodes.databaseError, '신고 상태 업데이트 중 오류가 발생했습니다.', updateError);
    }

    return success({ success: true });

  } catch (error) {
    return failure(500, reportsErrorCodes.databaseError, '데이터베이스 오류가 발생했습니다.', error);
  }
};

/**
 * 신고 처리 액션 실행
 */
export const executeReportAction = async (
  supabase: SupabaseClient,
  reportId: string,
  actionData: ExecuteReportActionRequest,
  operatorId: string
): Promise<HandlerResult<ReportActionResponse, ReportActionsServiceError>> => {
  try {
    // 신고 존재 여부 확인
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, status, reported_type, reported_id')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return failure(404, reportActionsErrorCodes.targetNotFound, '신고를 찾을 수 없습니다.');
    }

    // 액션 실행 가능 여부 확인
    if (report.status === 'resolved') {
      return failure(400, reportActionsErrorCodes.targetAlreadyProcessed, '이미 해결된 신고에는 액션을 실행할 수 없습니다.');
    }

    // 액션 세부 정보 구성
    const actionDetails = {
      reason: actionData.reason,
      reportedType: report.reported_type,
      reportedId: report.reported_id,
      ...actionData.actionDetails,
    };

    // 액션 로그 생성
    const { data: actionLog, error: actionError } = await supabase
      .from('report_actions')
      .insert({
        report_id: reportId,
        action_type: actionData.actionType,
        action_details: actionDetails,
        performed_by: operatorId,
      })
      .select(`
        id,
        report_id,
        action_type,
        action_details,
        performed_by,
        performed_at,
        performer:users!report_actions_performed_by_fkey(full_name)
      `)
      .single();

    if (actionError || !actionLog) {
      return failure(500, reportActionsErrorCodes.actionExecutionFailed, '액션 실행 중 오류가 발생했습니다.', actionError);
    }

    // 실제 액션 실행 (비즈니스 로직)
    await executeBusinessAction(supabase, actionData.actionType, report.reported_type, report.reported_id, actionDetails);

    return success({
      id: actionLog.id,
      reportId: actionLog.report_id,
      actionType: actionLog.action_type,
      actionDetails: actionLog.action_details,
      performedBy: actionLog.performed_by,
      performedByName: (actionLog.performer as any)?.full_name || '알 수 없음',
      performedAt: actionLog.performed_at,
    });

  } catch (error) {
    return failure(500, reportActionsErrorCodes.actionExecutionFailed, '액션 실행 중 오류가 발생했습니다.', error);
  }
};

/**
 * 실제 비즈니스 액션 실행
 */
const executeBusinessAction = async (
  supabase: SupabaseClient,
  actionType: string,
  reportedType: string,
  reportedId: string,
  actionDetails: any
): Promise<void> => {
  switch (actionType) {
    case 'warn':
      // 경고 처리 - 사용자에게 경고 알림 (구현 필요)
      break;
      
    case 'invalidate_submission':
      // 제출물 무효화
      if (reportedType === 'submission') {
        await supabase
          .from('submissions')
          .update({ 
            status: 'resubmission_required',
            feedback: `운영진에 의해 무효화됨: ${actionDetails.reason}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', reportedId);
      }
      break;
      
    case 'restrict_account':
      // 계정 제한 - 사용자 상태 변경 (구현 필요)
      // 실제 구현에서는 별도 테이블이나 플래그 필요
      break;
      
    case 'dismiss':
      // 신고 기각 - 별도 처리 없음
      break;
      
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
};
