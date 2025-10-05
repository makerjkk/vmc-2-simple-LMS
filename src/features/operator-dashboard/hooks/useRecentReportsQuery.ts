import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { RecentReportsResponse } from '../lib/dto';

/**
 * 최근 신고 목록 조회 훅
 */
export const useRecentReportsQuery = (limit: number = 10) => {
  return useQuery({
    queryKey: ['operator', 'reports', 'recent', limit],
    queryFn: async (): Promise<RecentReportsResponse> => {
      try {
        const response = await apiClient.get(`/api/operator/reports/recent?limit=${limit}`);
        return response.data;
      } catch (error) {
        throw new Error('최근 신고 목록 조회에 실패했습니다.');
      }
    },
    staleTime: 1000 * 60 * 2, // 2분
    gcTime: 1000 * 60 * 5, // 5분
    refetchInterval: 1000 * 60 * 2, // 2분마다 자동 새로고침
  });
};
