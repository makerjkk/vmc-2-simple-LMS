'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { CoursesResponseSchema, type CoursesQueryParams } from '../lib/dto';

/**
 * 코스 목록 조회를 위한 API 호출 함수
 */
const fetchCourses = async (params: CoursesQueryParams) => {
  try {
    // 쿼리 파라미터 구성
    const queryParams = new URLSearchParams();
    
    if (params.search) {
      queryParams.append('search', params.search);
    }
    if (params.category) {
      queryParams.append('category', params.category);
    }
    if (params.difficulty) {
      queryParams.append('difficulty', params.difficulty);
    }
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const url = `/api/courses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const { data } = await apiClient.get(url);
    
    return CoursesResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch courses.');
    throw new Error(message);
  }
};

/**
 * 코스 목록 조회 훅
 * React Query를 사용하여 캐싱, 백그라운드 업데이트, 에러 처리 제공
 */
export const useCoursesQuery = (params: CoursesQueryParams = {}) => {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => fetchCourses(params),
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 방지
    retry: (failureCount, error) => {
      // 4xx 에러는 재시도하지 않음
      if (error.message.includes('400') || error.message.includes('404')) {
        return false;
      }
      return failureCount < 3;
    },
    refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 재요청 비활성화
  });
};

/**
 * 무한 스크롤을 위한 코스 목록 조회 훅
 */
export const useInfiniteCoursesQuery = (
  baseParams: Omit<CoursesQueryParams, 'page'> = {}
) => {
  const { useInfiniteQuery } = require('@tanstack/react-query');
  
  return useInfiniteQuery({
    queryKey: ['courses', 'infinite', baseParams],
    queryFn: ({ pageParam = 1 }) => 
      fetchCourses({ ...baseParams, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const { pagination } = lastPage;
      return pagination.page < pagination.totalPages 
        ? pagination.page + 1 
        : undefined;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.message.includes('400') || error.message.includes('404')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};
