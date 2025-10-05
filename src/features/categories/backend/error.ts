/**
 * Categories 관련 에러 코드 정의
 */
export const categoriesErrorCodes = {
  fetchError: 'CATEGORIES_FETCH_ERROR',
  databaseError: 'CATEGORIES_DATABASE_ERROR',
  notFound: 'CATEGORIES_NOT_FOUND',
} as const;

/**
 * Categories 서비스 에러 타입
 */
export type CategoriesServiceError = typeof categoriesErrorCodes[keyof typeof categoriesErrorCodes];
