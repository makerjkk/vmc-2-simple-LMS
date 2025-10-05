'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { AssignmentDetailResponseSchema } from '../lib/dto';

/**
 * 과제 상세 정보 조회를 위한 API 호출 함수
 */
const fetchAssignment = async (assignmentId: string) => {
  try {
    const { data } = await apiClient.get(`/api/assignments/${assignmentId}`);
    return AssignmentDetailResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch assignment details.');
    throw new Error(message);
  }
};

/**
 * 과제 상세 조회 훅
 * 과제 정보와 제출 상태를 함께 조회
 */
export const useAssignmentQuery = (assignmentId: string) => {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => fetchAssignment(assignmentId),
    enabled: Boolean(assignmentId),
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 방지
    retry: (failureCount, error) => {
      // 404, 403 에러는 재시도하지 않음
      if (error.message.includes('404') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};
