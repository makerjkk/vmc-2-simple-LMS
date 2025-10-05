/**
 * 메타데이터 관리 관련 DTO 재노출
 * 백엔드 스키마를 프론트엔드에서 사용할 수 있도록 재노출
 */

export type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryParams,
  CategoryResponse,
  CategoriesListResponse,
  CategoryUsageResponse,
  DifficultyMetadataResponse,
} from '@/features/metadata/backend/schema';

export {
  CreateCategoryRequestSchema,
  UpdateCategoryRequestSchema,
  CategoryParamsSchema,
  CategoryResponseSchema,
  CategoriesListResponseSchema,
  CategoryUsageResponseSchema,
  DifficultyMetadataResponseSchema,
} from '@/features/metadata/backend/schema';
