'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createSubmission, 
  updateSubmission,
  type CreateSubmissionRequest,
  type UpdateSubmissionRequest,
  type SubmissionResponse 
} from '@/lib/remote/api-client';

/**
 * 제출물 생성 뮤테이션 훅
 * 과제 제출 시 사용
 */
export const useSubmissionMutation = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSubmissionRequest): Promise<SubmissionResponse> => 
      createSubmission(assignmentId, data),
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['submission', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      console.error('Submission creation failed:', error);
    },
  });
};

/**
 * 제출물 업데이트 뮤테이션 훅 (재제출)
 * 과제 재제출 시 사용
 */
export const useResubmissionMutation = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSubmissionRequest): Promise<SubmissionResponse> => 
      updateSubmission(assignmentId, data),
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['submission', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => {
      console.error('Submission update failed:', error);
    },
  });
};
