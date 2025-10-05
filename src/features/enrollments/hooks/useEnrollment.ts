'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { EnrollmentResponseSchema, type EnrollmentRequest } from '../lib/dto';

/**
 * 수강신청을 위한 API 호출 함수
 */
const createEnrollment = async (data: EnrollmentRequest) => {
  try {
    const response = await apiClient.post('/api/enrollments', data);
    return EnrollmentResponseSchema.parse(response.data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to enroll in course.');
    throw new Error(message);
  }
};

/**
 * 수강취소를 위한 API 호출 함수
 */
const deleteEnrollment = async (courseId: string) => {
  try {
    await apiClient.delete(`/api/enrollments/${courseId}`);
    return { success: true };
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to cancel enrollment.');
    throw new Error(message);
  }
};

/**
 * 수강신청/취소 훅
 * 낙관적 업데이트와 관련 쿼리 무효화 제공
 */
export const useEnrollment = () => {
  const queryClient = useQueryClient();

  // 수강신청 뮤테이션
  const enrollMutation = useMutation({
    mutationFn: createEnrollment,
    onMutate: async (variables) => {
      const { courseId } = variables;
      
      // 관련 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['course', courseId] });
      await queryClient.cancelQueries({ queryKey: ['enrollment-status', courseId] });
      
      // 이전 데이터 백업
      const previousCourse = queryClient.getQueryData(['course', courseId]);
      const previousStatus = queryClient.getQueryData(['enrollment-status', courseId]);
      
      // 낙관적 업데이트
      queryClient.setQueryData(['course', courseId], (old: any) => {
        if (old) {
          return { ...old, isEnrolled: true };
        }
        return old;
      });
      
      queryClient.setQueryData(['enrollment-status', courseId], {
        isEnrolled: true,
        enrolledAt: new Date().toISOString(),
      });
      
      return { previousCourse, previousStatus };
    },
    onError: (error, variables, context) => {
      // 에러 발생 시 롤백
      if (context?.previousCourse) {
        queryClient.setQueryData(['course', variables.courseId], context.previousCourse);
      }
      if (context?.previousStatus) {
        queryClient.setQueryData(['enrollment-status', variables.courseId], context.previousStatus);
      }
    },
    onSettled: (data, error, variables) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-status', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });

  // 수강취소 뮤테이션
  const unenrollMutation = useMutation({
    mutationFn: deleteEnrollment,
    onMutate: async (courseId) => {
      // 관련 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ['course', courseId] });
      await queryClient.cancelQueries({ queryKey: ['enrollment-status', courseId] });
      
      // 이전 데이터 백업
      const previousCourse = queryClient.getQueryData(['course', courseId]);
      const previousStatus = queryClient.getQueryData(['enrollment-status', courseId]);
      
      // 낙관적 업데이트
      queryClient.setQueryData(['course', courseId], (old: any) => {
        if (old) {
          return { ...old, isEnrolled: false };
        }
        return old;
      });
      
      queryClient.setQueryData(['enrollment-status', courseId], {
        isEnrolled: false,
        enrolledAt: null,
      });
      
      return { previousCourse, previousStatus };
    },
    onError: (error, courseId, context) => {
      // 에러 발생 시 롤백
      if (context?.previousCourse) {
        queryClient.setQueryData(['course', courseId], context.previousCourse);
      }
      if (context?.previousStatus) {
        queryClient.setQueryData(['enrollment-status', courseId], context.previousStatus);
      }
    },
    onSettled: (data, error, courseId) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-status', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });

  return {
    // 수강신청
    enroll: (courseId: string) => enrollMutation.mutateAsync({ courseId }),
    isEnrolling: enrollMutation.isPending,
    enrollError: enrollMutation.error ? extractApiErrorMessage(enrollMutation.error) : null,

    // 수강취소
    unenroll: (courseId: string) => unenrollMutation.mutateAsync(courseId),
    isUnenrolling: unenrollMutation.isPending,
    unenrollError: unenrollMutation.error ? extractApiErrorMessage(unenrollMutation.error) : null,

    // 전체 상태
    isLoading: enrollMutation.isPending || unenrollMutation.isPending,
    error: enrollMutation.error || unenrollMutation.error,
  };
};
