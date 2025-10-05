"use client";

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { useCurrentUserContext } from '@/features/auth/context/current-user-context';
import type {
  SignupRequest,
  CheckEmailRequest,
  UserResponse,
  CheckEmailResponse,
  RolesResponse,
} from '../lib/dto';

/**
 * 온보딩 관련 API 호출 훅
 */
export const useOnboarding = () => {
  const router = useRouter();
  const { refresh } = useCurrentUserContext();

  // 이메일 중복 체크
  const checkEmailMutation = useMutation({
    mutationFn: async (data: CheckEmailRequest): Promise<CheckEmailResponse> => {
      const response = await apiClient.post('/api/onboarding/check-email', data);
      return response.data.data; // 백엔드 응답 구조에 맞춰 수정
    },
    onError: (error) => {
      console.error('Email check failed:', error);
    },
  });

  // 회원가입
  const signupMutation = useMutation({
    mutationFn: async (data: SignupRequest): Promise<UserResponse> => {
      const response = await apiClient.post('/api/onboarding/signup', data);
      return response.data.data; // 백엔드 응답 구조에 맞춰 수정
    },
    onSuccess: async (userData) => {
      try {
        // 사용자 정보 새로고침 (비동기 처리 최적화)
        refresh(); // await 제거하여 블로킹 방지
        
        // 약간의 지연 후 리다이렉트 (상태 업데이트 완료 대기)
        setTimeout(() => {
          if (userData.role === 'learner') {
            // 신규 가입한 수강생은 메인 홈페이지로 이동 (환영 및 소개)
            router.replace('/?welcome=true');
          } else if (userData.role === 'instructor') {
            // 강사는 바로 대시보드로 이동
            router.replace('/instructor/dashboard');
          }
        }, 100); // 100ms 지연
      } catch (error) {
        console.error('Post-signup processing failed:', error);
      }
    },
    onError: (error) => {
      console.error('Signup failed:', error);
    },
  });

  // 역할 목록 조회
  const rolesQuery = useQuery({
    queryKey: ['onboarding', 'roles'],
    queryFn: async (): Promise<RolesResponse> => {
      const response = await apiClient.get('/api/onboarding/roles');
      return response.data.data; // 백엔드 응답 구조에 맞춰 수정
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐시
  });

  // 이메일 중복 체크 함수
  const checkEmail = useCallback(
    (email: string) => {
      return checkEmailMutation.mutateAsync({ email });
    },
    [checkEmailMutation]
  );

  // 회원가입 함수
  const signup = useCallback(
    (data: SignupRequest) => {
      return signupMutation.mutateAsync(data);
    },
    [signupMutation]
  );

  return {
    // 이메일 중복 체크
    checkEmail,
    isCheckingEmail: checkEmailMutation.isPending,
    emailCheckError: checkEmailMutation.error ? extractApiErrorMessage(checkEmailMutation.error) : null,

    // 회원가입
    signup,
    isSigningUp: signupMutation.isPending,
    signupError: signupMutation.error ? extractApiErrorMessage(signupMutation.error) : null,

    // 역할 목록
    roles: rolesQuery.data || [],
    isLoadingRoles: rolesQuery.isLoading,
    rolesError: rolesQuery.error ? extractApiErrorMessage(rolesQuery.error) : null,
  };
};
