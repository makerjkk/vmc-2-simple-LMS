import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { AssignmentLogsResponse, AssignmentLogsQuery } from '../../lib/logs-dto';
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_NUMBER } from '@/constants/pagination';

/**
 * Assignment 상태 변경 로그 조회 훅
 */
export const useAssignmentLogs = (params: AssignmentLogsQuery) => {
  return useQuery({
    queryKey: ['assignment-logs', params.assignmentId, params.changeReason, params.page, params.limit],
    queryFn: async (): Promise<AssignmentLogsResponse> => {
      const searchParams = new URLSearchParams();
      if (params.changeReason) {
        searchParams.append('changeReason', params.changeReason);
      }
      searchParams.append('page', params.page.toString());
      searchParams.append('limit', params.limit.toString());

      const response = await apiClient.get(
        `/api/assignments/logs/${params.assignmentId}?${searchParams.toString()}`
      );

      if (response.status !== 200) {
        throw new Error('Assignment 로그 조회에 실패했습니다.');
      }

      return response.data;
    },
    enabled: !!params.assignmentId,
    staleTime: 30 * 1000, // 30초
    gcTime: 5 * 60 * 1000, // 5분
  });
};

/**
 * 강사별 Assignment 로그 조회 훅
 */
export const useInstructorAssignmentLogs = (params: {
  instructorId: string;
  assignmentId?: string;
  changeReason?: 'manual' | 'auto_close' | 'system';
  page?: number;
  limit?: number;
}) => {
  const { instructorId, assignmentId, changeReason, page = DEFAULT_PAGE_NUMBER, limit = DEFAULT_PAGE_SIZE } = params;

  return useQuery({
    queryKey: ['instructor-assignment-logs', instructorId, assignmentId, changeReason, page, limit],
    queryFn: async (): Promise<AssignmentLogsResponse> => {
      const searchParams = new URLSearchParams();
      if (assignmentId) {
        searchParams.append('assignmentId', assignmentId);
      }
      if (changeReason) {
        searchParams.append('changeReason', changeReason);
      }
      searchParams.append('page', page.toString());
      searchParams.append('limit', limit.toString());

      const response = await apiClient.get(
        `/api/assignments/logs/instructor/${instructorId}?${searchParams.toString()}`
      );

      if (response.status !== 200) {
        throw new Error('강사 Assignment 로그 조회에 실패했습니다.');
      }

      return response.data;
    },
    enabled: !!instructorId,
    staleTime: 30 * 1000, // 30초
    gcTime: 5 * 60 * 1000, // 5분
  });
};
