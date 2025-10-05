'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { 
  SubmissionForGradingSchema,
  type SubmissionForGrading 
} from '../../lib/dto';

/**
 * 채점용 제출물 상세 조회 쿼리 훅
 * 특정 제출물의 상세 정보를 채점에 필요한 모든 정보와 함께 조회
 */
export const useSubmissionDetailGrading = (submissionId: string) => {
  return useQuery({
    queryKey: ['submission-grading', submissionId],
    
    queryFn: async (): Promise<SubmissionForGrading> => {
      const response = await apiClient.get(
        `/api/instructor/submissions/${submissionId}/grading`
      );

      // 응답 데이터 검증
      const parsedResponse = SubmissionForGradingSchema.safeParse(response.data.data);
      
      if (!parsedResponse.success) {
        throw new Error('채점용 제출물 상세 응답 데이터 형식이 올바르지 않습니다.');
      }

      return parsedResponse.data;
    },

    // 캐시 설정
    staleTime: 60 * 1000, // 1분 동안 신선한 데이터로 간주
    gcTime: 10 * 60 * 1000, // 10분 후 가비지 컬렉션

    // 쿼리 활성화 조건
    enabled: !!submissionId,

    // 재시도 설정
    retry: (failureCount, error: any) => {
      // 클라이언트 에러(4xx)는 재시도하지 않음
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },

    // 재시도 간격 (지수 백오프)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // 백그라운드에서 자동 새로고침
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

/**
 * 제출물 채점 가능 여부 확인 훅
 * 제출물의 상태와 권한을 확인하여 채점 가능 여부를 반환
 */
export const useCanGradeSubmission = (submissionId: string) => {
  const { data: submission, isLoading, error } = useSubmissionDetailGrading(submissionId);

  const canGrade = submission && (
    submission.status === 'submitted' || 
    submission.status === 'resubmission_required'
  );

  const isAlreadyGraded = submission?.status === 'graded';
  const isLateSubmission = submission?.isLate || false;

  return {
    canGrade: !!canGrade,
    isAlreadyGraded: !!isAlreadyGraded,
    isLateSubmission,
    submission,
    isLoading,
    error,
    // 채점 불가 사유
    reason: !canGrade 
      ? isAlreadyGraded 
        ? '이미 채점된 제출물입니다.' 
        : '채점할 수 없는 상태입니다.'
      : null,
  };
};

/**
 * 제출물 재채점 가능 여부 확인 훅
 * 이미 채점된 제출물의 재채점 가능 여부를 확인
 */
export const useCanRegradeSubmission = (submissionId: string) => {
  const { data: submission, isLoading, error } = useSubmissionDetailGrading(submissionId);

  const canRegrade = submission?.status === 'graded';
  const hasExistingGrade = submission?.score !== null && submission?.score !== undefined;
  const hasExistingFeedback = !!submission?.feedback;

  return {
    canRegrade: !!canRegrade,
    hasExistingGrade: !!hasExistingGrade,
    hasExistingFeedback,
    existingScore: submission?.score || null,
    existingFeedback: submission?.feedback || '',
    gradedAt: submission?.gradedAt || null,
    submission,
    isLoading,
    error,
  };
};

/**
 * 제출물 정보 요약 훅
 * 채점 화면에서 필요한 제출물 정보를 요약하여 제공
 */
export const useSubmissionSummary = (submissionId: string) => {
  const { data: submission, isLoading, error } = useSubmissionDetailGrading(submissionId);

  if (!submission) {
    return {
      summary: null,
      isLoading,
      error,
    };
  }

  const summary = {
    // 기본 정보
    id: submission.id,
    assignmentTitle: submission.assignmentTitle,
    learnerName: submission.learnerName,
    learnerEmail: submission.learnerEmail,
    
    // 제출 정보
    content: submission.content,
    linkUrl: submission.linkUrl,
    submittedAt: submission.submittedAt,
    isLate: submission.isLate,
    
    // 채점 정보
    status: submission.status,
    score: submission.score,
    feedback: submission.feedback,
    gradedAt: submission.gradedAt,
    
    // 상태 플래그
    isSubmitted: submission.status === 'submitted',
    isGraded: submission.status === 'graded',
    needsResubmission: submission.status === 'resubmission_required',
    hasScore: submission.score !== null && submission.score !== undefined,
    hasFeedback: !!submission.feedback,
    
    // 표시용 정보
    statusLabel: getStatusLabel(submission.status),
    statusColor: getStatusColor(submission.status),
    lateLabel: submission.isLate ? '지각 제출' : '정시 제출',
    lateColor: submission.isLate ? 'text-orange-600' : 'text-green-600',
  };

  return {
    summary,
    isLoading,
    error,
  };
};

// 헬퍼 함수들
const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'submitted':
      return '제출됨';
    case 'graded':
      return '채점완료';
    case 'resubmission_required':
      return '재제출요청';
    default:
      return '알 수 없음';
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'submitted':
      return 'text-blue-600 bg-blue-50';
    case 'graded':
      return 'text-green-600 bg-green-50';
    case 'resubmission_required':
      return 'text-orange-600 bg-orange-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};
