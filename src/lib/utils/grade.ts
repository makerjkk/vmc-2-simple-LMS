/**
 * 채점 관련 유틸리티 함수들
 * 점수 계산, 상태 관리, 포맷팅 등의 공통 기능 제공
 */

/**
 * 점수 백분율 계산
 * @param score 획득 점수
 * @param maxScore 만점 (기본값: 100)
 * @returns 백분율 점수
 */
export const calculateGradePercentage = (score: number, maxScore: number = 100): number => {
  if (maxScore === 0) return 0;
  return Math.round((score / maxScore) * 100 * 10) / 10; // 소수점 첫째 자리까지
};

/**
 * 점수 유효성 검증
 * @param score 검증할 점수
 * @param minScore 최소 점수 (기본값: 0)
 * @param maxScore 최대 점수 (기본값: 100)
 * @returns 유효한 점수인지 여부
 */
export const isValidGradeScore = (
  score: number,
  minScore: number = 0,
  maxScore: number = 100
): boolean => {
  return score >= minScore && score <= maxScore && !isNaN(score);
};

/**
 * 점수 포맷팅
 * @param score 점수
 * @param showUnit 단위 표시 여부 (기본값: true)
 * @returns 포맷된 점수 문자열
 */
export const formatGradeScore = (score: number | null, showUnit: boolean = true): string => {
  if (score === null || score === undefined) {
    return '-';
  }
  
  const formattedScore = Number.isInteger(score) ? score.toString() : score.toFixed(1);
  return showUnit ? `${formattedScore}점` : formattedScore;
};

/**
 * 성적 등급 계산
 * @param score 점수 (0-100)
 * @returns 성적 등급
 */
export const calculateGradeLevel = (score: number): string => {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 75) return 'C+';
  if (score >= 70) return 'C';
  if (score >= 65) return 'D+';
  if (score >= 60) return 'D';
  return 'F';
};

/**
 * 채점 상태별 색상 반환
 * @param status 채점 상태
 * @returns Tailwind CSS 색상 클래스
 */
export const getGradeStatusColor = (
  status: 'submitted' | 'graded' | 'resubmission_required' | 'not_submitted'
): string => {
  switch (status) {
    case 'submitted':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'graded':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'resubmission_required':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'not_submitted':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

/**
 * 채점 상태별 라벨 반환
 * @param status 채점 상태
 * @returns 한국어 라벨
 */
export const getGradeStatusLabel = (
  status: 'submitted' | 'graded' | 'resubmission_required' | 'not_submitted'
): string => {
  switch (status) {
    case 'submitted':
      return '제출됨';
    case 'graded':
      return '채점완료';
    case 'resubmission_required':
      return '재제출요청';
    case 'not_submitted':
      return '미제출';
    default:
      return '알 수 없음';
  }
};

/**
 * 점수에 따른 색상 반환
 * @param score 점수 (0-100)
 * @returns Tailwind CSS 색상 클래스
 */
export const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
};

/**
 * 가중 평균 점수 계산
 * @param scores 점수와 가중치 배열
 * @returns 가중 평균 점수
 */
export const calculateWeightedAverage = (
  scores: Array<{ score: number; weight: number }>
): number => {
  if (scores.length === 0) return 0;
  
  const totalWeightedScore = scores.reduce((sum, item) => sum + (item.score * item.weight), 0);
  const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0);
  
  if (totalWeight === 0) return 0;
  
  return Math.round((totalWeightedScore / totalWeight) * 10) / 10;
};

/**
 * 채점 진행률 계산
 * @param totalSubmissions 전체 제출물 수
 * @param gradedSubmissions 채점된 제출물 수
 * @returns 진행률 (0-100)
 */
export const calculateGradingProgress = (
  totalSubmissions: number,
  gradedSubmissions: number
): number => {
  if (totalSubmissions === 0) return 100;
  return Math.round((gradedSubmissions / totalSubmissions) * 100);
};

/**
 * 지각 제출 여부 확인
 * @param submittedAt 제출 일시
 * @param dueDate 마감 일시
 * @returns 지각 여부
 */
export const isLateSubmission = (submittedAt: string, dueDate: string): boolean => {
  const submitDate = new Date(submittedAt);
  const dueDateObj = new Date(dueDate);
  return submitDate > dueDateObj;
};

/**
 * 채점 통계 계산
 * @param submissions 제출물 배열
 * @returns 채점 통계
 */
export const calculateGradingStats = (
  submissions: Array<{
    status: 'submitted' | 'graded' | 'resubmission_required';
    score?: number | null;
    isLate?: boolean;
  }>
) => {
  const total = submissions.length;
  const submitted = submissions.filter(s => s.status === 'submitted').length;
  const graded = submissions.filter(s => s.status === 'graded').length;
  const resubmissionRequired = submissions.filter(s => s.status === 'resubmission_required').length;
  const lateSubmissions = submissions.filter(s => s.isLate).length;
  
  const gradedScores = submissions
    .filter(s => s.status === 'graded' && s.score !== null && s.score !== undefined)
    .map(s => s.score!);
  
  const averageScore = gradedScores.length > 0 
    ? Math.round((gradedScores.reduce((sum, score) => sum + score, 0) / gradedScores.length) * 10) / 10
    : null;
  
  const progress = calculateGradingProgress(total, graded);
  
  return {
    total,
    submitted,
    graded,
    resubmissionRequired,
    lateSubmissions,
    averageScore,
    progress,
  };
};

/**
 * 채점 액션별 라벨 반환
 * @param action 채점 액션
 * @returns 한국어 라벨
 */
export const getGradingActionLabel = (action: 'grade' | 'request_resubmission'): string => {
  switch (action) {
    case 'grade':
      return '채점 완료';
    case 'request_resubmission':
      return '재제출 요청';
    default:
      return '알 수 없음';
  }
};

/**
 * 채점 액션별 색상 반환
 * @param action 채점 액션
 * @returns Tailwind CSS 색상 클래스
 */
export const getGradingActionColor = (action: 'grade' | 'request_resubmission'): string => {
  switch (action) {
    case 'grade':
      return 'text-green-600 bg-green-50';
    case 'request_resubmission':
      return 'text-orange-600 bg-orange-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

// ===== 기존 grades 컴포넌트 호환성을 위한 함수들 =====

/**
 * 제출 상태 텍스트 반환 (기존 호환성)
 * @param status 제출 상태
 * @param isLate 지각 여부 (호환성을 위한 파라미터, 사용하지 않음)
 * @returns 상태 텍스트
 */
export const getSubmissionStatusText = (
  status: 'submitted' | 'graded' | 'resubmission_required' | 'not_submitted',
  isLate?: boolean
): string => {
  return getGradeStatusLabel(status);
};

/**
 * 제출 상태 색상 반환 (기존 호환성)
 * @param status 제출 상태
 * @param isLate 지각 여부 (호환성을 위한 파라미터, 사용하지 않음)
 * @returns 색상 클래스
 */
export const getSubmissionStatusColor = (
  status: 'submitted' | 'graded' | 'resubmission_required' | 'not_submitted',
  isLate?: boolean
): string => {
  return getGradeStatusColor(status);
};

/**
 * 점수 포맷팅 (기존 호환성)
 * @param score 점수
 * @returns 포맷된 점수
 */
export const formatScore = (score: number | null): string => {
  return formatGradeScore(score, false);
};

/**
 * 성적 계산 (기존 호환성)
 * @param score 점수
 * @returns 성적 등급
 */
export const calculateGrade = (score: number): string => {
  return calculateGradeLevel(score);
};

/**
 * 성적 색상 반환 (기존 호환성)
 * @param score 점수
 * @returns 색상 클래스
 */
export const getGradeColor = (score: number): string => {
  return getScoreColor(score);
};

/**
 * 가중치 포맷팅
 * @param weight 가중치
 * @returns 포맷된 가중치
 */
export const formatWeight = (weight: number): string => {
  return `${weight}%`;
};

/**
 * 제출 상태별 정렬
 * @param assignments 과제 배열
 * @returns 정렬된 과제 배열
 */
export const sortBySubmissionStatus = <T extends { status?: string }>(assignments: T[]): T[] => {
  const statusOrder = {
    'resubmission_required': 0,
    'submitted': 1,
    'graded': 2,
    'not_submitted': 3,
  };

  return [...assignments].sort((a, b) => {
    const aStatus = a.status || 'not_submitted';
    const bStatus = b.status || 'not_submitted';
    const aOrder = statusOrder[aStatus as keyof typeof statusOrder] ?? 999;
    const bOrder = statusOrder[bStatus as keyof typeof statusOrder] ?? 999;
    return aOrder - bOrder;
  });
};