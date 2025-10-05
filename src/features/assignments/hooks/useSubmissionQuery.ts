'use client';

import { useQuery } from '@tanstack/react-query';
import { getSubmission, type SubmissionResponse } from '@/lib/remote/api-client';

/**
 * 제출물 조회 쿼리 훅
 * 특정 과제의 제출물 정보를 조회
 */
export const useSubmissionQuery = (assignmentId: string) => {
  return useQuery({
    queryKey: ['submission', assignmentId],
    queryFn: (): Promise<SubmissionResponse | null> => getSubmission(assignmentId),
    enabled: Boolean(assignmentId),
    staleTime: 30 * 1000, // 30초
    gcTime: 5 * 60 * 1000, // 5분간 가비지 컬렉션 방지
    retry: (failureCount, error) => {
      // 404 에러는 재시도하지 않음 (제출물이 없는 경우)
      if (error.message.includes('404')) {
        return false;
      }
      return failureCount < 3;
    },
    refetchOnWindowFocus: true, // 윈도우 포커스 시 새로고침
  });
};
