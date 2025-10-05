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
  scoreWeight?: number;
}

export interface InstructorAssignment extends Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  scoreWeight: number;
  submissionCount: number;
  gradedCount: number;
  createdAt: string;
  updatedAt: string;
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

// ===== 강사용 유틸리티 함수들 =====

/**
 * 과제 상태 전환 검증
 * 비즈니스 룰에 따른 상태 전환 가능 여부 확인
 */
export const validateStatusTransition = (
  currentStatus: AssignmentStatus,
  newStatus: AssignmentStatus,
  hasSubmissions: boolean = false,
  dueDate?: string
): { isValid: boolean; reason?: string } => {
  // 동일한 상태로는 전환 불가
  if (currentStatus === newStatus) {
    return { isValid: false, reason: '동일한 상태로는 전환할 수 없습니다.' };
  }

  // 허용되는 상태 전환 규칙
  const validTransitions: Record<AssignmentStatus, AssignmentStatus[]> = {
    draft: ['published'],
    published: ['closed'],
    closed: ['published'], // 조건부 허용
  };

  const allowedNextStates = validTransitions[currentStatus];
  if (!allowedNextStates.includes(newStatus)) {
    return { 
      isValid: false, 
      reason: `${getAssignmentStatusLabel(currentStatus)}에서 ${getAssignmentStatusLabel(newStatus)}로 상태 전환이 불가능합니다.` 
    };
  }

  // closed에서 published로 전환 시 마감일 검증
  if (currentStatus === 'closed' && newStatus === 'published') {
    if (!dueDate) {
      return { isValid: false, reason: '마감일 정보가 필요합니다.' };
    }
    
    if (isAssignmentOverdue(dueDate)) {
      return { isValid: false, reason: '마감일이 지난 과제는 다시 게시할 수 없습니다.' };
    }
  }

  return { isValid: true };
};

/**
 * 점수 비중 합계 계산
 * 특정 과제를 제외하고 계산 가능
 */
export const calculateTotalScoreWeight = (
  assignments: InstructorAssignment[],
  excludeId?: string
): number => {
  return assignments
    .filter(assignment => 
      assignment.id !== excludeId && 
      assignment.status !== 'draft' // draft 상태는 제외
    )
    .reduce((total, assignment) => total + assignment.scoreWeight, 0);
};

/**
 * 점수 비중 합계 검증
 * 100%를 초과하는지 확인
 */
export const validateScoreWeightTotal = (
  currentWeight: number,
  existingWeights: number[],
  maxWeight: number = 100
): { isValid: boolean; total: number; message?: string } => {
  const total = existingWeights.reduce((sum, weight) => sum + weight, 0) + currentWeight;
  
  if (total > maxWeight) {
    return {
      isValid: false,
      total,
      message: `점수 비중 합계가 ${maxWeight}%를 초과합니다. (현재: ${total}%)`
    };
  }

  return { isValid: true, total };
};

/**
 * 마감일 자동 처리 검증
 * 마감일이 지난 published 과제는 자동으로 closed 상태가 되어야 함
 */
export const shouldAutoClose = (assignment: InstructorAssignment): boolean => {
  return assignment.status === 'published' && isAssignmentOverdue(assignment.dueDate);
};

/**
 * 상태 전환 이력 포맷팅
 */
export const formatStatusChangeHistory = (logs: Array<{
  id: string;
  previousStatus: 'draft' | 'published' | 'closed';
  newStatus: 'draft' | 'published' | 'closed';
  changeReason: 'manual' | 'auto_close' | 'system';
  changedByName: string;
  createdAt: string;
  metadata?: Record<string, any>;
}>): Array<{
  id: string;
  description: string;
  timestamp: string;
  type: 'manual' | 'auto_close' | 'system';
  user: string;
  details?: string;
}> => {
  return logs.map(log => {
    let description = '';
    let details = '';

    // 상태 전환 설명 생성
    const fromStatus = getAssignmentStatusLabel(log.previousStatus);
    const toStatus = getAssignmentStatusLabel(log.newStatus);
    
    switch (log.changeReason) {
      case 'manual':
        description = `${fromStatus}에서 ${toStatus}로 수동 변경`;
        break;
      case 'auto_close':
        description = `마감일 도달로 자동 마감`;
        if (log.metadata?.dueDate) {
          details = `마감일: ${new Date(log.metadata.dueDate).toLocaleString('ko-KR')}`;
        }
        break;
      case 'system':
        description = `시스템에 의한 상태 변경`;
        break;
      default:
        description = `${fromStatus}에서 ${toStatus}로 변경`;
    }

    return {
      id: log.id,
      description,
      timestamp: log.createdAt,
      type: log.changeReason,
      user: log.changedByName,
      details,
    };
  });
};

/**
 * 자동 마감 대상 Assignment 필터링
 */
export const filterAutoCloseEligible = (assignments: Array<{
  id: string;
  status: 'draft' | 'published' | 'closed';
  dueDate: string;
}>): Array<{
  id: string;
  status: 'draft' | 'published' | 'closed';
  dueDate: string;
}> => {
  const now = new Date();
  
  return assignments.filter(assignment => {
    if (assignment.status !== 'published') {
      return false;
    }
    
    const dueDate = new Date(assignment.dueDate);
    return dueDate < now;
  });
};

/**
 * 동시성 충돌 감지
 */
export const detectConcurrentModification = (
  currentVersion: string,
  expectedVersion: string
): boolean => {
  return currentVersion !== expectedVersion;
};

/**
 * Assignment 상태 변경 가능 여부 검증 (확장)
 */
export const canChangeAssignmentStatus = (
  currentStatus: 'draft' | 'published' | 'closed',
  targetStatus: 'draft' | 'published' | 'closed',
  options: {
    dueDate?: string;
    hasSubmissions?: boolean;
    isOwner?: boolean;
  } = {}
): {
  canChange: boolean;
  reason?: string;
  warning?: string;
} => {
  const { dueDate, hasSubmissions = false, isOwner = true } = options;

  // 소유자 권한 확인
  if (!isOwner) {
    return {
      canChange: false,
      reason: '해당 과제에 대한 권한이 없습니다.',
    };
  }

  // 동일한 상태로의 전환 방지
  if (currentStatus === targetStatus) {
    return {
      canChange: false,
      reason: '동일한 상태로는 전환할 수 없습니다.',
    };
  }

  // 상태 전환 규칙 검증
  const validTransitions: Record<string, string[]> = {
    draft: ['published'],
    published: ['closed'],
    closed: ['published'], // 조건부 허용
  };

  if (!validTransitions[currentStatus]?.includes(targetStatus)) {
    return {
      canChange: false,
      reason: `${currentStatus}에서 ${targetStatus}로 상태 전환이 불가능합니다.`,
    };
  }

  // closed에서 published로 전환 시 마감일 검증
  if (currentStatus === 'closed' && targetStatus === 'published') {
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      const now = new Date();
      
      if (dueDateObj <= now) {
        return {
          canChange: false,
          reason: '마감일이 지난 과제는 다시 게시할 수 없습니다.',
        };
      }
    }
  }

  // 제출물이 있는 상태에서의 변경 경고
  if (hasSubmissions && targetStatus === 'draft') {
    return {
      canChange: true,
      warning: '제출물이 있는 과제를 초안으로 되돌리면 학습자가 과제를 볼 수 없게 됩니다.',
    };
  }

  if (hasSubmissions && currentStatus === 'published' && targetStatus === 'closed') {
    return {
      canChange: true,
      warning: '과제를 마감하면 더 이상 제출을 받을 수 없습니다.',
    };
  }

  return { canChange: true };
};

/**
 * Assignment 상태별 통계 계산
 */
export const calculateAssignmentStats = (assignments: Array<{
  status: 'draft' | 'published' | 'closed';
  submissionCount: number;
  gradedCount: number;
  dueDate: string;
}>): {
  total: number;
  draft: number;
  published: number;
  closed: number;
  overdue: number;
  needsGrading: number;
  completionRate: number;
} => {
  const now = new Date();
  
  const stats = assignments.reduce((acc, assignment) => {
    acc.total++;
    acc[assignment.status]++;
    
    if (assignment.status === 'published' && new Date(assignment.dueDate) < now) {
      acc.overdue++;
    }
    
    if (assignment.submissionCount > assignment.gradedCount) {
      acc.needsGrading++;
    }
    
    return acc;
  }, {
    total: 0,
    draft: 0,
    published: 0,
    closed: 0,
    overdue: 0,
    needsGrading: 0,
    completionRate: 0,
  });

  // 완료율 계산 (closed 상태의 과제 비율)
  stats.completionRate = stats.total > 0 ? (stats.closed / stats.total) * 100 : 0;

  return stats;
};

/**
 * 과제 수정 가능 여부 검증
 * 제출물이 있는 게시된 과제의 수정 제한 확인
 */
export const canEditAssignment = (
  assignment: InstructorAssignment | { id: string; status: AssignmentStatus; dueDate: string; submissionCount?: number },
  submissionCount: number = 0
): { canEdit: boolean; restrictions: string[] } => {
  const restrictions: string[] = [];

  // 제출물이 있는 게시된 과제의 경우
  if (assignment.status === 'published' && submissionCount > 0) {
    restrictions.push('제출물이 있는 게시된 과제는 일부 정보만 수정 가능합니다.');
    restrictions.push('마감일과 점수 비중은 수정할 수 없습니다.');
  }

  // 마감된 과제의 경우
  if (assignment.status === 'closed') {
    restrictions.push('마감된 과제는 상태 전환만 가능합니다.');
  }

  return {
    canEdit: restrictions.length === 0,
    restrictions
  };
};

/**
 * 과제 삭제 가능 여부 검증
 */
export const canDeleteAssignment = (
  assignment: InstructorAssignment | { id: string; status: AssignmentStatus; dueDate: string; submissionCount?: number },
  submissionCount: number = 0
): { canDelete: boolean; reason?: string } => {
  // 제출물이 있는 경우 삭제 불가
  if (submissionCount > 0) {
    return {
      canDelete: false,
      reason: '제출물이 있는 과제는 삭제할 수 없습니다.'
    };
  }

  // Draft 상태가 아니고 게시된 적이 있는 경우 주의 필요
  if (assignment.status !== 'draft') {
    return {
      canDelete: true,
      reason: '게시된 과제를 삭제하면 복구할 수 없습니다.'
    };
  }

  return { canDelete: true };
};

/**
 * 과제 진행률 계산
 * 제출률과 채점률 계산
 */
export const calculateAssignmentProgress = (
  assignment: InstructorAssignment | { submissionCount: number; gradedCount: number },
  totalEnrollments: number = 0
): {
  submissionRate: number;
  gradingRate: number;
  completionRate: number;
} => {
  const submissionRate = totalEnrollments > 0 
    ? Math.round((assignment.submissionCount / totalEnrollments) * 100)
    : 0;

  const gradingRate = assignment.submissionCount > 0
    ? Math.round((assignment.gradedCount / assignment.submissionCount) * 100)
    : 0;

  const completionRate = totalEnrollments > 0
    ? Math.round((assignment.gradedCount / totalEnrollments) * 100)
    : 0;

  return {
    submissionRate,
    gradingRate,
    completionRate
  };
};

/**
 * 과제 우선순위 계산
 * 마감일, 제출률, 채점률을 고려한 우선순위 점수
 */
export const calculateAssignmentPriority = (
  assignment: InstructorAssignment | { status: AssignmentStatus; dueDate: string; submissionCount: number; gradedCount: number },
  totalEnrollments: number = 0
): {
  priority: 'high' | 'medium' | 'low';
  score: number;
  reasons: string[];
} => {
  let score = 0;
  const reasons: string[] = [];

  // 마감일 기준 점수
  if (assignment.status === 'published') {
    const hoursUntilDue = (parseISO(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
      score += 50;
      reasons.push('24시간 이내 마감');
    } else if (hoursUntilDue <= 72 && hoursUntilDue > 0) {
      score += 30;
      reasons.push('3일 이내 마감');
    } else if (hoursUntilDue <= 0) {
      score += 70;
      reasons.push('마감일 경과');
    }
  }

  // 제출물 채점 필요 점수
  const ungradedCount = assignment.submissionCount - assignment.gradedCount;
  if (ungradedCount > 0) {
    score += Math.min(ungradedCount * 5, 30);
    reasons.push(`${ungradedCount}개 제출물 채점 필요`);
  }

  // 제출률이 낮은 경우
  const { submissionRate } = calculateAssignmentProgress(assignment, totalEnrollments);
  if (assignment.status === 'published' && submissionRate < 50) {
    score += 20;
    reasons.push('낮은 제출률');
  }

  // 우선순위 결정
  let priority: 'high' | 'medium' | 'low';
  if (score >= 60) {
    priority = 'high';
  } else if (score >= 30) {
    priority = 'medium';
  } else {
    priority = 'low';
  }

  return { priority, score, reasons };
};

/**
 * 과제 상태별 액션 버튼 정보
 */
export const getAssignmentActions = (
  assignment: InstructorAssignment | { id: string; status: AssignmentStatus; dueDate: string; submissionCount?: number },
  submissionCount: number = 0
): {
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canClose: boolean;
  canReopen: boolean;
  primaryAction?: 'edit' | 'publish' | 'close' | 'view-submissions';
} => {
  const { canEdit } = canEditAssignment(assignment, submissionCount);
  const { canDelete } = canDeleteAssignment(assignment, submissionCount);

  const actions = {
    canEdit,
    canDelete,
    canPublish: assignment.status === 'draft',
    canClose: assignment.status === 'published',
    canReopen: assignment.status === 'closed' && !isAssignmentOverdue(assignment.dueDate),
    primaryAction: undefined as 'edit' | 'publish' | 'close' | 'view-submissions' | undefined,
  };

  // 주요 액션 결정
  if (assignment.status === 'draft') {
    actions.primaryAction = 'publish';
  } else if (assignment.status === 'published' && submissionCount > 0) {
    actions.primaryAction = 'view-submissions';
  } else if (assignment.status === 'published') {
    actions.primaryAction = 'edit';
  } else if (assignment.status === 'closed' && submissionCount > 0) {
    actions.primaryAction = 'view-submissions';
  }

  return actions;
};

/**
 * 과제 목록 정렬 함수
 */
export const sortAssignments = (
  assignments: InstructorAssignment[],
  sortBy: 'dueDate' | 'status' | 'priority' | 'submissionCount' | 'updatedAt' = 'updatedAt',
  order: 'asc' | 'desc' = 'desc'
): InstructorAssignment[] => {
  return [...assignments].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'dueDate':
        comparison = parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
        break;
      case 'status':
        const statusOrder = { draft: 0, published: 1, closed: 2 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
        break;
      case 'priority':
        const aPriority = calculateAssignmentPriority(a);
        const bPriority = calculateAssignmentPriority(b);
        comparison = bPriority.score - aPriority.score; // 높은 우선순위가 먼저
        break;
      case 'submissionCount':
        comparison = a.submissionCount - b.submissionCount;
        break;
      case 'updatedAt':
      default:
        comparison = parseISO(a.updatedAt).getTime() - parseISO(b.updatedAt).getTime();
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * 과제 필터링 함수
 */
export const filterAssignments = (
  assignments: InstructorAssignment[],
  filters: {
    status?: AssignmentStatus;
    hasSubmissions?: boolean;
    needsGrading?: boolean;
    overdue?: boolean;
    search?: string;
  }
): InstructorAssignment[] => {
  return assignments.filter(assignment => {
    // 상태 필터
    if (filters.status && assignment.status !== filters.status) {
      return false;
    }

    // 제출물 존재 여부 필터
    if (filters.hasSubmissions !== undefined) {
      const hasSubmissions = assignment.submissionCount > 0;
      if (filters.hasSubmissions !== hasSubmissions) {
        return false;
      }
    }

    // 채점 필요 여부 필터
    if (filters.needsGrading !== undefined) {
      const needsGrading = assignment.submissionCount > assignment.gradedCount;
      if (filters.needsGrading !== needsGrading) {
        return false;
      }
    }

    // 마감일 경과 필터
    if (filters.overdue !== undefined) {
      const isOverdue = isAssignmentOverdue(assignment.dueDate);
      if (filters.overdue !== isOverdue) {
        return false;
      }
    }

    // 검색어 필터
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const titleMatch = assignment.title.toLowerCase().includes(searchLower);
      const descriptionMatch = assignment.description.toLowerCase().includes(searchLower);
      if (!titleMatch && !descriptionMatch) {
        return false;
      }
    }

    return true;
  });
};
