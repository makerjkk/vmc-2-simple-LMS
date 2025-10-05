import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { useErrorDialog } from '@/hooks/useErrorDialog';
import type { CreateCategoryRequest, UpdateCategoryRequest } from '../lib/dto';

/**
 * 카테고리 생성 훅
 */
export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();
  const { showErrorFromException } = useErrorDialog();

  return useMutation({
    mutationFn: async (data: CreateCategoryRequest) => {
      try {
        const response = await apiClient.post('/api/metadata/categories', data);
        return response.data;
      } catch (error) {
        throw new Error('카테고리 생성에 실패했습니다.');
      }
    },
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['metadata', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] }); // 기존 categories 쿼리도 무효화
    },
    onError: (error) => {
      showErrorFromException(error, '카테고리 생성 실패');
    },
  });
};

/**
 * 카테고리 수정 훅
 */
export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();
  const { showErrorFromException } = useErrorDialog();

  return useMutation({
    mutationFn: async ({ categoryId, data }: { categoryId: string; data: UpdateCategoryRequest }) => {
      try {
        const response = await apiClient.patch(`/api/metadata/categories/${categoryId}`, data);
        return response.data;
      } catch (error) {
        throw new Error('카테고리 수정에 실패했습니다.');
      }
    },
    onSuccess: (_, { categoryId }) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['metadata', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['metadata', 'categories', categoryId] });
      queryClient.invalidateQueries({ queryKey: ['metadata', 'categories', categoryId, 'usage'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] }); // 기존 categories 쿼리도 무효화
    },
    onError: (error) => {
      showErrorFromException(error, '카테고리 수정 실패');
    },
  });
};

/**
 * 카테고리 삭제 훅
 */
export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();
  const { showErrorFromException } = useErrorDialog();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      try {
        const response = await apiClient.delete(`/api/metadata/categories/${categoryId}`);
        return response.data;
      } catch (error) {
        throw new Error('카테고리 삭제에 실패했습니다.');
      }
    },
    onSuccess: (_, categoryId) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['metadata', 'categories'] });
      queryClient.removeQueries({ queryKey: ['metadata', 'categories', categoryId] });
      queryClient.removeQueries({ queryKey: ['metadata', 'categories', categoryId, 'usage'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] }); // 기존 categories 쿼리도 무효화
    },
    onError: (error) => {
      showErrorFromException(error, '카테고리 삭제 실패');
    },
  });
};
