'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { 
  GradeSubmissionRequestSchema,
  GradeSubmissionResponseSchema,
  type GradeSubmissionRequest,
  type GradeSubmissionResponse 
} from '../../lib/dto';

/**
 * 제출물 채점 뮤테이션 훅
 * 강사가 제출물에 점수와 피드백을 부여하거나 재제출을 요청
 */
export const useSubmissionGrading = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      submissionId, 
      data 
    }: { 
      submissionId: string; 
      data: GradeSubmissionRequest 
    }): Promise<GradeSubmissionResponse> => {
      // 요청 데이터 검증
      const validatedData = GradeSubmissionRequestSchema.parse(data);
      
      const response = await apiClient.post(
        `/api/instructor/submissions/${submissionId}/grade`,
        validatedData
      );

      // 응답 데이터 검증
      const parsedResponse = GradeSubmissionResponseSchema.safeParse(response.data.data);
      
      if (!parsedResponse.success) {
        throw new Error('채점 응답 데이터 형식이 올바르지 않습니다.');
      }

      return parsedResponse.data;
    },

    onSuccess: (data, variables) => {
      // 해당 제출물의 상세 정보 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['submission-grading', variables.submissionId]
      });

      // 과제별 제출물 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['assignment-submissions-grading', data.assignmentId]
      });

      // 강사 대시보드 쿼리 무효화 (통계 업데이트)
      queryClient.invalidateQueries({
        queryKey: ['instructor-dashboard']
      });

      // 성적 관련 쿼리 무효화 (학습자 성적 업데이트)
      queryClient.invalidateQueries({
        queryKey: ['grades', data.learnerId]
      });

      // 채점된 제출물 데이터를 캐시에 업데이트
      queryClient.setQueryData(
        ['submission-grading', variables.submissionId],
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            status: data.status,
            score: data.score,
            feedback: data.feedback,
            gradedAt: data.gradedAt,
            gradedBy: data.gradedBy,
          };
        }
      );
    },

    onError: (error) => {
      console.error('제출물 채점 실패:', error);
    },

    // 재시도 설정
    retry: (failureCount, error: any) => {
      // 클라이언트 에러(4xx)는 재시도하지 않음
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 2; // 최대 2번 재시도
    },

    // 재시도 간격 (지수 백오프)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * 여러 제출물 일괄 채점 뮤테이션 훅
 * 동일한 점수와 피드백으로 여러 제출물을 일괄 채점
 */
export const useBulkSubmissionGrading = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      submissionIds, 
      data 
    }: { 
      submissionIds: string[]; 
      data: GradeSubmissionRequest 
    }): Promise<GradeSubmissionResponse[]> => {
      // 요청 데이터 검증
      const validatedData = GradeSubmissionRequestSchema.parse(data);
      
      // 각 제출물에 대해 순차적으로 채점 요청
      const results = await Promise.all(
        submissionIds.map(async (submissionId) => {
          const response = await apiClient.post(
            `/api/instructor/submissions/${submissionId}/grade`,
            validatedData
          );

          const parsedResponse = GradeSubmissionResponseSchema.safeParse(response.data.data);
          
          if (!parsedResponse.success) {
            throw new Error(`제출물 ${submissionId} 채점 응답 데이터 형식이 올바르지 않습니다.`);
          }

          return parsedResponse.data;
        })
      );

      return results;
    },

    onSuccess: (results, variables) => {
      // 각 제출물의 상세 정보 쿼리 무효화
      variables.submissionIds.forEach(submissionId => {
        queryClient.invalidateQueries({
          queryKey: ['submission-grading', submissionId]
        });
      });

      // 관련된 과제들의 제출물 목록 쿼리 무효화
      const assignmentIds = [...new Set(results.map(r => r.assignmentId))];
      assignmentIds.forEach(assignmentId => {
        queryClient.invalidateQueries({
          queryKey: ['assignment-submissions-grading', assignmentId]
        });
      });

      // 강사 대시보드 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['instructor-dashboard']
      });

      // 관련된 학습자들의 성적 쿼리 무효화
      const learnerIds = [...new Set(results.map(r => r.learnerId))];
      learnerIds.forEach(learnerId => {
        queryClient.invalidateQueries({
          queryKey: ['grades', learnerId]
        });
      });
    },

    onError: (error) => {
      console.error('일괄 채점 실패:', error);
    },

    // 재시도 설정 (일괄 처리는 재시도하지 않음)
    retry: false,
  });
};
