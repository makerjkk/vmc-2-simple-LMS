"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { HomeLayout } from "@/components/layout/home-layout";
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { DashboardStats } from '@/features/dashboard/components/dashboard-stats';
import { CourseProgressCard } from '@/features/dashboard/components/course-progress-card';
import { UpcomingAssignments } from '@/features/dashboard/components/upcoming-assignments';
import { RecentFeedback } from '@/features/dashboard/components/recent-feedback';
import { DashboardLoading } from '@/features/dashboard/components/dashboard-loading';
import { DashboardError } from '@/features/dashboard/components/dashboard-error';
import { DashboardEmpty } from '@/features/dashboard/components/dashboard-empty';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, GraduationCap, FileText, Users, PlusCircle, Settings } from 'lucide-react';

type DashboardPageProps = {
  params: Promise<Record<string, never>>;
};

export default function DashboardPage({ params }: DashboardPageProps) {
  void params;
  const router = useRouter();
  const { user, isLoading: userLoading } = useCurrentUser();
  const { data, isLoading, error, refetch } = useDashboard();

  // 역할 기반 라우팅
  useEffect(() => {
    if (!userLoading && user) {
      if (user.profile?.role === 'instructor') {
        router.replace('/instructor/dashboard');
        return;
      }
      
      if (user.profile?.role !== 'learner') {
        router.replace('/login');
        return;
      }
    }
  }, [user, userLoading, router]);

  // 로딩 상태
  if (userLoading || isLoading) {
    return (
      <HomeLayout>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-8">
            <div className="h-8 bg-slate-200 rounded animate-pulse w-32 mb-2" />
            <div className="h-5 bg-slate-200 rounded animate-pulse w-48" />
          </div>
          <DashboardLoading />
        </div>
      </HomeLayout>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <HomeLayout>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900">대시보드</h1>
            <p className="text-slate-600 mt-2">
              {user?.email ?? "알 수 없는 사용자"} 님, 환영합니다.
            </p>
          </header>
          <DashboardError 
            error={error as Error} 
            onRetry={() => refetch()} 
          />
        </div>
      </HomeLayout>
    );
  }

  // 데이터가 없는 경우
  if (!data) {
    return (
      <HomeLayout>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900">대시보드</h1>
            <p className="text-slate-600 mt-2">
              {user?.email ?? "알 수 없는 사용자"} 님, 환영합니다.
            </p>
          </header>
          <DashboardEmpty />
        </div>
      </HomeLayout>
    );
  }

  // 수강 중인 코스가 없는 경우
  if (data.courses.length === 0) {
    return (
      <HomeLayout>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold text-slate-900">대시보드</h1>
            <p className="text-slate-600 mt-2">
              {user?.email ?? "알 수 없는 사용자"} 님, 환영합니다.
            </p>
          </header>
          <DashboardEmpty />
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">대시보드</h1>
            <p className="text-slate-600 mt-2">
              {user?.email ?? "알 수 없는 사용자"} 님, 환영합니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/courses')}
            >
              코스 탐색
            </Button>
            <Button
              onClick={() => router.push('/grades')}
            >
              내 성적
            </Button>
            {/* 강사 권한이 있는 경우 강사 대시보드 버튼 표시 */}
            {user?.profile?.role === 'instructor' && (
              <Button
                variant="secondary"
                onClick={() => router.push('/instructor/dashboard')}
              >
                강사 모드
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="space-y-8">
        {/* 통계 정보 */}
        <DashboardStats data={data} />

        {/* 빠른 액션 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              빠른 액션
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => router.push('/grades')}
              >
                <GraduationCap className="h-6 w-6" />
                <span className="text-sm">내 성적</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => router.push('/courses')}
              >
                <BookOpen className="h-6 w-6" />
                <span className="text-sm">코스 탐색</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto flex flex-col items-center gap-2 p-4"
                onClick={() => router.push('/assignments')}
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm">내 과제</span>
              </Button>

              {/* 강사 권한이 있는 경우 과제 관리 버튼 표시 */}
              {user?.profile?.role === 'instructor' && (
                <Button
                  variant="outline"
                  className="h-auto flex flex-col items-center gap-2 p-4"
                  onClick={() => router.push('/instructor/dashboard')}
                >
                  <Users className="h-6 w-6" />
                  <span className="text-sm">강사 대시보드</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 메인 콘텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 왼쪽 컬럼 */}
          <div className="space-y-8">
            {/* 내 코스 진행률 */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                내 코스
              </h2>
              <div className="space-y-4">
                {data.courses.map((course) => (
                  <CourseProgressCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽 컬럼 */}
          <div className="space-y-8">
            {/* 마감 임박 과제 */}
            <UpcomingAssignments assignments={data.upcomingAssignments} />

            {/* 최근 피드백 */}
            <RecentFeedback feedback={data.recentFeedback} />
          </div>
        </div>
      </div>
      </div>
    </HomeLayout>
  );
}
