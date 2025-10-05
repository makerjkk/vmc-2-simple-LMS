"use client";

import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Clock, MessageSquare, TrendingUp } from 'lucide-react';
import type { DashboardResponse } from '../lib/dto';

interface DashboardStatsProps {
  data: DashboardResponse;
}

/**
 * 대시보드 통계 정보를 표시하는 컴포넌트
 */
export function DashboardStats({ data }: DashboardStatsProps) {
  // 전체 진행률 계산
  const totalProgress = data.courses.length > 0
    ? Math.round(data.courses.reduce((sum, course) => sum + course.progress, 0) / data.courses.length)
    : 0;

  // 완료된 과제 수 계산
  const totalCompletedAssignments = data.courses.reduce(
    (sum, course) => sum + course.completedAssignments,
    0
  );

  // 전체 과제 수 계산
  const totalAssignments = data.courses.reduce(
    (sum, course) => sum + course.totalAssignments,
    0
  );

  const stats = [
    {
      title: '수강 중인 코스',
      value: data.courses.length,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '전체 진행률',
      value: `${totalProgress}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '마감 임박 과제',
      value: data.upcomingAssignments.length,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: '최근 피드백',
      value: data.recentFeedback.length,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        
        return (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              
              {stat.title === '전체 진행률' && totalAssignments > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>완료</span>
                    <span>{totalCompletedAssignments} / {totalAssignments}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="h-2 bg-green-500 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${totalAssignments > 0 ? (totalCompletedAssignments / totalAssignments) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
