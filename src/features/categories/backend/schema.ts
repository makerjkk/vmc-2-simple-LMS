import { z } from 'zod';

/**
 * 카테고리 스키마
 */
export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * 카테고리 목록 응답 스키마
 */
export const CategoriesResponseSchema = z.object({
  categories: z.array(CategorySchema),
});

/**
 * 데이터베이스 테이블 행 스키마
 */
export const CategoryTableRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

// 타입 추출
export type Category = z.infer<typeof CategorySchema>;
export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>;
export type CategoryTableRow = z.infer<typeof CategoryTableRowSchema>;
