import { differenceInDays } from 'date-fns';
import type { PendingSubmission } from '@/features/instructor-dashboard/lib/dto';

/**
 * 채점 우선순위 계산 함수
 * 마감일 지남 여부와 제출일 기준으로 우선순위 계산
 */
export const calculateGradingPriority = (
  submission: PendingSubmission
): number => {
  const now = new Date();
  const submittedDate = new Date(submission.submittedAt);
  const daysSinceSubmission = differenceInDays(now, submittedDate);
  
  let priority = daysSinceSubmission; // 기본: 오래된 제출물 우선
  
  if (submission.isLate) {
    priority += 1000; // 지각 제출물 최우선
  }
  
  if (submission.daysOverdue && submission.daysOverdue > 0) {
    priority += submission.daysOverdue * 100; // 마감일 지난 정도에 따라 가중치
  }
  
  return priority;
};

/**
 * 코스 완료율 계산 함수
 */
export const calculateCourseCompletionRate = (
  totalSubmissions: number,
  gradedSubmissions: number
): number => {
  if (totalSubmissions === 0) return 0;
  return Math.round((gradedSubmissions / totalSubmissions) * 100);
};

/**
 * 평균 평점 계산 함수
 */
export const calculateAverageRating = (ratings: number[]): number => {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 100) / 100; // 소수점 2자리
};

/**
 * 제출물 우선순위 정렬 함수
 */
export const sortSubmissionsByPriority = (
  submissions: PendingSubmission[]
): PendingSubmission[] => {
  return [...submissions].sort((a, b) => {
    const priorityA = calculateGradingPriority(a);
    const priorityB = calculateGradingPriority(b);
    return priorityB - priorityA; // 높은 우선순위부터
  });
};

/**
 * 상태별 제출물 개수 계산
 */
export const getSubmissionStatusCounts = (
  submissions: { status: string }[]
): Record<string, number> => {
  return submissions.reduce((counts, submission) => {
    counts[submission.status] = (counts[submission.status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
};
