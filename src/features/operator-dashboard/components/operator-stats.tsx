'use client';

import { TrendingUp, Users, BookOpen, Activity, AlertTriangle, CheckCircle, Clock, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOperatorStatsQuery } from '../hooks/useOperatorStatsQuery';

/**
 * 운영자 통계 대시보드 컴포넌트
 */
export const OperatorStats = () => {
  const { data: stats, isLoading, error } = useOperatorStatsQuery();

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            통계 데이터를 불러오는 중 오류가 발생했습니다: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            통계 데이터를 불러올 수 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  const statCards = [
    // 신고 관련 통계
    {
      title: '전체 신고',
      value: stats.reports.total,
      description: '누적 신고 건수',
      icon: AlertTriangle,
      color: 'text-blue-600',
    },
    {
      title: '처리 대기',
      value: stats.reports.pending,
      description: '처리가 필요한 신고',
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: '해결 완료',
      value: stats.reports.resolved,
      description: '해결된 신고',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: '오늘 접수',
      value: stats.reports.todayReceived,
      description: '오늘 새로 접수된 신고',
      icon: TrendingUp,
      color: 'text-red-600',
    },
    
    // 사용자 관련 통계
    {
      title: '전체 사용자',
      value: stats.users.total,
      description: '등록된 전체 사용자',
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: '학습자',
      value: stats.users.learners,
      description: '학습자 계정',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: '강사',
      value: stats.users.instructors,
      description: '강사 계정',
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: '이번 주 신규',
      value: stats.users.newThisWeek,
      description: '이번 주 신규 가입자',
      icon: UserPlus,
      color: 'text-indigo-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 상세 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 콘텐츠 통계 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              콘텐츠 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">전체 코스</span>
              <span className="font-semibold">{stats.content.totalCourses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">게시된 코스</span>
              <span className="font-semibold">{stats.content.publishedCourses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">전체 과제</span>
              <span className="font-semibold">{stats.content.totalAssignments.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">전체 제출물</span>
              <span className="font-semibold">{stats.content.totalSubmissions.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* 활동 통계 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              사용자 활동
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">일일 활성 사용자</span>
              <span className="font-semibold">{stats.activity.dailyActiveUsers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">주간 활성 사용자</span>
              <span className="font-semibold">{stats.activity.weeklyActiveUsers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">월간 활성 사용자</span>
              <span className="font-semibold">{stats.activity.monthlyActiveUsers.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
