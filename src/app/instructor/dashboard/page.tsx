"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { HomeLayout } from "@/components/layout/home-layout";
import { InstructorStats } from "@/features/instructor-dashboard/components/instructor-stats";
import { MyCoursesList } from "@/features/instructor-dashboard/components/my-courses-list";
import { PendingGrades } from "@/features/instructor-dashboard/components/pending-grades";
import { RecentSubmissions } from "@/features/instructor-dashboard/components/recent-submissions";
import { QuickActions } from "@/features/instructor-dashboard/components/quick-actions";

type InstructorDashboardPageProps = {
  params: Promise<Record<string, never>>;
};

/**
 * Instructor 대시보드 페이지
 * 강사 전용 대시보드로 코스 관리, 채점 현황, 최근 제출물 등을 표시
 */
export default function InstructorDashboardPage({ params }: InstructorDashboardPageProps) {
  void params;
  
  return (
    <RoleGuard allowedRoles={['instructor']}>
      <HomeLayout>
        <div className="container mx-auto py-8">
          <div className="space-y-6">
            {/* 페이지 헤더 */}
            <div>
              <h1 className="text-3xl font-bold">강사 대시보드</h1>
              <p className="text-muted-foreground mt-2">
                코스와 과제를 관리하고 학습자들의 진행상황을 확인하세요.
              </p>
            </div>
            
            {/* 통계 카드 */}
            <InstructorStats />
            
            {/* 내 코스 목록 */}
            <MyCoursesList />
            
            {/* 채점 대기 및 최근 제출물 */}
            <div className="grid gap-6 lg:grid-cols-2">
              <PendingGrades />
              <RecentSubmissions />
            </div>
            
            {/* 빠른 작업 */}
            <QuickActions />
          </div>
        </div>
      </HomeLayout>
    </RoleGuard>
  );
}
