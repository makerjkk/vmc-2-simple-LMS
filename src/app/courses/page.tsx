"use client";

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGuard } from '@/components/auth/role-guard';
import { CourseList } from '@/features/courses/components/course-list';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

type CoursesPageProps = {
  params: Promise<Record<string, never>>;
};

// 카테고리 목록 조회 함수
const fetchCategories = async () => {
  try {
    // 임시로 하드코딩된 카테고리 사용 (실제로는 API에서 조회)
    return [
      { id: '1', name: '프로그래밍' },
      { id: '2', name: '데이터 사이언스' },
      { id: '3', name: '디자인' },
      { id: '4', name: '비즈니스' },
      { id: '5', name: '언어' },
    ];
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch categories.');
    throw new Error(message);
  }
};

export default function CoursesPage({ params }: CoursesPageProps) {
  void params;
  const { user, isAuthenticated } = useCurrentUser();

  // 카테고리 목록 조회
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10분간 캐시 유지
  });

  const isLearner = isAuthenticated && user?.profile?.role === 'learner';

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold">코스 카탈로그</h1>
          <p className="text-muted-foreground mt-2">
            다양한 코스를 탐색하고 학습을 시작해보세요.
          </p>
        </div>

        {/* 환영 메시지 (학습자만) */}
        {isLearner && (
          <Card>
            <CardHeader>
              <CardTitle>
                환영합니다, {user?.profile?.fullName || user?.email}님!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                학습자로 가입이 완료되었습니다. 이제 코스를 탐색하고 수강신청을 할 수 있습니다.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 코스 목록 */}
        <CourseList
          showEnrollButtons={isLearner}
          categories={categories}
        />
      </div>
    </div>
  );
}
