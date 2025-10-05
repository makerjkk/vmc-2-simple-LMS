import type { SupabaseClient } from '@supabase/supabase-js';

// 코스 필터 타입 정의
export interface CourseFilters {
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

// 정렬 옵션 타입 정의
export type SortOption = 'latest' | 'popular';

/**
 * 검색어 정규화 함수
 * 공백 제거, 특수문자 처리, SQL 인젝션 방지
 */
export const sanitizeSearchTerm = (term: string): string => {
  if (!term || typeof term !== 'string') {
    return '';
  }
  
  // 앞뒤 공백 제거 및 연속된 공백을 하나로 변환
  const sanitized = term.trim().replace(/\s+/g, ' ');
  
  // 빈 문자열이거나 너무 짧은 경우 빈 문자열 반환
  if (sanitized.length < 1) {
    return '';
  }
  
  // 특수문자는 허용하되 SQL 인젝션 방지를 위해 따옴표 이스케이프
  return sanitized.replace(/'/g, "''");
};

/**
 * 검색 쿼리 빌더
 * 코스 제목과 설명에서 검색
 */
export const buildSearchQuery = (
  query: any,
  searchTerm: string
) => {
  const sanitized = sanitizeSearchTerm(searchTerm);
  
  if (!sanitized) {
    return query;
  }
  
  // PostgreSQL의 ILIKE를 사용하여 대소문자 구분 없는 검색
  return query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
};

/**
 * 필터 쿼리 빌더
 * 카테고리와 난이도 필터 적용
 */
export const buildFilterQuery = (
  query: any,
  filters: CourseFilters
) => {
  let filteredQuery = query;
  
  // 카테고리 필터
  if (filters.category) {
    filteredQuery = filteredQuery.eq('category_id', filters.category);
  }
  
  // 난이도 필터
  if (filters.difficulty) {
    filteredQuery = filteredQuery.eq('difficulty', filters.difficulty);
  }
  
  return filteredQuery;
};

/**
 * 정렬 쿼리 빌더
 * 최신순 또는 인기순 정렬
 */
export const buildSortQuery = (
  query: any,
  sortBy: SortOption
) => {
  switch (sortBy) {
    case 'latest':
      return query.order('created_at', { ascending: false });
    case 'popular':
      return query.order('enrollment_count', { ascending: false });
    default:
      return query.order('created_at', { ascending: false });
  }
};

/**
 * 페이지네이션 쿼리 빌더
 */
export const buildPaginationQuery = (
  query: any,
  page: number = 1,
  limit: number = 20
) => {
  const offset = (page - 1) * limit;
  return query.range(offset, offset + limit - 1);
};

/**
 * 코스 검색을 위한 통합 쿼리 빌더
 */
export const buildCoursesQuery = (
  client: SupabaseClient,
  searchTerm?: string,
  filters?: CourseFilters,
  sortBy: SortOption = 'latest',
  page: number = 1,
  limit: number = 20
) => {
  let query = client
    .from('courses')
    .select(`
      id,
      title,
      description,
      difficulty,
      status,
      enrollment_count,
      average_rating,
      created_at,
      instructor:users!courses_instructor_id_fkey(
        id,
        full_name
      ),
      category:categories(
        id,
        name
      )
    `)
    .eq('status', 'published'); // published 상태의 코스만 조회
  
  // 검색어 적용
  if (searchTerm) {
    query = buildSearchQuery(query, searchTerm);
  }
  
  // 필터 적용
  if (filters) {
    query = buildFilterQuery(query, filters);
  }
  
  // 정렬 적용
  query = buildSortQuery(query, sortBy);
  
  // 페이지네이션 적용
  query = buildPaginationQuery(query, page, limit);
  
  return query;
};
