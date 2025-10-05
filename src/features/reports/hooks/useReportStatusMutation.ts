import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { useErrorDialog } from '@/hooks/useErrorDialog';
import type { UpdateReportStatusRequest } from '../lib/dto';

/**
 * 신고 상태 변경 훅
 */
export const useReportStatusMutation = () => {
  const queryClient = useQueryClient();
  const { showErrorFromException } = useErrorDialog();

  return useMutation({
    mutationFn: async ({ reportId, data }: { reportId: string; data: UpdateReportStatusRequest }) => {
      try {
        const response = await apiClient.patch(`/api/reports/${reportId}`, data);
        return response.data;
      } catch (error) {
        throw new Error('신고 상태 변경에 실패했습니다.');
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
      showErrorFromException(error, '신고 상태 변경 실패');
    },
  });
};
