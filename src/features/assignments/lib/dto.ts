/**
 * 과제 및 제출물 관련 DTO (Data Transfer Object)
 * 백엔드 스키마를 프론트엔드에서 재사용하기 위한 재노출
 */

// 백엔드 스키마에서 타입 재노출
export type {
  CreateSubmissionRequest,
  UpdateSubmissionRequest,
  SubmissionResponse,
  AssignmentDetailResponse,
} from '../backend/schema';

// 백엔드 스키마 재노출
export {
  CreateSubmissionRequestSchema,
  UpdateSubmissionRequestSchema,
  SubmissionResponseSchema,
  AssignmentDetailResponseSchema,
} from '../backend/schema';