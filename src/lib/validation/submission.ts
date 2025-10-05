/**
 * 제출물 관련 공통 검증 로직
 * 클라이언트와 서버에서 공통으로 사용되는 검증 함수들
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * URL 검증
 * 선택적 필드이므로 빈 값이나 null은 허용
 */
export const validateSubmissionUrl = (url?: string | null): ValidationResult => {
  // 빈 값이나 null은 유효 (선택적 필드)
  if (!url || url.trim() === '') {
    return { isValid: true };
  }

  try {
    // URL 객체로 파싱하여 유효성 검증
    new URL(url);
    return { isValid: true };
  } catch {
    return { 
      isValid: false, 
      message: '올바른 URL 형식을 입력해주세요.' 
    };
  }
};

/**
 * 제출 내용 검증
 * 필수 필드이므로 빈 값 불허, 최대 길이 제한
 */
export const validateSubmissionContent = (content: string): ValidationResult => {
  if (!content || content.trim() === '') {
    return { 
      isValid: false, 
      message: '과제 내용을 입력해주세요.' 
    };
  }

  if (content.length > 5000) {
    return { 
      isValid: false, 
      message: '내용이 너무 깁니다. (최대 5000자)' 
    };
  }

  return { isValid: true };
};

/**
 * 제출 가능 여부 검증
 * 과제 상태, 마감일, 정책 등을 종합적으로 판단
 */
export const canSubmitAssignment = (
  assignment: {
    status: 'draft' | 'published' | 'closed';
    dueDate: string;
    allowLateSubmission: boolean;
    allowResubmission: boolean;
  },
  existingSubmission?: {
    status: 'submitted' | 'graded' | 'resubmission_required';
  } | null
): { canSubmit: boolean; reason?: string } => {
  // 1. 과제 상태 확인
  if (assignment.status !== 'published') {
    return {
      canSubmit: false,
      reason: assignment.status === 'draft' 
        ? '아직 공개되지 않은 과제입니다.'
        : '마감된 과제는 제출할 수 없습니다.'
    };
  }

  // 2. 기존 제출물이 있는 경우
  if (existingSubmission) {
    // 재제출이 허용되지 않는 경우
    if (!assignment.allowResubmission) {
      return {
        canSubmit: false,
        reason: '재제출이 허용되지 않는 과제입니다.'
      };
    }

    // 재제출 요청 상태가 아닌 경우 (이미 채점 완료된 경우)
    if (existingSubmission.status === 'graded') {
      return {
        canSubmit: false,
        reason: '이미 채점이 완료된 과제입니다.'
      };
    }
  }

  // 3. 마감일 확인
  const now = new Date();
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = now > dueDate;

  if (isOverdue && !assignment.allowLateSubmission) {
    return {
      canSubmit: false,
      reason: '마감일이 지나 제출할 수 없습니다.'
    };
  }

  return { canSubmit: true };
};

/**
 * 재제출 가능 여부 검증
 * 기존 제출물 상태와 과제 정책을 확인
 */
export const canResubmitAssignment = (
  assignment: {
    status: 'draft' | 'published' | 'closed';
    dueDate: string;
    allowLateSubmission: boolean;
    allowResubmission: boolean;
  },
  submission: {
    status: 'submitted' | 'graded' | 'resubmission_required';
  }
): { canResubmit: boolean; reason?: string } => {
  // 1. 재제출 허용 정책 확인
  if (!assignment.allowResubmission) {
    return {
      canResubmit: false,
      reason: '재제출이 허용되지 않는 과제입니다.'
    };
  }

  // 2. 과제 상태 확인
  if (assignment.status === 'closed') {
    return {
      canResubmit: false,
      reason: '마감된 과제는 재제출할 수 없습니다.'
    };
  }

  if (assignment.status !== 'published') {
    return {
      canResubmit: false,
      reason: '아직 공개되지 않은 과제입니다.'
    };
  }

  // 3. 제출물 상태 확인
  if (submission.status === 'graded') {
    return {
      canResubmit: false,
      reason: '이미 채점이 완료된 과제입니다.'
    };
  }

  // 4. 마감일 확인
  const now = new Date();
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = now > dueDate;

  if (isOverdue && !assignment.allowLateSubmission) {
    return {
      canResubmit: false,
      reason: '마감일이 지나 재제출할 수 없습니다.'
    };
  }

  return { canResubmit: true };
};

/**
 * 제출물 데이터 전체 검증
 * 폼 제출 시 사용하는 종합 검증 함수
 */
export const validateSubmissionData = (data: {
  content: string;
  linkUrl?: string | null;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // 내용 검증
  const contentValidation = validateSubmissionContent(data.content);
  if (!contentValidation.isValid && contentValidation.message) {
    errors.content = contentValidation.message;
  }

  // URL 검증
  const urlValidation = validateSubmissionUrl(data.linkUrl);
  if (!urlValidation.isValid && urlValidation.message) {
    errors.linkUrl = urlValidation.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
