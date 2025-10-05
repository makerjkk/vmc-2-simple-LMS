import { differenceInDays, differenceInHours, differenceInMinutes, format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 날짜 관련 공통 유틸리티
 */

/**
 * 마감일까지 남은 일수를 계산합니다
 */
export const getDaysUntilDue = (dueDate: string): number => {
  const now = new Date();
  const due = parseISO(dueDate);
  return Math.max(0, differenceInDays(due, now));
};

/**
 * 지정된 일수 내 마감 여부를 확인합니다
 */
export const isUpcomingDeadline = (dueDate: string, days: number = 7): boolean => {
  const daysLeft = getDaysUntilDue(dueDate);
  return daysLeft <= days && daysLeft >= 0;
};

/**
 * 상대적 시간을 표시합니다 (예: "3일 전", "2시간 후")
 */
export const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const target = parseISO(date);
  
  const diffInMinutes = differenceInMinutes(target, now);
  const diffInHours = differenceInHours(target, now);
  const diffInDays = differenceInDays(target, now);
  
  if (Math.abs(diffInDays) >= 1) {
    if (diffInDays > 0) {
      return `${diffInDays}일 후`;
    } else {
      return `${Math.abs(diffInDays)}일 전`;
    }
  }
  
  if (Math.abs(diffInHours) >= 1) {
    if (diffInHours > 0) {
      return `${diffInHours}시간 후`;
    } else {
      return `${Math.abs(diffInHours)}시간 전`;
    }
  }
  
  if (Math.abs(diffInMinutes) >= 1) {
    if (diffInMinutes > 0) {
      return `${diffInMinutes}분 후`;
    } else {
      return `${Math.abs(diffInMinutes)}분 전`;
    }
  }
  
  return '방금 전';
};

/**
 * 날짜를 한국어 형식으로 포맷합니다
 */
export const formatKoreanDate = (date: string): string => {
  return format(parseISO(date), 'yyyy년 M월 d일', { locale: ko });
};

/**
 * 날짜와 시간을 한국어 형식으로 포맷합니다
 */
export const formatKoreanDateTime = (date: string): string => {
  return format(parseISO(date), 'yyyy년 M월 d일 HH:mm', { locale: ko });
};

/**
 * 마감 임박도에 따른 색상 클래스를 반환합니다
 */
export const getDeadlineColor = (dueDate: string): string => {
  const daysLeft = getDaysUntilDue(dueDate);
  
  if (daysLeft === 0) return 'text-red-600 bg-red-50';
  if (daysLeft <= 1) return 'text-red-500 bg-red-50';
  if (daysLeft <= 3) return 'text-orange-500 bg-orange-50';
  if (daysLeft <= 7) return 'text-yellow-600 bg-yellow-50';
  return 'text-gray-600 bg-gray-50';
};

/**
 * 마감 상태 텍스트를 반환합니다
 */
export const getDeadlineStatus = (dueDate: string): string => {
  const daysLeft = getDaysUntilDue(dueDate);
  
  if (daysLeft === 0) return '오늘 마감';
  if (daysLeft === 1) return '내일 마감';
  if (daysLeft <= 7) return `${daysLeft}일 남음`;
  return `${daysLeft}일 남음`;
};
