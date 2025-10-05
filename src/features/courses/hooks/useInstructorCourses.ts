import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { 
  InstructorCoursesResponseSchema,
  type InstructorCoursesResponse,
  type InstructorCoursesQuery,
} from '../lib/dto';

/**
 * 강사의 코스 목록을 조회하는 React Query 훅
 */
export const useInstructorCourses = (params?: InstructorCoursesQuery) => {
  return useQuery({
    queryKey: ['instructor-courses', params],
    queryFn: async (): Promise<InstructorCoursesResponse> => {
      const searchParams = new URLSearchParams();
      
      if (params?.status) {
        searchParams.append('status', params.status);
      }
      if (params?.page) {
        searchParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        searchParams.append('limit', params.limit.toString());
      }

      const url = `/api/instructor/courses${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const response = await apiClient.get(url);
      
      // 응답 데이터 검증
      const parsedData = InstructorCoursesResponseSchema.safeParse(response.data.data);
      
      if (!parsedData.success) {
        throw new Error('강사 코스 목록 데이터 형식이 올바르지 않습니다.');
      }
      
      return parsedData.data;
    },
    staleTime: 5 * 60 * 1000, // 5분 캐시
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
