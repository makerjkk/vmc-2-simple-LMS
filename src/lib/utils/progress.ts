/**
 * 진행률 계산 공통 유틸리티
 */

/**
 * 진행률을 계산합니다 (소수점 첫째 자리까지)
 */
export const calculateProgress = (
  completed: number,
  total: number
): number => {
  if (total === 0) return 0;
  if (completed > total) return 100;
  return Math.round((completed / total) * 100 * 10) / 10;
};

/**
 * 진행률에 따른 색상 클래스를 반환합니다
 */
export const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 60) return 'bg-blue-500';
  if (progress >= 40) return 'bg-yellow-500';
  if (progress >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

/**
 * 진행률에 따른 텍스트 색상 클래스를 반환합니다
 */
export const getProgressTextColor = (progress: number): string => {
  if (progress >= 80) return 'text-green-600';
  if (progress >= 60) return 'text-blue-600';
  if (progress >= 40) return 'text-yellow-600';
  if (progress >= 20) return 'text-orange-600';
  return 'text-red-600';
};

/**
 * 진행률 상태를 텍스트로 반환합니다
 */
export const getProgressStatus = (progress: number): string => {
  if (progress >= 100) return '완료';
  if (progress >= 80) return '거의 완료';
  if (progress >= 60) return '진행 중';
  if (progress >= 40) return '절반 완료';
  if (progress >= 20) return '시작됨';
  return '시작 전';
};
