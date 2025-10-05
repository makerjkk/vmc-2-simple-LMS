"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { DashboardStats } from '@/features/dashboard/components/dashboard-stats';
import { CourseProgressCard } from '@/features/dashboard/components/course-progress-card';
import { UpcomingAssignments } from '@/features/dashboard/components/upcoming-assignments';
import { RecentFeedback } from '@/features/dashboard/components/recent-feedback';
import { DashboardLoading } from '@/features/dashboard/components/dashboard-loading';
import { DashboardError } from '@/features/dashboard/components/dashboard-error';
import { DashboardEmpty } from '@/features/dashboard/components/dashboard-empty';

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
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <div className="h-8 bg-slate-200 rounded animate-pulse w-32 mb-2" />
          <div className="h-5 bg-slate-200 rounded animate-pulse w-48" />
        </div>
        <DashboardLoading />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
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
    );
  }

  // 데이터가 없는 경우
  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">대시보드</h1>
          <p className="text-slate-600 mt-2">
            {user?.email ?? "알 수 없는 사용자"} 님, 환영합니다.
          </p>
        </header>
        <DashboardEmpty />
      </div>
    );
  }

  // 수강 중인 코스가 없는 경우
  if (data.courses.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">대시보드</h1>
          <p className="text-slate-600 mt-2">
            {user?.email ?? "알 수 없는 사용자"} 님, 환영합니다.
          </p>
        </header>
        <DashboardEmpty />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">대시보드</h1>
        <p className="text-slate-600 mt-2">
          {user?.email ?? "알 수 없는 사용자"} 님, 환영합니다.
        </p>
      </header>

      <div className="space-y-8">
        {/* 통계 정보 */}
        <DashboardStats data={data} />

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
  );
}
