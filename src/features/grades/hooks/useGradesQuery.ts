import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { GradesResponse } from '../lib/dto';

/**
 * 사용자의 전체 성적 조회 훅
 */
export const useGradesQuery = () => {
  return useQuery({
    queryKey: ['grades'],
    queryFn: async (): Promise<GradesResponse> => {
      const response = await apiClient.get('/api/grades');
      // 백엔드 응답 구조에 맞춰 data.data 접근
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분 (이전 cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
