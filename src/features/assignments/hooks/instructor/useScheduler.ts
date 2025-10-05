import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { SchedulerStatus, AutoCloseResult, ManualTriggerRequest } from '../../lib/logs-dto';

/**
 * 스케줄러 상태 조회 훅
 */
export const useSchedulerStatus = () => {
  return useQuery({
    queryKey: ['scheduler-status'],
    queryFn: async (): Promise<SchedulerStatus> => {
      const response = await apiClient.get('/api/assignments/scheduler/status');

      if (response.status !== 200) {
        throw new Error('스케줄러 상태 조회에 실패했습니다.');
      }

      return response.data;
    },
    refetchInterval: 30 * 1000, // 30초마다 자동 새로고침
    staleTime: 10 * 1000, // 10초
    gcTime: 2 * 60 * 1000, // 2분
  });
};

/**
 * 스케줄러 통계 조회 훅
 */
export const useSchedulerStats = (days: number = 30) => {
  return useQuery({
    queryKey: ['scheduler-stats', days],
    queryFn: async (): Promise<{
      totalProcessed: number;
      totalErrors: number;
      averageProcessingTime: number;
      lastNDaysActivity: Array<{
        date: string;
        processed: number;
        errors: number;
      }>;
    }> => {
      const response = await apiClient.get(`/api/assignments/scheduler/stats?days=${days}`);

      if (response.status !== 200) {
        throw new Error('스케줄러 통계 조회에 실패했습니다.');
      }

      return response.data;
    },
    enabled: days > 0 && days <= 365,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 수동 스케줄러 실행 훅
 */
export const useManualTriggerScheduler = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ManualTriggerRequest): Promise<AutoCloseResult> => {
      const response = await apiClient.post('/api/assignments/scheduler/trigger', data);

      if (response.status !== 200) {
        throw new Error(response.data?.error?.message || '수동 스케줄러 실행에 실패했습니다.');
      }

      return response.data;
    },
    onSuccess: (data) => {
      // 스케줄러 상태 및 통계 새로고침
      queryClient.invalidateQueries({ queryKey: ['scheduler-status'] });
      queryClient.invalidateQueries({ queryKey: ['scheduler-stats'] });
      
      // Assignment 목록도 새로고침 (상태가 변경되었을 수 있음)
      queryClient.invalidateQueries({ queryKey: ['instructor-assignments'] });
      
      // 로그 목록도 새로고침
      queryClient.invalidateQueries({ queryKey: ['assignment-logs'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-assignment-logs'] });

      console.log(`스케줄러 실행 완료: ${data.processedCount}개 Assignment 처리됨`);
    },
    onError: (error) => {
      console.error('수동 스케줄러 실행 실패:', error);
    },
  });
};

/**
 * 자동 마감 처리 훅 (시스템용)
 */
export const useAutoCloseAssignments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: { dryRun?: boolean; batchSize?: number } = {}): Promise<AutoCloseResult> => {
      const response = await apiClient.post('/api/assignments/scheduler/auto-close', options);

      if (response.status !== 200) {
        throw new Error(response.data?.error?.message || '자동 마감 처리에 실패했습니다.');
      }

      return response.data;
    },
    onSuccess: (data, variables) => {
      // dry run이 아닌 경우에만 캐시 무효화
      if (!variables.dryRun) {
        queryClient.invalidateQueries({ queryKey: ['scheduler-status'] });
        queryClient.invalidateQueries({ queryKey: ['scheduler-stats'] });
        queryClient.invalidateQueries({ queryKey: ['instructor-assignments'] });
        queryClient.invalidateQueries({ queryKey: ['assignment-logs'] });
        queryClient.invalidateQueries({ queryKey: ['instructor-assignment-logs'] });
      }

      console.log(`자동 마감 처리 완료: ${data.processedCount}개 Assignment 처리됨`);
    },
    onError: (error) => {
      console.error('자동 마감 처리 실패:', error);
    },
  });
};
