import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { OperatorStatsResponse } from '../lib/dto';

/**
 * 운영자 대시보드 통계 조회 훅
 */
export const useOperatorStatsQuery = () => {
  return useQuery({
    queryKey: ['operator', 'stats'],
    queryFn: async (): Promise<OperatorStatsResponse> => {
      try {
        const response = await apiClient.get('/api/operator/stats');
        return response.data;
      } catch (error) {
        throw new Error('운영자 통계 조회에 실패했습니다.');
      }
    },
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
    refetchInterval: 1000 * 60 * 5, // 5분마다 자동 새로고침
  });
};
