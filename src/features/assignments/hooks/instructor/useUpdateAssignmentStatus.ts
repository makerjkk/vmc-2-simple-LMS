'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { 
  AssignmentStatusUpdateSchema,
  InstructorAssignmentResponseSchema,
  type AssignmentStatusUpdate,
  type InstructorAssignmentResponse 
} from '../../lib/dto';

/**
 * 강사용 과제 상태 전환 뮤테이션 훅
 * 과제 상태를 변경하고 관련 쿼리를 무효화합니다.
 */
export const useUpdateAssignmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      assignmentId, 
      status 
    }: { 
      assignmentId: string; 
      status: AssignmentStatusUpdate['status'] 
    }): Promise<InstructorAssignmentResponse> => {
      // 요청 데이터 검증
      const validatedData = AssignmentStatusUpdateSchema.parse({ status });
      
      const response = await apiClient.patch(
        `/api/instructor/assignments/${assignmentId}/status`,
        validatedData
      );

      // 응답 데이터 검증
      const parsedResponse = InstructorAssignmentResponseSchema.safeParse(response.data.data);
      
      if (!parsedResponse.success) {
        throw new Error('과제 상태 변경 응답 데이터 형식이 올바르지 않습니다.');
      }

      return parsedResponse.data;
    },

    onSuccess: (data) => {
      // 해당 과제의 상세 정보 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['instructor-assignment', data.id]
      });

      // 해당 코스의 과제 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['instructor-assignments', data.courseId]
      });

      // 강사 대시보드 쿼리 무효화 (통계 업데이트)
      queryClient.invalidateQueries({
        queryKey: ['instructor-dashboard']
      });

      // 상태가 변경된 과제 데이터를 캐시에 업데이트
      queryClient.setQueryData(
        ['instructor-assignment', data.id],
        data
      );

      // 과제가 게시된 경우 학습자 관련 쿼리도 무효화
      if (data.status === 'published') {
        queryClient.invalidateQueries({
          queryKey: ['assignments'] // 학습자용 과제 목록
        });
        queryClient.invalidateQueries({
          queryKey: ['dashboard'] // 학습자 대시보드
        });
      }
    },

    onError: (error) => {
      console.error('과제 상태 변경 실패:', error);
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
