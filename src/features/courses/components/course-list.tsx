'use client';

import { useState, useEffect, useCallback } from 'react';
import { CourseCard } from './course-card';
import { CourseFilters } from './course-filters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useCoursesQuery } from '../hooks/useCoursesQuery';
import { useEnrollment } from '@/features/enrollments/hooks/useEnrollment';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ToastAction } from '@/components/ui/toast';
import type { CourseFilters as CourseFiltersType, SortOption } from '@/lib/utils/search';
import type { CoursesQueryParams } from '../lib/dto';

interface CourseListProps {
  initialParams?: CoursesQueryParams;
  showEnrollButtons?: boolean;
}

/**
 * 코스 목록 컴포넌트
 * 검색, 필터링, 정렬 기능과 함께 코스 목록을 표시
 */
export const CourseList = ({
  initialParams = {},
  showEnrollButtons = false,
}: CourseListProps) => {
  const { toast } = useToast();
  const router = useRouter();
  const { enroll, isEnrolling } = useEnrollment();
  
  // 카테고리 데이터 로딩
  const { data: categoriesData } = useCategories();

  // 쿼리 파라미터 상태
  const [queryParams, setQueryParams] = useState<CoursesQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'latest',
    ...initialParams,
  });

  // 코스 목록 조회
  const {
    data: coursesData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCoursesQuery(queryParams);

  // 검색어 변경 처리 (useCallback으로 최적화)
  const handleSearchChange = useCallback((search: string) => {
    setQueryParams(prev => ({
      ...prev,
      search: search || undefined,
      page: 1, // 검색 시 첫 페이지로 리셋
    }));
  }, []);

  // 필터 변경 처리 (useCallback으로 최적화)
  const handleFilterChange = useCallback((filters: CourseFiltersType) => {
    setQueryParams(prev => ({
      ...prev,
      category: filters.category || undefined,
      difficulty: filters.difficulty || undefined,
      page: 1, // 필터 변경 시 첫 페이지로 리셋
    }));
  }, []);

  // 정렬 변경 처리 (useCallback으로 최적화)
  const handleSortChange = useCallback((sortBy: SortOption) => {
    setQueryParams(prev => ({
      ...prev,
      sortBy,
      page: 1, // 정렬 변경 시 첫 페이지로 리셋
    }));
  }, []);

  // 페이지 변경 처리 (useCallback으로 최적화)
  const handlePageChange = useCallback((page: number) => {
    setQueryParams(prev => ({
      ...prev,
      page,
    }));
  }, []);

  // 수강신청 처리
  const handleEnrollClick = async (courseId: string) => {
    try {
      await enroll(courseId);
      toast({
        title: '🎉 수강신청 완료!',
        description: '수강신청이 완료되었습니다. 이제 학습을 시작할 수 있습니다!',
        duration: 5000,
        action: (
          <ToastAction 
            altText="학습하기"
            onClick={() => router.push('/dashboard')}
          >
            학습하기
          </ToastAction>
        ),
      });
      // 목록 새로고침 (수강생 수 업데이트를 위해)
      refetch();
    } catch (error) {
      toast({
        title: '❌ 수강신청 실패',
        description: error instanceof Error ? error.message : '수강신청 중 오류가 발생했습니다.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-6">
        <CourseFilters
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          initialSearch={queryParams.search}
          initialFilters={{
            category: queryParams.category,
            difficulty: queryParams.difficulty,
          }}
          initialSort={queryParams.sortBy}
          categories={categoriesData?.categories || []}
          isLoading={true}
        />
        
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">코스 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <div className="space-y-6">
        <CourseFilters
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          initialSearch={queryParams.search}
          initialFilters={{
            category: queryParams.category,
            difficulty: queryParams.difficulty,
          }}
          initialSort={queryParams.sortBy}
          categories={categoriesData?.categories || []}
        />

        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">코스 목록을 불러올 수 없습니다</h3>
                <p className="text-muted-foreground mt-2">
                  {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}
                </p>
              </div>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                다시 시도
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const courses = coursesData?.courses || [];
  const pagination = coursesData?.pagination;

  return (
    <div className="space-y-6">
      {/* 필터 컴포넌트 */}
      <CourseFilters
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        initialSearch={queryParams.search}
        initialFilters={{
          category: queryParams.category,
          difficulty: queryParams.difficulty,
        }}
        initialSort={queryParams.sortBy}
        categories={categoriesData?.categories || []}
        isLoading={isFetching}
      />

      {/* 결과 요약 */}
      {pagination && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {pagination.total.toLocaleString()}개의 코스 중{' '}
            {((pagination.page - 1) * pagination.limit + 1).toLocaleString()}-
            {Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString()}개 표시
          </p>
          {isFetching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              업데이트 중...
            </div>
          )}
        </div>
      )}

      {/* 코스 목록 */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="text-6xl">📚</div>
              <div>
                <h3 className="font-semibold text-lg">검색 결과가 없습니다</h3>
                <p className="text-muted-foreground mt-2">
                  다른 검색어나 필터를 사용해보세요.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    showEnrollButton={showEnrollButtons}
                    onEnrollClick={handleEnrollClick}
                    isEnrolling={isEnrolling}
                    isEnrolled={course.isEnrolled || false}
                  />
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || isFetching}
          >
            이전
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = Math.max(1, pagination.page - 2) + i;
              if (page > pagination.totalPages) return null;
              
              return (
                <Button
                  key={page}
                  variant={page === pagination.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  disabled={isFetching}
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || isFetching}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
};
