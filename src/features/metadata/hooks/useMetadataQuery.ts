import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CategoriesListResponse, CategoryResponse, CategoryUsageResponse, DifficultyMetadataResponse } from '../lib/dto';

/**
 * 카테고리 목록 조회 훅
 */
export const useCategoriesQuery = () => {
  return useQuery({
    queryKey: ['metadata', 'categories'],
    queryFn: async (): Promise<CategoriesListResponse> => {
      try {
        const response = await apiClient.get('/api/metadata/categories');
        return response.data;
      } catch (error) {
        throw new Error('카테고리 목록 조회에 실패했습니다.');
      }
    },
    staleTime: 1000 * 60 * 10, // 10분
    gcTime: 1000 * 60 * 30, // 30분
  });
};

/**
 * 카테고리 상세 조회 훅
 */
export const useCategoryQuery = (categoryId: string) => {
  return useQuery({
    queryKey: ['metadata', 'categories', categoryId],
    queryFn: async (): Promise<CategoryResponse> => {
      try {
        const response = await apiClient.get(`/api/metadata/categories/${categoryId}`);
        return response.data;
      } catch (error) {
        throw new Error('카테고리 상세 조회에 실패했습니다.');
      }
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 10, // 10분
    gcTime: 1000 * 60 * 30, // 30분
  });
};

/**
 * 카테고리 사용 현황 조회 훅
 */
export const useCategoryUsageQuery = (categoryId: string) => {
  return useQuery({
    queryKey: ['metadata', 'categories', categoryId, 'usage'],
    queryFn: async (): Promise<CategoryUsageResponse> => {
      try {
        const response = await apiClient.get(`/api/metadata/categories/${categoryId}/usage`);
        return response.data;
      } catch (error) {
        throw new Error('카테고리 사용 현황 조회에 실패했습니다.');
      }
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 15, // 15분
  });
};

/**
 * 난이도 메타데이터 조회 훅
 */
export const useDifficultyMetadataQuery = () => {
  return useQuery({
    queryKey: ['metadata', 'difficulties'],
    queryFn: async (): Promise<DifficultyMetadataResponse> => {
      try {
        const response = await apiClient.get('/api/metadata/difficulties');
        return response.data;
      } catch (error) {
        throw new Error('난이도 메타데이터 조회에 실패했습니다.');
      }
    },
    staleTime: 1000 * 60 * 30, // 30분
    gcTime: 1000 * 60 * 60, // 1시간
  });
};
