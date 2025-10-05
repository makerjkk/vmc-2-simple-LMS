'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { 
  SubmissionsForGradingResponseSchema,
  type SubmissionsForGradingResponse 
} from '../../lib/dto';

/**
 * 채점용 제출물 목록 조회 쿼리 훅
 * 과제별 제출물 목록을 채점에 필요한 정보와 함께 조회
 */
export const useAssignmentSubmissionsGrading = (
  assignmentId: string,
  params: {
    status?: 'submitted' | 'graded' | 'resubmission_required';
    isLate?: boolean;
    page?: number;
    limit?: number;
  } = {}
) => {
  const { status, isLate, page = 1, limit = 20 } = params;

  return useQuery({
    queryKey: ['assignment-submissions-grading', assignmentId, { status, isLate, page, limit }],
    
    queryFn: async (): Promise<SubmissionsForGradingResponse> => {
      // 쿼리 파라미터 구성
      const searchParams = new URLSearchParams();
      if (status) searchParams.set('status', status);
      if (isLate !== undefined) searchParams.set('isLate', isLate.toString());
      searchParams.set('page', page.toString());
      searchParams.set('limit', limit.toString());

      const response = await apiClient.get(
        `/api/instructor/assignments/${assignmentId}/submissions/grading?${searchParams.toString()}`
      );

      // 응답 데이터 검증
      const parsedResponse = SubmissionsForGradingResponseSchema.safeParse(response.data.data);
      
      if (!parsedResponse.success) {
        throw new Error('채점용 제출물 목록 응답 데이터 형식이 올바르지 않습니다.');
      }

      return parsedResponse.data;
    },

    // 캐시 설정
    staleTime: 30 * 1000, // 30초 동안 신선한 데이터로 간주
    gcTime: 5 * 60 * 1000, // 5분 후 가비지 컬렉션

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

    // 백그라운드에서 자동 새로고침
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

/**
 * 채점 통계 조회 쿼리 훅
 * 과제별 채점 진행 상황 및 통계 정보 조회
 */
export const useGradingStats = (assignmentId: string) => {
  return useQuery({
    queryKey: ['grading-stats', assignmentId],
    
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/instructor/assignments/${assignmentId}/submissions/grading?limit=1000`
      );

      const parsedResponse = SubmissionsForGradingResponseSchema.safeParse(response.data.data);
      
      if (!parsedResponse.success) {
        throw new Error('채점 통계 응답 데이터 형식이 올바르지 않습니다.');
      }

      return parsedResponse.data.stats;
    },

    // 캐시 설정
    staleTime: 60 * 1000, // 1분 동안 신선한 데이터로 간주
    gcTime: 10 * 60 * 1000, // 10분 후 가비지 컬렉션

    // 쿼리 활성화 조건
    enabled: !!assignmentId,

    // 재시도 설정
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },

    // 자동 새로고침 설정
    refetchInterval: 5 * 60 * 1000, // 5분마다 자동 새로고침
    refetchOnWindowFocus: true,
  });
};

/**
 * 채점 대기 제출물 수 조회 훅
 * 강사의 모든 과제에서 채점 대기 중인 제출물 수 조회
 */
export const usePendingGradingCount = () => {
  return useQuery({
    queryKey: ['pending-grading-count'],
    
    queryFn: async (): Promise<number> => {
      // 강사 대시보드 API를 통해 채점 대기 수 조회
      const response = await apiClient.get('/api/instructor/dashboard');
      
      if (response.data?.data?.pendingGradingCount !== undefined) {
        return response.data.data.pendingGradingCount;
      }
      
      return 0;
    },

    // 캐시 설정
    staleTime: 2 * 60 * 1000, // 2분 동안 신선한 데이터로 간주
    gcTime: 10 * 60 * 1000, // 10분 후 가비지 컬렉션

    // 재시도 설정
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },

    // 자동 새로고침 설정
    refetchInterval: 3 * 60 * 1000, // 3분마다 자동 새로고침
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};
