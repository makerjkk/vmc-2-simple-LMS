import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { useErrorDialog } from '@/hooks/useErrorDialog';
import { useToast } from '@/hooks/use-toast';

/**
 * 코스 상태 업데이트 뮤테이션 훅
 */
export const useUpdateCourseStatus = () => {
  const queryClient = useQueryClient();
  const { showErrorFromException } = useErrorDialog();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      courseId, 
      status 
    }: { 
      courseId: string; 
      status: 'draft' | 'published' | 'archived' 
    }) => {
      const response = await apiClient.patch(`/api/instructor/courses/${courseId}/status`, {
        status
      });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      // 성공 메시지 표시
      const statusLabels = {
        draft: '초안으로 변경',
        published: '게시',
        archived: '보관'
      };
      
      toast({
        title: "✅ 상태 변경 완료",
        description: `코스가 성공적으로 ${statusLabels[variables.status]}되었습니다.`,
        duration: 3000,
      });
      
      // 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['instructor-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      
      // 업데이트된 코스 데이터를 캐시에 설정
      queryClient.setQueryData(['course', variables.courseId], data);
    },
    onError: (error, variables) => {
      const statusLabels = {
        draft: '초안으로 변경',
        published: '게시',
        archived: '보관'
      };
      
      toast({
        title: "❌ 상태 변경 실패",
        description: `코스 ${statusLabels[variables.status]} 중 오류가 발생했습니다.`,
        variant: "destructive",
        duration: 5000,
      });
      
      showErrorFromException(
        error instanceof Error ? error : new Error("알 수 없는 오류가 발생했습니다."),
        `코스 ${statusLabels[variables.status]} 실패`
      );
    },
  });
};