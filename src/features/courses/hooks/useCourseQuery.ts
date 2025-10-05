'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { CourseDetailResponseSchema } from '../lib/dto';

/**
 * 코스 상세 정보 조회를 위한 API 호출 함수
 */
const fetchCourse = async (courseId: string) => {
  try {
    const { data } = await apiClient.get(`/api/courses/${courseId}`);
    return CourseDetailResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch course details.');
    throw new Error(message);
  }
};

/**
 * 수강신청 상태 조회를 위한 API 호출 함수
 */
const fetchEnrollmentStatus = async (courseId: string) => {
  try {
    const { data } = await apiClient.get(`/api/courses/${courseId}/enrollment-status`);
    return data;
  } catch (error) {
    // 인증 오류는 무시하고 기본값 반환
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('401') || errorMessage.includes('Authentication')) {
      return { isEnrolled: false, enrolledAt: null };
    }
    const message = extractApiErrorMessage(error, 'Failed to check enrollment status.');
    throw new Error(message);
  }
};

/**
 * 코스 상세 조회 훅
 * 코스 정보와 수강신청 상태를 함께 조회
 */
export const useCourseQuery = (courseId: string) => {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourse(courseId),
    enabled: Boolean(courseId),
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 방지
    retry: (failureCount, error) => {
      // 404 에러는 재시도하지 않음
      if (error.message.includes('404')) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * 수강신청 상태 조회 훅
 * 사용자의 로그인 상태에 따라 수강신청 상태를 확인
 */
export const useEnrollmentStatusQuery = (courseId: string) => {
  return useQuery({
    queryKey: ['enrollment-status', courseId],
    queryFn: () => fetchEnrollmentStatus(courseId),
    enabled: Boolean(courseId),
    staleTime: 2 * 60 * 1000, // 2분간 캐시 유지 (상태 변경이 빈번할 수 있음)
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // 인증 관련 에러는 재시도하지 않음
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};
