import { z } from 'zod';

/**
 * 카테고리 생성 요청 스키마
 */
export const CreateCategoryRequestSchema = z.object({
  name: z.string()
    .min(1, '카테고리 이름을 입력해주세요.')
    .max(50, '카테고리 이름은 50자 이하여야 합니다.')
    .regex(/^[가-힣a-zA-Z0-9\s\-_]+$/, '카테고리 이름에 특수문자는 사용할 수 없습니다.'),
  description: z.string()
    .max(500, '설명은 500자 이하여야 합니다.')
    .optional(),
});

export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;

/**
 * 카테고리 수정 요청 스키마
 */
export const UpdateCategoryRequestSchema = z.object({
  name: z.string()
    .min(1, '카테고리 이름을 입력해주세요.')
    .max(50, '카테고리 이름은 50자 이하여야 합니다.')
    .regex(/^[가-힣a-zA-Z0-9\s\-_]+$/, '카테고리 이름에 특수문자는 사용할 수 없습니다.')
    .optional(),
  description: z.string()
    .max(500, '설명은 500자 이하여야 합니다.')
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>;

/**
 * 카테고리 파라미터 스키마 (URL 파라미터)
 */
export const CategoryParamsSchema = z.object({
  id: z.string().uuid('유효하지 않은 카테고리 ID입니다.'),
});

export type CategoryParams = z.infer<typeof CategoryParamsSchema>;

/**
 * 카테고리 응답 스키마
 */
export const CategoryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  courseCount: z.number().int().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;

/**
 * 카테고리 목록 응답 스키마
 */
export const CategoriesListResponseSchema = z.object({
  categories: z.array(CategoryResponseSchema),
  total: z.number().int().min(0),
});

export type CategoriesListResponse = z.infer<typeof CategoriesListResponseSchema>;

/**
 * 카테고리 사용 현황 응답 스키마
 */
export const CategoryUsageResponseSchema = z.object({
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  courseCount: z.number().int().min(0),
  courses: z.array(z.object({
    id: z.string().uuid(),
    title: z.string(),
    status: z.enum(['draft', 'published', 'archived']),
    instructorName: z.string(),
  })),
  canDelete: z.boolean(),
  canDeactivate: z.boolean(),
});

export type CategoryUsageResponse = z.infer<typeof CategoryUsageResponseSchema>;

/**
 * 난이도 메타데이터 응답 스키마
 */
export const DifficultyMetadataResponseSchema = z.object({
  difficulties: z.array(z.object({
    value: z.enum(['beginner', 'intermediate', 'advanced']),
    label: z.string(),
    description: z.string(),
    courseCount: z.number().int().min(0),
  })),
});

export type DifficultyMetadataResponse = z.infer<typeof DifficultyMetadataResponseSchema>;
