'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

/**
 * 강사용 과제 삭제 뮤테이션 훅
 * 과제를 삭제하고 관련 쿼리를 무효화합니다.
 */
export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      assignmentId,
      courseId 
    }: { 
      assignmentId: string;
      courseId: string;
    }): Promise<{ success: boolean }> => {
      const response = await apiClient.delete(
        `/api/instructor/assignments/${assignmentId}`
      );

      // 응답 확인
      if (!response.data?.data?.success) {
        throw new Error('과제 삭제에 실패했습니다.');
      }

      return { success: true };
    },

    onSuccess: (_, variables) => {
      // 삭제된 과제의 상세 정보 쿼리 제거
      queryClient.removeQueries({
        queryKey: ['instructor-assignment', variables.assignmentId]
      });

      // 해당 코스의 과제 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['instructor-assignments', variables.courseId]
      });

      // 강사 대시보드 쿼리 무효화 (통계 업데이트)
      queryClient.invalidateQueries({
        queryKey: ['instructor-dashboard']
      });

      // 과제 제출물 관련 쿼리들 제거
      queryClient.removeQueries({
        queryKey: ['assignment-submissions', variables.assignmentId]
      });
    },

    onError: (error) => {
      console.error('과제 삭제 실패:', error);
    },

    // 재시도 설정
    retry: (failureCount, error: any) => {
      // 클라이언트 에러(4xx)는 재시도하지 않음
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },

    // 재시도 간격 (지수 백오프)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
