import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { 
  InstructorCourseResponseSchema,
  type InstructorCourseResponse,
} from '../lib/dto';

/**
 * 코스 상태를 변경하는 React Query 뮤테이션 훅
 */
export const useUpdateCourseStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      courseId, 
      status 
    }: { 
      courseId: string; 
      status: 'draft' | 'published' | 'archived' 
    }): Promise<InstructorCourseResponse> => {
      const response = await apiClient.patch(`/api/instructor/courses/${courseId}/status`, { status });
      
      // 응답 데이터 검증
      const parsedData = InstructorCourseResponseSchema.safeParse(response.data.data);
      
      if (!parsedData.success) {
        throw new Error('상태 변경된 코스 데이터 형식이 올바르지 않습니다.');
      }
      
      return parsedData.data;
    },
    onSuccess: (updatedCourse, { courseId }) => {
      // 강사 코스 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      
      // 특정 코스 캐시 업데이트
      queryClient.setQueryData(['course', courseId], updatedCourse);
      
      // 코스 상세 캐시도 무효화 (공개 코스 상세 페이지용)
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      
      // 공개 코스 목록 캐시도 무효화 (published 상태 변경 시 목록에 영향)
      if (updatedCourse.status === 'published') {
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      }
    },
    onError: (error) => {
      console.error('코스 상태 변경 중 오류 발생:', error);
    },
  });
};
