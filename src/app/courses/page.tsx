"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CourseList } from '@/features/courses/components/course-list';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { HomeLayout } from '@/components/layout/home-layout';

type CoursesPageProps = {
  params: Promise<Record<string, never>>;
};

export default function CoursesPage({ params }: CoursesPageProps) {
  void params;
  const { user, isAuthenticated } = useCurrentUser();

  const isLearner = isAuthenticated && user?.profile?.role === 'learner';

  return (
    <HomeLayout>
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
          />
        </div>
      </div>
    </HomeLayout>
  );
}
