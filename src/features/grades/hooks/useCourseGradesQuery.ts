import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CourseGrade } from '../lib/dto';

/**
 * 특정 코스의 성적 조회 훅
 */
export const useCourseGradesQuery = (courseId: string) => {
  return useQuery({
    queryKey: ['grades', 'courses', courseId],
    queryFn: async (): Promise<CourseGrade> => {
      const response = await apiClient.get(`/grades/courses/${courseId}`);
      return response.data;
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분 (이전 cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
