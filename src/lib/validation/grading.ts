import { z } from 'zod';

/**
 * 채점 관련 검증 스키마 및 유틸리티
 */

/**
 * 점수 검증 스키마
 */
export const ScoreSchema = z
  .number({
    required_error: '점수를 입력해주세요.',
    invalid_type_error: '점수는 숫자여야 합니다.',
  })
  .min(0, '점수는 0 이상이어야 합니다.')
  .max(100, '점수는 100 이하여야 합니다.')
  .refine((val) => !isNaN(val), {
    message: '유효한 점수를 입력해주세요.',
  });

/**
 * 피드백 검증 스키마
 */
export const FeedbackSchema = z
  .string({
    required_error: '피드백을 입력해주세요.',
    invalid_type_error: '피드백은 문자열이어야 합니다.',
  })
  .min(1, '피드백을 입력해주세요.')
  .max(2000, '피드백은 2000자를 초과할 수 없습니다.')
  .trim();

/**
 * 채점 액션 검증 스키마
 */
export const GradingActionSchema = z.enum(['grade', 'request_resubmission'], {
  errorMap: () => ({ message: '유효하지 않은 채점 액션입니다.' }),
});

/**
 * 채점 폼 데이터 검증 스키마
 */
export const GradingFormSchema = z
  .object({
    score: ScoreSchema.optional(),
    feedback: FeedbackSchema,
    action: GradingActionSchema,
  })
  .refine(
    (data) => {
      // 채점 완료 시 점수 필수
      if (data.action === 'grade' && (data.score === undefined || data.score === null)) {
        return false;
      }
      return true;
    },
    {
      message: '채점 완료 시 점수를 입력해야 합니다.',
      path: ['score'],
    }
  )
  .refine(
    (data) => {
      // 재제출 요청 시 점수 불필요
      if (data.action === 'request_resubmission' && data.score !== undefined) {
        return false;
      }
      return true;
    },
    {
      message: '재제출 요청 시에는 점수를 입력하지 마세요.',
      path: ['score'],
    }
  );

export type GradingFormData = z.infer<typeof GradingFormSchema>;

/**
 * 채점 상태 검증 스키마
 */
export const SubmissionStatusSchema = z.enum(
  ['submitted', 'graded', 'resubmission_required'],
  {
    errorMap: () => ({ message: '유효하지 않은 제출물 상태입니다.' }),
  }
);

/**
 * 채점 필터 검증 스키마
 */
export const GradingFilterSchema = z.object({
  status: SubmissionStatusSchema.optional(),
  isLate: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GradingFilterData = z.infer<typeof GradingFilterSchema>;

/**
 * 점수 유효성 검증 함수
 * @param score 검증할 점수
 * @returns 검증 결과
 */
export const validateScore = (score: unknown): score is number => {
  const result = ScoreSchema.safeParse(score);
  return result.success;
};

/**
 * 피드백 유효성 검증 함수
 * @param feedback 검증할 피드백
 * @returns 검증 결과
 */
export const validateFeedback = (feedback: unknown): feedback is string => {
  const result = FeedbackSchema.safeParse(feedback);
  return result.success;
};

/**
 * 채점 액션 유효성 검증 함수
 * @param action 검증할 액션
 * @returns 검증 결과
 */
export const validateGradingAction = (
  action: unknown
): action is 'grade' | 'request_resubmission' => {
  const result = GradingActionSchema.safeParse(action);
  return result.success;
};

/**
 * 채점 폼 데이터 유효성 검증 함수
 * @param data 검증할 폼 데이터
 * @returns 검증 결과
 */
export const validateGradingForm = (data: unknown): data is GradingFormData => {
  const result = GradingFormSchema.safeParse(data);
  return result.success;
};

/**
 * 점수 범위 검증 함수
 * @param score 점수
 * @param min 최소값
 * @param max 최대값
 * @returns 검증 결과
 */
export const isScoreInRange = (score: number, min: number = 0, max: number = 100): boolean => {
  return score >= min && score <= max;
};

/**
 * 피드백 길이 검증 함수
 * @param feedback 피드백
 * @param maxLength 최대 길이
 * @returns 검증 결과
 */
export const isFeedbackValidLength = (feedback: string, maxLength: number = 2000): boolean => {
  return feedback.trim().length > 0 && feedback.length <= maxLength;
};

/**
 * 채점 데이터 정규화 함수
 * @param data 원본 데이터
 * @returns 정규화된 데이터
 */
export const normalizeGradingData = (data: {
  score?: number | string;
  feedback?: string;
  action?: string;
}): {
  score?: number;
  feedback: string;
  action: 'grade' | 'request_resubmission';
} => {
  const normalizedScore = typeof data.score === 'string' 
    ? parseFloat(data.score) 
    : data.score;

  const normalizedFeedback = (data.feedback || '').trim();

  const normalizedAction = data.action === 'grade' || data.action === 'request_resubmission'
    ? data.action
    : 'grade';

  return {
    score: normalizedScore,
    feedback: normalizedFeedback,
    action: normalizedAction,
  };
};

/**
 * 채점 에러 메시지 생성 함수
 * @param field 필드명
 * @param value 값
 * @returns 에러 메시지
 */
export const getGradingValidationError = (field: string, value: unknown): string | null => {
  switch (field) {
    case 'score':
      if (typeof value !== 'number') return '점수는 숫자여야 합니다.';
      if (value < 0) return '점수는 0 이상이어야 합니다.';
      if (value > 100) return '점수는 100 이하여야 합니다.';
      if (isNaN(value)) return '유효한 점수를 입력해주세요.';
      return null;

    case 'feedback':
      if (typeof value !== 'string') return '피드백은 문자열이어야 합니다.';
      if (value.trim().length === 0) return '피드백을 입력해주세요.';
      if (value.length > 2000) return '피드백은 2000자를 초과할 수 없습니다.';
      return null;

    case 'action':
      if (value !== 'grade' && value !== 'request_resubmission') {
        return '유효하지 않은 채점 액션입니다.';
      }
      return null;

    default:
      return '알 수 없는 필드입니다.';
  }
};

/**
 * 채점 데이터 완전성 검증 함수
 * @param data 채점 데이터
 * @returns 검증 결과 및 에러 메시지
 */
export const validateGradingDataCompleteness = (data: {
  score?: number;
  feedback?: string;
  action?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // 피드백 필수 검증
  if (!data.feedback || data.feedback.trim().length === 0) {
    errors.push('피드백을 입력해주세요.');
  }

  // 액션 필수 검증
  if (!data.action) {
    errors.push('채점 액션을 선택해주세요.');
  }

  // 채점 완료 시 점수 필수 검증
  if (data.action === 'grade' && (data.score === undefined || data.score === null)) {
    errors.push('채점 완료 시 점수를 입력해야 합니다.');
  }

  // 재제출 요청 시 점수 불필요 검증
  if (data.action === 'request_resubmission' && data.score !== undefined) {
    errors.push('재제출 요청 시에는 점수를 입력하지 마세요.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
