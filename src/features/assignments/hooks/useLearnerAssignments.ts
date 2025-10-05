import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { LearnerAssignmentsResponse, LearnerAssignmentsQuery } from '../lib/dto';

/**
 * 학습자용 과제 목록 조회 React Query 훅
 */
export const useLearnerAssignments = (params: LearnerAssignmentsQuery = {}) => {
  return useQuery({
    queryKey: ['learner-assignments', params],
    queryFn: async (): Promise<LearnerAssignmentsResponse> => {
      const searchParams = new URLSearchParams();
      
      if (params.status) searchParams.append('status', params.status);
      if (params.courseId) searchParams.append('courseId', params.courseId);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());

      const response = await apiClient.get(`/api/assignments?${searchParams.toString()}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5분
    refetchInterval: 10 * 60 * 1000, // 10분마다 자동 갱신
  });
};
