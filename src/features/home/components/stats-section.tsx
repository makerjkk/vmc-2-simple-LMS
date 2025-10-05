'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Users, GraduationCap, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/remote/api-client';

interface PlatformStats {
  totalCourses: number;
  totalLearners: number;
  totalInstructors: number;
  totalEnrollments: number;
}

/**
 * 플랫폼 통계 조회 함수
 */
const fetchPlatformStats = async (): Promise<PlatformStats> => {
  try {
    const response = await apiClient.get('/api/stats/platform');
    return response.data;
  } catch (error) {
    // 에러 발생 시 기본값 반환
    console.warn('Failed to fetch platform stats:', error);
    return {
      totalCourses: 0,
      totalLearners: 0,
      totalInstructors: 0,
      totalEnrollments: 0,
    };
  }
};

/**
 * 홈페이지 통계 섹션 컴포넌트
 */
export const StatsSection = () => {
  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: fetchPlatformStats,
    staleTime: 1000 * 60 * 10, // 10분간 캐시 유지
    gcTime: 1000 * 60 * 30, // 30분간 가비지 컬렉션 방지
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const statsItems = [
    {
      icon: <BookOpen className="h-8 w-8 text-blue-600" />,
      label: '전체 코스',
      value: stats?.totalCourses || 0,
      color: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      label: '학습자',
      value: stats?.totalLearners || 0,
      color: 'bg-green-50 dark:bg-green-950',
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-purple-600" />,
      label: '강사',
      value: stats?.totalInstructors || 0,
      color: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-orange-600" />,
      label: '총 수강',
      value: stats?.totalEnrollments || 0,
      color: 'bg-orange-50 dark:bg-orange-950',
    },
  ];

  return (
    <section className="py-16 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4">
        {/* 섹션 헤더 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            함께 성장하는 커뮤니티
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            수많은 학습자와 강사들이 함께 만들어가는 학습 생태계입니다
          </p>
        </div>

        {/* 통계 카드들 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {statsItems.map((item, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${item.color} mb-4`}>
                  {item.icon}
                </div>
                <div className="space-y-2">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 w-16 mx-auto" />
                      <Skeleton className="h-4 w-12 mx-auto" />
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-foreground">
                        {formatNumber(item.value)}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        {item.label}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 에러 상태 메시지 */}
        {isError && (
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              통계 정보를 불러오는 중 문제가 발생했습니다.
            </p>
          </div>
        )}

        {/* 추가 정보 */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            매일 새로운 학습자들이 합류하고 있습니다. 지금 시작해보세요!
          </p>
        </div>
      </div>
    </section>
  );
};
