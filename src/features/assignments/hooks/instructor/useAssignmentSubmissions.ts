'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { 
  AssignmentSubmissionsResponseSchema,
  type AssignmentSubmissionsResponse,
  type AssignmentSubmissionsQuery 
} from '../../lib/dto';
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE, SMALL_PAGE_SIZE, SINGLE_ITEM_LIMIT } from '@/constants/pagination';

/**
 * 강사용 제출물 목록 조회 쿼리 훅
 * 필터링과 페이지네이션을 지원합니다.
 */
export const useAssignmentSubmissions = (
  assignmentId: string,
  params: Omit<AssignmentSubmissionsQuery, 'assignmentId'> = {}
) => {
  const { status, isLate, page = DEFAULT_PAGE_NUMBER, limit = DEFAULT_PAGE_SIZE } = params;

  return useQuery({
    queryKey: ['assignment-submissions', assignmentId, { status, isLate, page, limit }],
    
    queryFn: async (): Promise<AssignmentSubmissionsResponse> => {
      // 쿼리 파라미터 구성
      const searchParams = new URLSearchParams();
      if (status) searchParams.set('status', status);
      if (isLate !== undefined) searchParams.set('isLate', isLate.toString());
      searchParams.set('page', page.toString());
      searchParams.set('limit', limit.toString());

      const response = await apiClient.get(
        `/api/instructor/assignments/${assignmentId}/submissions?${searchParams.toString()}`
      );

      // 응답 데이터 검증
      const parsedResponse = AssignmentSubmissionsResponseSchema.safeParse(response.data.data);
      
      if (!parsedResponse.success) {
        throw new Error('제출물 목록 응답 데이터 형식이 올바르지 않습니다.');
      }

      return parsedResponse.data;
    },

    // 캐시 설정
    staleTime: 1 * 60 * 1000, // 1분 동안 신선한 데이터로 간주 (제출물은 자주 변경됨)
    gcTime: 3 * 60 * 1000, // 3분 후 가비지 컬렉션

    // 쿼리 활성화 조건
    enabled: !!assignmentId,

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

    // 백그라운드에서 자동 새로고침 (제출물 상태 변경 감지)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 새로고침
  });
};

/**
 * 제출물 통계만 조회하는 경량 훅
 */
export const useAssignmentSubmissionStats = (assignmentId: string) => {
  return useQuery({
    queryKey: ['assignment-submission-stats', assignmentId],
    
    queryFn: async () => {
      // 첫 페이지만 조회하여 통계 정보 획득
      const response = await apiClient.get(
        `/api/instructor/assignments/${assignmentId}/submissions?page=${DEFAULT_PAGE_NUMBER}&limit=${SINGLE_ITEM_LIMIT}`
      );

      const parsedResponse = AssignmentSubmissionsResponseSchema.safeParse(response.data.data);
      
      if (!parsedResponse.success) {
        throw new Error('제출물 통계 응답 데이터 형식이 올바르지 않습니다.');
      }

      return parsedResponse.data.stats;
    },

    // 캐시 설정
    staleTime: 2 * 60 * 1000, // 2분 동안 신선한 데이터로 간주
    gcTime: 5 * 60 * 1000, // 5분 후 가비지 컬렉션

    // 쿼리 활성화 조건
    enabled: !!assignmentId,

    // 재시도 설정
    retry: 2,
    retryDelay: 1000,

    // 백그라운드에서 자동 새로고침
    refetchOnWindowFocus: true,
  });
};

/**
 * 채점이 필요한 제출물만 조회하는 훅
 */
export const usePendingGradingSubmissions = (
  assignmentId: string,
  options: { page?: number; limit?: number } = {}
) => {
  const { page = DEFAULT_PAGE_NUMBER, limit = SMALL_PAGE_SIZE } = options;

  return useQuery({
    queryKey: ['pending-grading-submissions', assignmentId, { page, limit }],
    
    queryFn: async (): Promise<AssignmentSubmissionsResponse> => {
      // 제출됨(submitted) 상태의 제출물만 조회
      const searchParams = new URLSearchParams({
        status: 'submitted',
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await apiClient.get(
        `/api/instructor/assignments/${assignmentId}/submissions?${searchParams.toString()}`
      );

      const parsedResponse = AssignmentSubmissionsResponseSchema.safeParse(response.data.data);
      
      if (!parsedResponse.success) {
        throw new Error('채점 대기 제출물 응답 데이터 형식이 올바르지 않습니다.');
      }

      return parsedResponse.data;
    },

    // 캐시 설정
    staleTime: 30 * 1000, // 30초 동안 신선한 데이터로 간주 (채점은 실시간성 중요)
    gcTime: 2 * 60 * 1000, // 2분 후 가비지 컬렉션

    // 쿼리 활성화 조건
    enabled: !!assignmentId,

    // 재시도 설정
    retry: 2,
    retryDelay: 500,

    // 백그라운드에서 자동 새로고침
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 2 * 60 * 1000, // 2분마다 자동 새로고침
  });
};
