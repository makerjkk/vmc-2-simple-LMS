// 백엔드 스키마를 프론트엔드에서 재사용하기 위한 DTO 재노출
export {
  EnrollmentRequestSchema,
  EnrollmentDeleteParamsSchema,
  EnrollmentResponseSchema,
  EnrollmentStatusResponseSchema,
  type EnrollmentRequest,
  type EnrollmentDeleteParams,
  type EnrollmentResponse,
  type EnrollmentStatusResponse,
} from '@/features/enrollments/backend/schema';
