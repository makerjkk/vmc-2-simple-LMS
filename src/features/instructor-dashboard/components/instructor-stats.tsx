'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, FileText, Star } from "lucide-react";
import { useInstructorDashboard } from "../hooks/useInstructorDashboard";
import type { InstructorStats } from "../lib/dto";

/**
 * Instructor 통계 카드 컴포넌트
 */
export function InstructorStats() {
  const { data, isLoading, error } = useInstructorDashboard();

  if (isLoading) {
    return <InstructorStatsLoading />;
  }

  if (error || !data) {
    return <InstructorStatsError />;
  }

  return <InstructorStatsContent stats={data.stats} />;
}

/**
 * 통계 카드 내용 컴포넌트
 */
function InstructorStatsContent({ stats }: { stats: InstructorStats }) {
  const statCards = [
    {
      title: "내 코스",
      value: stats.totalCourses,
      description: stats.totalCourses === 0 ? "개설된 코스가 없습니다" : "개설된 코스",
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "수강생",
      value: stats.totalStudents,
      description: stats.totalStudents === 0 ? "등록된 수강생이 없습니다" : "총 수강생 수",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "채점 대기",
      value: stats.pendingGrades,
      description: stats.pendingGrades === 0 ? "채점할 과제가 없습니다" : "채점 대기 중인 과제",
      icon: FileText,
      color: "text-orange-600",
    },
    {
      title: "평균 평점",
      value: stats.averageRating.toFixed(1),
      description: stats.averageRating === 0 ? "평점이 없습니다" : "전체 코스 평균 평점",
      icon: Star,
      color: "text-yellow-600",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * 로딩 상태 컴포넌트
 */
function InstructorStatsLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * 에러 상태 컴포넌트
 */
function InstructorStatsError() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">통계</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              데이터를 불러올 수 없습니다
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
