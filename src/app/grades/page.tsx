'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { GradeList } from '@/features/grades/components/grade-list';
import { useGradesQuery } from '@/features/grades/hooks/useGradesQuery';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

/**
 * 성적 & 피드백 열람 페이지
 */
export default function GradesPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useCurrentUser();
  
  // 성적 데이터 조회
  const {
    data: grades,
    isLoading: gradesLoading,
    error: gradesError,
    refetch,
  } = useGradesQuery();

  // 과제 상세 페이지로 이동
  const handleAssignmentClick = (assignmentId: string) => {
    router.push(`/assignments/${assignmentId}`);
  };

  // 재시도 핸들러
  const handleRetry = () => {
    refetch();
  };

  // 사용자 로딩 중
  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // 사용자 인증 확인
  if (!user) {
    router.push('/login');
    return null;
  }

  // Learner 권한 확인
  if (user.profile?.role !== 'learner') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            접근 권한이 없습니다
          </h1>
          <p className="text-gray-600 mb-6">
            성적 조회는 학습자만 이용할 수 있습니다.
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            이전 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          내 성적
        </h1>
        <p className="text-gray-600">
          수강 중인 코스의 과제 성적과 피드백을 확인하세요.
        </p>
      </div>

      {/* 성적 목록 */}
      <GradeList
        grades={grades}
        isLoading={gradesLoading}
        error={gradesError}
        onRetry={handleRetry}
        onAssignmentClick={handleAssignmentClick}
      />
    </div>
  );
}
