'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, BookOpen, Users, Clock, Star } from 'lucide-react';
import { CourseCard } from '@/features/courses/components/course-card';
import { useCoursesQuery } from '@/features/courses/hooks/useCoursesQuery';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

/**
 * 홈페이지 추천/인기 코스 섹션 컴포넌트
 */
export const FeaturedCourses = () => {
  const { user, isAuthenticated } = useCurrentUser();
  
  // 인기 코스 조회 (평점순, 상위 6개)
  const {
    data: coursesData,
    isLoading,
    isError,
  } = useCoursesQuery({
    sortBy: 'popular',
    limit: 6,
    page: 1,
  });

  const courses = coursesData?.courses || [];
  const isLearner = isAuthenticated && user?.profile?.role === 'learner';

  if (isError) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">인기 코스</h2>
            <p className="text-muted-foreground mb-8">
              현재 코스를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              다시 시도
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* 섹션 헤더 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            인기 코스
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            많은 학습자들이 선택한 검증된 코스들을 만나보세요
          </p>
        </div>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 코스 목록 */}
        {!isLoading && courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                showEnrollButton={isLearner}
              />
            ))}
          </div>
        )}

        {/* 빈 상태 */}
        {!isLoading && courses.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">아직 코스가 없습니다</h3>
              <p className="text-muted-foreground mb-6">
                곧 다양한 코스들이 준비될 예정입니다.
              </p>
              {user?.profile?.role === 'instructor' && (
                <Button asChild>
                  <Link href="/instructor/courses/new">
                    첫 번째 코스 만들기
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* 더 보기 버튼 */}
        {!isLoading && courses.length > 0 && (
          <div className="text-center">
            <Button size="lg" variant="outline" asChild>
              <Link href="/courses" className="flex items-center gap-2">
                모든 코스 보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
