"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  BookOpen, 
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { InstructorCourseCard } from './instructor-course-card';
import { useInstructorCourses } from '../hooks/useInstructorCourses';
import { type InstructorCoursesQuery } from '../lib/dto';

/**
 * 강사의 코스 목록 컴포넌트
 * 상태별 탭으로 구분하여 표시하고 페이지네이션 지원
 */
export function InstructorCourseList() {
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [page, setPage] = useState(1);

  // 쿼리 파라미터 구성
  const queryParams: InstructorCoursesQuery = {
    page,
    limit: 12,
    ...(activeTab !== 'all' && { status: activeTab }),
  };

  const { 
    data: coursesData, 
    isLoading, 
    isError, 
    error,
    refetch,
    isFetching,
  } = useInstructorCourses(queryParams);

  // 탭 변경 처리
  const handleTabChange = (value: string) => {
    setActiveTab(value as typeof activeTab);
    setPage(1); // 탭 변경 시 첫 페이지로 리셋
  };

  // 페이지 변경 처리
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Skeleton className="h-10 w-full" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex gap-2 mb-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">코스 목록을 불러올 수 없습니다</h3>
          <p className="text-muted-foreground text-center mb-4">
            {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  const courses = coursesData?.courses || [];
  const pagination = coursesData?.pagination;

  // 상태별 개수 계산 (전체 데이터에서)
  const getStatusCounts = () => {
    // 실제로는 각 상태별로 별도 쿼리를 해야 정확하지만, 
    // 여기서는 현재 탭의 데이터만 사용
    return {
      all: pagination?.total || 0,
      draft: activeTab === 'draft' ? pagination?.total || 0 : 0,
      published: activeTab === 'published' ? pagination?.total || 0 : 0,
      archived: activeTab === 'archived' ? pagination?.total || 0 : 0,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">내 코스 관리</h2>
          <p className="text-muted-foreground">
            생성한 코스를 관리하고 상태를 변경할 수 있습니다.
          </p>
        </div>
        
        <Button asChild>
          <Link href="/instructor/courses/new">
            <Plus className="h-4 w-4 mr-2" />
            새 코스 만들기
          </Link>
        </Button>
      </div>

      {/* 상태별 탭 */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            전체
            {statusCounts.all > 0 && (
              <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded">
                {statusCounts.all}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="draft" className="flex items-center gap-2">
            초안
            {statusCounts.draft > 0 && (
              <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded">
                {statusCounts.draft}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="published" className="flex items-center gap-2">
            게시됨
            {statusCounts.published > 0 && (
              <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded">
                {statusCounts.published}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            보관됨
            {statusCounts.archived > 0 && (
              <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded">
                {statusCounts.archived}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* 로딩 오버레이 */}
          {isFetching && (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">업데이트 중...</span>
            </div>
          )}

          {/* 코스 목록 */}
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <InstructorCourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab === 'all' 
                    ? '아직 생성한 코스가 없습니다' 
                    : `${activeTab === 'draft' ? '초안' : activeTab === 'published' ? '게시된' : '보관된'} 코스가 없습니다`
                  }
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {activeTab === 'all' 
                    ? '첫 번째 코스를 만들어 학습자들과 지식을 공유해보세요.' 
                    : `다른 탭에서 코스를 확인하거나 새로운 코스를 만들어보세요.`
                  }
                </p>
                {activeTab === 'all' && (
                  <Button asChild>
                    <Link href="/instructor/courses/new">
                      <Plus className="h-4 w-4 mr-2" />
                      첫 코스 만들기
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* 페이지네이션 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || isFetching}
              >
                이전
              </Button>
              
              <span className="text-sm text-muted-foreground px-4">
                {page} / {pagination.totalPages} 페이지
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= pagination.totalPages || isFetching}
              >
                다음
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
