import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { useErrorDialog } from '@/hooks/useErrorDialog';
import type { ExecuteReportActionRequest } from '../lib/dto';

/**
 * 신고 처리 액션 실행 훅
 */
export const useReportActionMutation = () => {
  const queryClient = useQueryClient();
  const { showErrorFromException } = useErrorDialog();

  return useMutation({
    mutationFn: async ({ reportId, data }: { reportId: string; data: ExecuteReportActionRequest }) => {
      try {
        const response = await apiClient.post(`/api/reports/${reportId}/actions`, data);
        return response.data;
      } catch (error) {
        throw new Error('신고 처리 액션 실행에 실패했습니다.');
      }
    },
    onSuccess: (_, { reportId }) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports', reportId] });
      queryClient.invalidateQueries({ queryKey: ['operator', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['operator', 'reports', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['operator', 'actions', 'pending'] });
    },
    onError: (error) => {
      showErrorFromException(error, '신고 조치 실행 실패');
    },
  });
};
