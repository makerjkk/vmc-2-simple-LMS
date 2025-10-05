import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { PendingActionsResponse } from '../lib/dto';

/**
 * 처리 대기 액션 조회 훅
 */
export const usePendingActionsQuery = () => {
  return useQuery({
    queryKey: ['operator', 'actions', 'pending'],
    queryFn: async (): Promise<PendingActionsResponse> => {
      try {
        const response = await apiClient.get('/api/operator/actions/pending');
        return response.data;
      } catch (error) {
        throw new Error('처리 대기 액션 조회에 실패했습니다.');
      }
    },
    staleTime: 1000 * 60 * 2, // 2분
    gcTime: 1000 * 60 * 5, // 5분
    refetchInterval: 1000 * 60 * 2, // 2분마다 자동 새로고침
  });
};
