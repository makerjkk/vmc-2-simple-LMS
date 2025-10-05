import { format, formatDistanceToNow, isAfter, isBefore, addMinutes, startOfDay, endOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 날짜를 한국어 형식으로 포맷팅
 */
export const formatDateKo = (date: Date | string, formatStr: string = 'PPP'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: ko });
};

/**
 * 현재 시간으로부터의 상대적 시간 표시
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: ko });
};

/**
 * 마감일 포맷팅 (색상 정보 포함)
 */
export const formatDueDate = (dueDate: Date | string): {
  formatted: string;
  relative: string;
  isOverdue: boolean;
  isUrgent: boolean; // 24시간 이내
  isSoon: boolean; // 3일 이내
} => {
  const dateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  
  const isOverdue = isBefore(dateObj, now);
  const isUrgent = !isOverdue && isBefore(dateObj, addMinutes(now, 24 * 60)); // 24시간 이내
  const isSoon = !isOverdue && !isUrgent && isBefore(dateObj, addMinutes(now, 3 * 24 * 60)); // 3일 이내

  return {
    formatted: format(dateObj, 'PPP p', { locale: ko }),
    relative: formatDistanceToNow(dateObj, { addSuffix: true, locale: ko }),
    isOverdue,
    isUrgent,
    isSoon,
  };
};

/**
 * 다음 스케줄러 실행 시간 계산
 */
export const getNextSchedulerRun = (intervalMinutes: number = 5): Date => {
  const now = new Date();
  const nextRun = new Date(now);
  
  // 현재 분을 interval 단위로 올림
  const currentMinutes = now.getMinutes();
  const nextMinutes = Math.ceil(currentMinutes / intervalMinutes) * intervalMinutes;
  
  nextRun.setMinutes(nextMinutes, 0, 0); // 초와 밀리초는 0으로 설정
  
  // 만약 다음 실행 시간이 현재 시간과 같거나 이전이면 다음 interval로 설정
  if (nextRun <= now) {
    nextRun.setMinutes(nextRun.getMinutes() + intervalMinutes);
  }
  
  return nextRun;
};

/**
 * Assignment 자동 마감 대상 여부 확인
 */
export const isEligibleForAutoClose = (assignment: { 
  status: string; 
  dueDate: string 
}): boolean => {
  if (assignment.status !== 'published') {
    return false;
  }
  
  const dueDate = new Date(assignment.dueDate);
  const now = new Date();
  
  return isBefore(dueDate, now);
};

/**
 * 시간대별 마감 처리 최적화
 * 마감일 당일 23:59:59까지 제출 가능하도록 최적화된 마감 시간 반환
 */
export const getOptimalCloseTime = (dueDate: Date): Date => {
  // 마감일의 하루 끝 시간 (23:59:59.999)으로 설정
  return endOfDay(dueDate);
};

/**
 * 업무 시간 여부 확인 (한국 시간 기준)
 */
export const isBusinessHours = (date: Date = new Date()): boolean => {
  const hour = date.getHours();
  const day = date.getDay(); // 0: 일요일, 6: 토요일
  
  // 평일 9시-18시
  return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
};

/**
 * 다음 업무 시간 계산
 */
export const getNextBusinessHour = (date: Date = new Date()): Date => {
  const nextDate = new Date(date);
  
  // 현재 시간이 업무 시간이면 그대로 반환
  if (isBusinessHours(nextDate)) {
    return nextDate;
  }
  
  // 업무 시간이 아니면 다음 평일 9시로 설정
  while (!isBusinessHours(nextDate)) {
    if (nextDate.getDay() === 0) { // 일요일
      nextDate.setDate(nextDate.getDate() + 1); // 월요일로
    } else if (nextDate.getDay() === 6) { // 토요일
      nextDate.setDate(nextDate.getDate() + 2); // 월요일로
    } else if (nextDate.getHours() >= 18) { // 평일 18시 이후
      nextDate.setDate(nextDate.getDate() + 1); // 다음 날로
    } else { // 평일 9시 이전
      // 그대로 유지
    }
    
    nextDate.setHours(9, 0, 0, 0); // 9시로 설정
  }
  
  return nextDate;
};

/**
 * 시간 범위 검증
 */
export const isWithinTimeRange = (
  targetDate: Date | string,
  startDate: Date | string,
  endDate: Date | string
): boolean => {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  return isAfter(target, start) && isBefore(target, end);
};

/**
 * 날짜 배열을 범위로 그룹화
 */
export const groupDatesByRange = (
  dates: (Date | string)[],
  rangeType: 'day' | 'week' | 'month' = 'day'
): Record<string, (Date | string)[]> => {
  const groups: Record<string, (Date | string)[]> = {};
  
  dates.forEach(date => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    let key: string;
    
    switch (rangeType) {
      case 'day':
        key = format(dateObj, 'yyyy-MM-dd');
        break;
      case 'week':
        key = format(startOfDay(dateObj), 'yyyy-ww');
        break;
      case 'month':
        key = format(dateObj, 'yyyy-MM');
        break;
      default:
        key = format(dateObj, 'yyyy-MM-dd');
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(date);
  });
  
  return groups;
};

/**
 * 스케줄러 실행 간격 검증
 */
export const validateSchedulerInterval = (intervalMinutes: number): boolean => {
  return intervalMinutes >= 1 && intervalMinutes <= 60 && Number.isInteger(intervalMinutes);
};

/**
 * 타임존 변환 (UTC <-> KST)
 */
export const convertToKST = (utcDate: Date | string): Date => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  // 한국 시간은 UTC+9
  return new Date(date.getTime() + (9 * 60 * 60 * 1000));
};

export const convertToUTC = (kstDate: Date | string): Date => {
  const date = typeof kstDate === 'string' ? new Date(kstDate) : kstDate;
  // 한국 시간에서 UTC로 변환
  return new Date(date.getTime() - (9 * 60 * 60 * 1000));
};

/**
 * 한국어 날짜/시간 포맷팅 (기존 코드 호환성)
 */
export const formatKoreanDateTime = (date: Date | string): string => {
  return formatDateKo(date, 'PPP p');
};

/**
 * 마감일까지 남은 일수 계산
 */
export const getDaysUntilDue = (dueDate: Date | string): number => {
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * 마감일 상태 반환
 */
export const getDeadlineStatus = (dueDate: Date | string): 'overdue' | 'urgent' | 'soon' | 'normal' => {
  const daysUntil = getDaysUntilDue(dueDate);
  
  if (daysUntil < 0) return 'overdue';
  if (daysUntil === 0) return 'urgent';
  if (daysUntil <= 3) return 'soon';
  return 'normal';
};

/**
 * 마감일 상태에 따른 색상 반환
 */
export const getDeadlineColor = (dueDate: Date | string): string => {
  const status = getDeadlineStatus(dueDate);
  
  switch (status) {
    case 'overdue':
      return 'text-red-600';
    case 'urgent':
      return 'text-orange-600';
    case 'soon':
      return 'text-yellow-600';
    default:
      return 'text-gray-600';
  }
};