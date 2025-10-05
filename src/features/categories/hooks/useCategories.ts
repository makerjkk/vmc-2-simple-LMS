import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { CategoriesResponseSchema, type CategoriesResponse } from '../lib/dto';

/**
 * 활성 카테고리 목록을 조회하는 React Query 훅
 */
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<CategoriesResponse> => {
      try {
        console.log('카테고리 API 호출 시작:', '/api/categories');
        const response = await apiClient.get('/api/categories');
        console.log('카테고리 API 응답:', response.data);
        
        // 백엔드에서 { data: ... } 구조로 응답하므로 response.data.data를 사용
        const parsedData = CategoriesResponseSchema.safeParse(response.data.data);
        
        if (!parsedData.success) {
          console.error('카테고리 데이터 검증 실패:', parsedData.error);
          console.error('실제 응답 데이터:', response.data);
          throw new Error('카테고리 데이터 형식이 올바르지 않습니다.');
        }
        
        console.log('카테고리 데이터 검증 성공:', parsedData.data);
        return parsedData.data;
      } catch (error) {
        console.error('카테고리 API 호출 실패:', error);
        const message = extractApiErrorMessage(error, '카테고리를 불러오는 중 오류가 발생했습니다.');
        throw new Error(message);
      }
    },
    staleTime: 10 * 60 * 1000, // 10분 캐시 (카테고리는 자주 변경되지 않음)
    refetchOnWindowFocus: false, // 윈도우 포커스 시 새로고침 안함
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
