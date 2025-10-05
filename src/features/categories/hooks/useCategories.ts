import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { CategoriesResponseSchema, type CategoriesResponse } from '../lib/dto';

/**
 * 활성 카테고리 목록을 조회하는 React Query 훅
 */
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<CategoriesResponse> => {
      const response = await apiClient.get('/api/categories');
      
      // 응답 데이터 검증
      const parsedData = CategoriesResponseSchema.safeParse(response.data.data);
      
      if (!parsedData.success) {
        throw new Error('카테고리 데이터 형식이 올바르지 않습니다.');
      }
      
      return parsedData.data;
    },
    staleTime: 10 * 60 * 1000, // 10분 캐시 (카테고리는 자주 변경되지 않음)
    refetchOnWindowFocus: false, // 윈도우 포커스 시 새로고침 안함
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
