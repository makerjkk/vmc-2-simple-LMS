import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { InstructorDashboardResponseSchema, type InstructorDashboardResponse } from '../lib/dto';

/**
 * Instructor 대시보드 데이터를 조회하는 React Query 훅
 */
export const useInstructorDashboard = () => {
  return useQuery({
    queryKey: ['instructor-dashboard'],
    queryFn: async (): Promise<InstructorDashboardResponse> => {
      const response = await apiClient.get('/api/instructor/dashboard');
      
      // 응답 데이터 검증
      const parsedData = InstructorDashboardResponseSchema.safeParse(response.data.data);
      
      if (!parsedData.success) {
        throw new Error('Instructor 대시보드 데이터 형식이 올바르지 않습니다.');
      }
      
      return parsedData.data;
    },
    staleTime: 5 * 60 * 1000, // 5분 캐시
    refetchOnWindowFocus: true, // 윈도우 포커스 시 새로고침
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 새로고침
    refetchOnMount: true, // 마운트 시 새로고침
    retry: 3, // 실패 시 3번 재시도
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 지수 백오프
  });
};
