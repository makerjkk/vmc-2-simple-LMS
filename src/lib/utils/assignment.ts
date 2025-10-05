import { parseISO, isAfter } from 'date-fns';

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
 * 제출 상태별 색상 클래스 반환
 */
export const getSubmissionStatusColor = (status: SubmissionStatus, isLate?: boolean): string => {
  switch (status) {
    case 'submitted':
      return isLate ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800';
    case 'graded':
      return 'bg-green-100 text-green-800';
    case 'resubmission_required':
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
