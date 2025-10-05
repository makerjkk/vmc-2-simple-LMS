import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { DashboardResponseSchema, type DashboardResponse } from '../lib/dto';

/**
 * 대시보드 데이터를 조회하는 React Query 훅
 */
export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<DashboardResponse> => {
      const response = await apiClient.get('/api/dashboard');
      
      // 응답 데이터 검증
      const parsedData = DashboardResponseSchema.safeParse(response.data.data);
      
      if (!parsedData.success) {
        throw new Error('대시보드 데이터 형식이 올바르지 않습니다.');
      }
      
      return parsedData.data;
    },
    staleTime: 0, // 항상 최신 데이터 조회
    refetchOnWindowFocus: true, // 윈도우 포커스 시 새로고침
    refetchOnMount: true, // 마운트 시 새로고침
    retry: 3, // 실패 시 3번 재시도
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 지수 백오프
  });
};
