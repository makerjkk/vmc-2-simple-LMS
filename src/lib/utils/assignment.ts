import { parseISO, isAfter, formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 과제 상태 관련 공통 유틸리티
 */

export type AssignmentStatus = 'draft' | 'published' | 'closed';
export type SubmissionStatus = 'submitted' | 'graded' | 'resubmission_required';

export interface Assignment {
  id: string;
  status: AssignmentStatus;
  dueDate: string;
  allowLateSubmission: boolean;
  allowResubmission: boolean;
}

export interface Submission {
  id: string;
  status: SubmissionStatus;
  submittedAt: string;
  isLate: boolean;
  score?: number | null;
  feedback?: string | null;
  content?: string;
  linkUrl?: string | null;
}

/**
 * 과제 상태 표시명 변환
 */
export const getAssignmentStatusLabel = (status: AssignmentStatus): string => {
  switch (status) {
    case 'draft':
      return '초안';
    case 'published':
      return '게시됨';
    case 'closed':
      return '마감됨';
    default:
      return status;
  }
};

/**
 * 제출 상태 표시명 변환
 */
export const getSubmissionStatusLabel = (status: SubmissionStatus): string => {
  switch (status) {
    case 'submitted':
      return '제출 완료';
    case 'graded':
      return '채점 완료';
    case 'resubmission_required':
      return '재제출 요청';
    default:
      return status;
  }
};

/**
 * 제출 가능 여부 확인
 */
export const canSubmitAssignment = (assignment: Assignment, submission?: Submission): boolean => {
  // 과제가 마감된 경우
  if (assignment.status === 'closed') {
    return false;
  }

  // 과제가 게시되지 않은 경우
  if (assignment.status !== 'published') {
    return false;
  }

  // 마감일이 지났는지 확인
  const now = new Date();
  const dueDate = parseISO(assignment.dueDate);
  const isPastDue = isAfter(now, dueDate);

  // 마감일이 지났고 지각 제출이 허용되지 않는 경우
  if (isPastDue && !assignment.allowLateSubmission) {
    return false;
  }

  // 제출물이 없는 경우 제출 가능
  if (!submission) {
    return true;
  }

  // 재제출이 허용되지 않고 이미 제출한 경우
  if (!assignment.allowResubmission && submission.status !== 'resubmission_required') {
    return false;
  }

  // 재제출 요청 상태인 경우 재제출 가능
  if (submission.status === 'resubmission_required') {
    return true;
  }

  // 재제출이 허용되는 경우 재제출 가능
  return assignment.allowResubmission;
};

/**
 * 마감일 기준 제출 상태 확인
 */
export const getSubmissionTimingStatus = (
  dueDate: string, 
  submittedAt?: string
): 'on-time' | 'late' | 'not-submitted' => {
  if (!submittedAt) {
    return 'not-submitted';
  }

  const due = parseISO(dueDate);
  const submitted = parseISO(submittedAt);

  return isAfter(submitted, due) ? 'late' : 'on-time';
};

/**
 * 과제 상태별 색상 클래스 반환
 */
export const getAssignmentStatusColor = (status: AssignmentStatus): string => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'published':
      return 'bg-green-100 text-green-800';
    case 'closed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};


/**
 * 제출 버튼 텍스트 반환
 */
export const getSubmitButtonText = (assignment: Assignment, submission?: Submission): string => {
  if (!submission) {
    return '과제 제출';
  }

  if (submission.status === 'resubmission_required') {
    return '재제출';
  }

  if (assignment.allowResubmission) {
    return '재제출';
  }

  return '제출 완료';
};

/**
 * 마감일 관련 유틸리티 함수들
 */

/**
 * 과제 마감일이 지났는지 확인
 */
export const isAssignmentOverdue = (dueDate: string): boolean => {
  const now = new Date();
  const due = parseISO(dueDate);
  return isAfter(now, due);
};

/**
 * 마감일까지 남은 시간 텍스트 반환
 */
export const getTimeUntilDue = (dueDate: string): string => {
  const now = new Date();
  const due = parseISO(dueDate);
  
  if (isAfter(now, due)) {
    return `${formatDistanceToNow(due, { locale: ko })} 전 마감`;
  }
  
  return `${formatDistanceToNow(due, { locale: ko })} 후 마감`;
};

/**
 * 지각 제출 가능 여부 확인
 */
export const canSubmitLate = (assignment: Assignment): boolean => {
  return assignment.allowLateSubmission && isAssignmentOverdue(assignment.dueDate);
};

/**
 * 제출 상태 텍스트 반환 (과제 정보 포함)
 */
export const getSubmissionStatusText = (
  submission?: Submission, 
  assignment?: Assignment
): string => {
  if (!submission) {
    if (assignment && isAssignmentOverdue(assignment.dueDate)) {
      return assignment.allowLateSubmission ? '지각 제출 가능' : '제출 불가 (마감)';
    }
    return '미제출';
  }

  const baseStatus = getSubmissionStatusLabel(submission.status);
  
  if (submission.isLate) {
    return `${baseStatus} (지각)`;
  }
  
  return baseStatus;
};

/**
 * 제출 상태별 색상 반환 (shadcn/ui Badge variant 기준)
 */
export const getSubmissionStatusColor = (
  submission?: Submission, 
  assignment?: Assignment
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (!submission) {
    if (assignment && isAssignmentOverdue(assignment.dueDate)) {
      return assignment.allowLateSubmission ? 'outline' : 'destructive';
    }
    return 'secondary';
  }

  switch (submission.status) {
    case 'submitted':
      return submission.isLate ? 'outline' : 'default';
    case 'graded':
      return 'default';
    case 'resubmission_required':
      return 'destructive';
    default:
      return 'secondary';
  }
};

/**
 * 재제출 가능 여부 확인
 */
export const canResubmit = (
  assignment: Assignment, 
  submission?: Submission
): boolean => {
  if (!submission || !assignment.allowResubmission) {
    return false;
  }

  // 과제가 마감된 경우
  if (assignment.status === 'closed') {
    return false;
  }

  // 마감일이 지났고 지각 제출이 허용되지 않는 경우
  if (isAssignmentOverdue(assignment.dueDate) && !assignment.allowLateSubmission) {
    return false;
  }

  // 재제출 요청 상태이거나 재제출이 허용되는 경우
  return submission.status === 'resubmission_required' || assignment.allowResubmission;
};

/**
 * 마감일 포맷팅 (사용자 친화적)
 */
export const formatDueDate = (dueDate: string): string => {
  const due = parseISO(dueDate);
  const now = new Date();
  
  // 오늘이면 시간만 표시
  if (format(due, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
    return `오늘 ${format(due, 'HH:mm')}`;
  }
  
  // 이번 주면 요일과 시간 표시
  const daysDiff = Math.abs(due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff <= 7) {
    return format(due, 'M월 d일 (E) HH:mm', { locale: ko });
  }
  
  // 그 외에는 전체 날짜 표시
  return format(due, 'yyyy년 M월 d일 HH:mm', { locale: ko });
};

/**
 * 마감 임박 여부 확인 (3일 이내)
 */
export const isDueSoon = (dueDate: string): boolean => {
  const now = new Date();
  const due = parseISO(dueDate);
  const diffInHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return diffInHours > 0 && diffInHours <= 72; // 3일 = 72시간
};

/**
 * 제출 가능 상태 메시지 반환
 */
export const getSubmissionAvailabilityMessage = (
  assignment: Assignment,
  submission?: Submission
): { canSubmit: boolean; message: string; variant: 'default' | 'warning' | 'destructive' } => {
  // 과제가 게시되지 않은 경우
  if (assignment.status !== 'published') {
    return {
      canSubmit: false,
      message: assignment.status === 'draft' ? '아직 공개되지 않은 과제입니다.' : '마감된 과제입니다.',
      variant: 'destructive'
    };
  }

  const isOverdue = isAssignmentOverdue(assignment.dueDate);

  // 기존 제출물이 없는 경우
  if (!submission) {
    if (isOverdue) {
      if (assignment.allowLateSubmission) {
        return {
          canSubmit: true,
          message: '마감일이 지났지만 지각 제출이 가능합니다.',
          variant: 'warning'
        };
      } else {
        return {
          canSubmit: false,
          message: '마감일이 지나 제출할 수 없습니다.',
          variant: 'destructive'
        };
      }
    }

    return {
      canSubmit: true,
      message: isDueSoon(assignment.dueDate) ? '마감일이 임박했습니다.' : '제출 가능합니다.',
      variant: isDueSoon(assignment.dueDate) ? 'warning' : 'default'
    };
  }

  // 기존 제출물이 있는 경우
  if (submission.status === 'graded') {
    return {
      canSubmit: false,
      message: '이미 채점이 완료된 과제입니다.',
      variant: 'default'
    };
  }

  if (!assignment.allowResubmission) {
    return {
      canSubmit: false,
      message: '재제출이 허용되지 않는 과제입니다.',
      variant: 'destructive'
    };
  }

  if (isOverdue && !assignment.allowLateSubmission) {
    return {
      canSubmit: false,
      message: '마감일이 지나 재제출할 수 없습니다.',
      variant: 'destructive'
    };
  }

  return {
    canSubmit: true,
    message: submission.status === 'resubmission_required' 
      ? '재제출이 요청되었습니다.' 
      : '재제출이 가능합니다.',
    variant: submission.status === 'resubmission_required' ? 'warning' : 'default'
  };
};
