'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { 
  InstructorAssignmentsResponseSchema,
  type InstructorAssignmentsResponse,
  type InstructorAssignmentsQuery 
} from '../../lib/dto';

/**
 * 강사용 과제 목록 조회 쿼리 훅
 * 페이지네이션과 필터링을 지원합니다.
 */
export const useInstructorAssignments = (
  courseId: string,
  params: Omit<InstructorAssignmentsQuery, 'courseId'> = {}
) => {
  const { status, page = 1, limit = 20 } = params;

  return useQuery({
    queryKey: ['instructor-assignments', courseId, { status, page, limit }],
    
    queryFn: async (): Promise<InstructorAssignmentsResponse> => {
      // 쿼리 파라미터 구성
      const searchParams = new URLSearchParams();
      if (status) searchParams.set('status', status);
      searchParams.set('page', page.toString());
      searchParams.set('limit', limit.toString());

      const response = await apiClient.get(
        `/api/instructor/courses/${courseId}/assignments?${searchParams.toString()}`
      );

      // 응답 데이터 검증
      const parsedResponse = InstructorAssignmentsResponseSchema.safeParse(response.data.data);
      
      if (!parsedResponse.success) {
        throw new Error('과제 목록 응답 데이터 형식이 올바르지 않습니다.');
      }

      return parsedResponse.data;
    },

    // 캐시 설정
    staleTime: 2 * 60 * 1000, // 2분 동안 신선한 데이터로 간주
    gcTime: 5 * 60 * 1000, // 5분 후 가비지 컬렉션

    // 쿼리 활성화 조건
    enabled: !!courseId,

    // 재시도 설정
    retry: (failureCount, error: any) => {
      // 클라이언트 에러(4xx)는 재시도하지 않음
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },

    // 재시도 간격 (지수 백오프)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // 백그라운드에서 자동 새로고침
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

/**
 * 특정 상태의 과제 개수를 조회하는 훅
 */
export const useInstructorAssignmentCounts = (courseId: string) => {
  return useQuery({
    queryKey: ['instructor-assignment-counts', courseId],
    
    queryFn: async () => {
      // 각 상태별로 첫 페이지만 조회하여 총 개수 확인
      const [draftResponse, publishedResponse, closedResponse] = await Promise.all([
        apiClient.get(`/api/instructor/courses/${courseId}/assignments?status=draft&page=1&limit=1`),
        apiClient.get(`/api/instructor/courses/${courseId}/assignments?status=published&page=1&limit=1`),
        apiClient.get(`/api/instructor/courses/${courseId}/assignments?status=closed&page=1&limit=1`)
      ]);

      return {
        draft: draftResponse.data.data.pagination.total || 0,
        published: publishedResponse.data.data.pagination.total || 0,
        closed: closedResponse.data.data.pagination.total || 0,
        total: (draftResponse.data.data.pagination.total || 0) + 
               (publishedResponse.data.data.pagination.total || 0) + 
               (closedResponse.data.data.pagination.total || 0)
      };
    },

    // 캐시 설정
    staleTime: 5 * 60 * 1000, // 5분 동안 신선한 데이터로 간주
    gcTime: 10 * 60 * 1000, // 10분 후 가비지 컬렉션

    // 쿼리 활성화 조건
    enabled: !!courseId,

    // 재시도 설정
    retry: 2,
    retryDelay: 1000,
  });
};
