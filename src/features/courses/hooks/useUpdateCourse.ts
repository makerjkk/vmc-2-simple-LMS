import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { 
  InstructorCourseResponseSchema,
  type InstructorCourseResponse,
  type UpdateCourseRequest,
} from '../lib/dto';

/**
 * 코스를 수정하는 React Query 뮤테이션 훅
 */
export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      courseId, 
      courseData 
    }: { 
      courseId: string; 
      courseData: UpdateCourseRequest 
    }): Promise<InstructorCourseResponse> => {
      const response = await apiClient.put(`/api/instructor/courses/${courseId}`, courseData);
      
      // 응답 데이터 검증
      const parsedData = InstructorCourseResponseSchema.safeParse(response.data.data);
      
      if (!parsedData.success) {
        throw new Error('수정된 코스 데이터 형식이 올바르지 않습니다.');
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
    },
    onError: (error) => {
      console.error('코스 수정 중 오류 발생:', error);
    },
  });
};
