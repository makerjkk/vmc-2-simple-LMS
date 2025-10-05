import { z } from 'zod';

/**
 * 과제 관련 폼 검증 스키마
 */

// 과제 생성/수정 폼 검증 스키마
export const assignmentFormSchema = z.object({
  title: z
    .string()
    .min(3, '제목은 3자 이상이어야 합니다.')
    .max(200, '제목은 200자를 초과할 수 없습니다.')
    .trim(),
  
  description: z
    .string()
    .min(10, '설명은 10자 이상이어야 합니다.')
    .max(5000, '설명은 5000자를 초과할 수 없습니다.')
    .trim(),
  
  dueDate: z
    .date({
      required_error: '마감일을 선택해주세요.',
      invalid_type_error: '올바른 날짜를 선택해주세요.',
    })
    .min(new Date(), '마감일은 현재 시점 이후여야 합니다.'),
  
  scoreWeight: z
    .number({
      required_error: '점수 비중을 입력해주세요.',
      invalid_type_error: '올바른 숫자를 입력해주세요.',
    })
    .min(0, '점수 비중은 0 이상이어야 합니다.')
    .max(100, '점수 비중은 100을 초과할 수 없습니다.')
    .multipleOf(0.01, '점수 비중은 소수점 둘째 자리까지 입력 가능합니다.'),
  
  allowLateSubmission: z
    .boolean()
    .default(false),
  
  allowResubmission: z
    .boolean()
    .default(false),
});

export type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

// 과제 수정 폼 검증 스키마 (모든 필드 선택적)
export const assignmentUpdateFormSchema = assignmentFormSchema.partial();

export type AssignmentUpdateFormData = z.infer<typeof assignmentUpdateFormSchema>;

// 과제 상태 전환 검증 스키마
export const assignmentStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'closed'], {
    required_error: '상태를 선택해주세요.',
    invalid_type_error: '유효하지 않은 상태입니다.',
  }),
});

export type AssignmentStatusData = z.infer<typeof assignmentStatusSchema>;

// 과제 필터 검증 스키마
export const assignmentFilterSchema = z.object({
  status: z.enum(['draft', 'published', 'closed']).optional(),
  hasSubmissions: z.boolean().optional(),
  needsGrading: z.boolean().optional(),
  overdue: z.boolean().optional(),
  search: z.string().trim().optional(),
});

export type AssignmentFilterData = z.infer<typeof assignmentFilterSchema>;

// 과제 정렬 검증 스키마
export const assignmentSortSchema = z.object({
  sortBy: z.enum(['dueDate', 'status', 'priority', 'submissionCount', 'updatedAt']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type AssignmentSortData = z.infer<typeof assignmentSortSchema>;

// 점수 비중 검증 함수
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

  if (total < 0) {
    return {
      isValid: false,
      total,
      message: '점수 비중 합계는 0% 이상이어야 합니다.'
    };
  }

  return { isValid: true, total };
};

// 마감일 검증 함수
export const validateDueDate = (
  dueDate: Date,
  allowPastDate: boolean = false
): { isValid: boolean; message?: string } => {
  const now = new Date();
  
  if (!allowPastDate && dueDate <= now) {
    return {
      isValid: false,
      message: '마감일은 현재 시점 이후여야 합니다.'
    };
  }

  // 너무 먼 미래 (1년 후)인지 확인
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (dueDate > oneYearFromNow) {
    return {
      isValid: false,
      message: '마감일은 1년 이내로 설정해주세요.'
    };
  }

  return { isValid: true };
};

// 과제 제목 중복 검증 함수
export const validateAssignmentTitle = (
  title: string,
  existingTitles: string[],
  currentTitle?: string
): { isValid: boolean; message?: string } => {
  const trimmedTitle = title.trim();
  
  if (trimmedTitle.length < 3) {
    return {
      isValid: false,
      message: '제목은 3자 이상이어야 합니다.'
    };
  }

  if (trimmedTitle.length > 200) {
    return {
      isValid: false,
      message: '제목은 200자를 초과할 수 없습니다.'
    };
  }

  // 현재 제목과 동일한 경우는 제외
  const otherTitles = existingTitles.filter(t => t !== currentTitle);
  
  if (otherTitles.some(t => t.toLowerCase() === trimmedTitle.toLowerCase())) {
    return {
      isValid: false,
      message: '이미 존재하는 과제 제목입니다.'
    };
  }

  return { isValid: true };
};

// 과제 설명 검증 함수
export const validateAssignmentDescription = (
  description: string
): { isValid: boolean; message?: string } => {
  const trimmedDescription = description.trim();
  
  if (trimmedDescription.length < 10) {
    return {
      isValid: false,
      message: '설명은 10자 이상이어야 합니다.'
    };
  }

  if (trimmedDescription.length > 5000) {
    return {
      isValid: false,
      message: '설명은 5000자를 초과할 수 없습니다.'
    };
  }

  return { isValid: true };
};

// 과제 폼 전체 검증 함수
export const validateAssignmentForm = (
  data: Partial<AssignmentFormData>,
  options: {
    existingTitles?: string[];
    currentTitle?: string;
    existingWeights?: number[];
    maxWeight?: number;
    allowPastDate?: boolean;
  } = {}
): {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
} => {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // 제목 검증
  if (data.title !== undefined) {
    const titleValidation = validateAssignmentTitle(
      data.title,
      options.existingTitles || [],
      options.currentTitle
    );
    if (!titleValidation.isValid && titleValidation.message) {
      errors.title = titleValidation.message;
    }
  }

  // 설명 검증
  if (data.description !== undefined) {
    const descriptionValidation = validateAssignmentDescription(data.description);
    if (!descriptionValidation.isValid && descriptionValidation.message) {
      errors.description = descriptionValidation.message;
    }
  }

  // 마감일 검증
  if (data.dueDate !== undefined) {
    const dueDateValidation = validateDueDate(data.dueDate, options.allowPastDate);
    if (!dueDateValidation.isValid && dueDateValidation.message) {
      errors.dueDate = dueDateValidation.message;
    }
  }

  // 점수 비중 검증
  if (data.scoreWeight !== undefined) {
    if (data.scoreWeight < 0 || data.scoreWeight > 100) {
      errors.scoreWeight = '점수 비중은 0-100 사이의 값이어야 합니다.';
    } else if (options.existingWeights) {
      const weightValidation = validateScoreWeightTotal(
        data.scoreWeight,
        options.existingWeights,
        options.maxWeight
      );
      if (!weightValidation.isValid && weightValidation.message) {
        if (weightValidation.total > 100) {
          warnings.push(weightValidation.message);
        } else {
          errors.scoreWeight = weightValidation.message;
        }
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
  };
};

// 과제 상태 전환 검증 함수
export const validateStatusTransition = (
  currentStatus: 'draft' | 'published' | 'closed',
  newStatus: 'draft' | 'published' | 'closed',
  options: {
    hasSubmissions?: boolean;
    dueDate?: Date;
  } = {}
): { isValid: boolean; message?: string; warning?: string } => {
  // 동일한 상태로는 전환 불가
  if (currentStatus === newStatus) {
    return {
      isValid: false,
      message: '동일한 상태로는 전환할 수 없습니다.'
    };
  }

  // 허용되는 상태 전환 규칙
  const validTransitions: Record<string, string[]> = {
    draft: ['published'],
    published: ['closed'],
    closed: ['published'], // 조건부 허용
  };

  const allowedNextStates = validTransitions[currentStatus];
  if (!allowedNextStates.includes(newStatus)) {
    return {
      isValid: false,
      message: `${currentStatus}에서 ${newStatus}로 상태 전환이 불가능합니다.`
    };
  }

  // closed에서 published로 전환 시 마감일 검증
  if (currentStatus === 'closed' && newStatus === 'published') {
    if (!options.dueDate) {
      return {
        isValid: false,
        message: '마감일 정보가 필요합니다.'
      };
    }
    
    if (options.dueDate <= new Date()) {
      return {
        isValid: false,
        message: '마감일이 지난 과제는 다시 게시할 수 없습니다.'
      };
    }
  }

  // published에서 closed로 전환 시 제출물 영향 경고
  if (currentStatus === 'published' && newStatus === 'closed' && options.hasSubmissions) {
    return {
      isValid: true,
      warning: '과제를 마감하면 더 이상 제출을 받을 수 없습니다.'
    };
  }

  return { isValid: true };
};

// 과제 삭제 검증 함수
export const validateAssignmentDeletion = (
  assignment: {
    status: 'draft' | 'published' | 'closed';
    submissionCount: number;
  }
): { canDelete: boolean; message?: string; warning?: string } => {
  // 제출물이 있는 경우 삭제 불가
  if (assignment.submissionCount > 0) {
    return {
      canDelete: false,
      message: '제출물이 있는 과제는 삭제할 수 없습니다.'
    };
  }

  // Draft 상태가 아닌 경우 경고
  if (assignment.status !== 'draft') {
    return {
      canDelete: true,
      warning: '게시된 과제를 삭제하면 복구할 수 없습니다.'
    };
  }

  return { canDelete: true };
};
