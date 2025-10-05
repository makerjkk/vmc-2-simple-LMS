import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { 
  InstructorCourseResponseSchema,
  type InstructorCourseResponse,
  type CreateCourseRequest,
} from '../lib/dto';

/**
 * 새 코스를 생성하는 React Query 뮤테이션 훅
 */
export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (courseData: CreateCourseRequest): Promise<InstructorCourseResponse> => {
      const response = await apiClient.post('/api/instructor/courses', courseData);
      
      // 응답 데이터 검증
      const parsedData = InstructorCourseResponseSchema.safeParse(response.data.data);
      
      if (!parsedData.success) {
        throw new Error('생성된 코스 데이터 형식이 올바르지 않습니다.');
      }
      
      return parsedData.data;
    },
    onSuccess: (newCourse) => {
      // 강사 관련 모든 캐시 무효화 (대시보드에서 즉시 반영되도록)
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      
      // 새로 생성된 코스를 캐시에 추가
      queryClient.setQueryData(['course', newCourse.id], newCourse);
      
      // 강제로 대시보드 데이터를 다시 가져오기 (즉시 반영 보장)
      queryClient.refetchQueries({ 
        queryKey: ['instructor-dashboard'],
        type: 'active' 
      });
    },
    onError: (error) => {
      console.error('코스 생성 중 오류 발생:', error);
    },
  });
};
