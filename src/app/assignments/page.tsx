'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { HomeLayout } from '@/components/layout/home-layout';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useDashboard } from '@/features/dashboard/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen,
  Calendar,
  Target
} from 'lucide-react';
import { formatKoreanDateTime, getDeadlineColor, getDeadlineStatus } from '@/lib/utils/date';

type AssignmentsPageProps = {
  params: Promise<Record<string, never>>;
};

/**
 * 학습자용 과제 목록 페이지
 * 수강 중인 모든 코스의 과제들을 한 곳에서 확인
 */
export default function AssignmentsPage({ params }: AssignmentsPageProps) {
  void params;
  const router = useRouter();
  const { user, isLoading: userLoading } = useCurrentUser();
  const { data: dashboardData, isLoading: dashboardLoading, error } = useDashboard();

  // 사용자 로딩 중
  if (userLoading || dashboardLoading) {
    return (
      <HomeLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      </HomeLayout>
    );
  }

  // 사용자 인증 확인
  if (!user) {
    router.push('/login');
    return null;
  }

  // Learner 권한 확인
  if (user.profile?.role !== 'learner') {
    return (
      <HomeLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              접근 권한이 없습니다
            </h1>
            <p className="text-gray-600 mb-6">
              과제 목록은 학습자만 이용할 수 있습니다.
            </p>
            <Button onClick={() => router.back()}>
              이전 페이지로 돌아가기
            </Button>
          </div>
        </div>
      </HomeLayout>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <HomeLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              데이터를 불러올 수 없습니다
            </h1>
            <p className="text-gray-600 mb-6">
              과제 정보를 가져오는 중 오류가 발생했습니다.
            </p>
            <Button onClick={() => window.location.reload()}>
              다시 시도
            </Button>
          </div>
        </div>
      </HomeLayout>
    );
  }

  // 수강 중인 코스가 없는 경우
  if (!dashboardData || dashboardData.courses.length === 0) {
    return (
      <HomeLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              수강 중인 코스가 없습니다
            </h1>
            <p className="text-gray-600 mb-6">
              코스를 수강신청하고 과제를 확인해보세요.
            </p>
            <Button onClick={() => router.push('/courses')}>
              코스 탐색하기
            </Button>
          </div>
        </div>
      </HomeLayout>
    );
  }

  // 모든 과제를 하나의 배열로 합치기 (마감 임박 과제 + 기타 과제)
  const allAssignments = [
    ...dashboardData.upcomingAssignments.map(assignment => ({
      ...assignment,
      isUpcoming: true,
    })),
    // 여기에 다른 과제들도 추가할 수 있음 (완료된 과제, 모든 과제 등)
  ];

  return (
    <HomeLayout>
      <div className="container mx-auto px-4 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                내 과제
              </h1>
              <p className="text-gray-600">
                수강 중인 코스의 모든 과제를 확인하고 관리하세요.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => router.push('/grades')}
              >
                <Target className="h-4 w-4 mr-2" />
                내 성적
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                대시보드
              </Button>
            </div>
          </div>
        </div>

        {/* 과제 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">전체 과제</p>
                  <p className="text-2xl font-bold">{allAssignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">마감 임박</p>
                  <p className="text-2xl font-bold">{dashboardData.upcomingAssignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">수강 코스</p>
                  <p className="text-2xl font-bold">{dashboardData.courses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 과제 목록 */}
        <div className="space-y-6">
          {/* 마감 임박 과제 */}
          {dashboardData.upcomingAssignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  마감 임박 과제
                  <Badge variant="secondary">
                    {dashboardData.upcomingAssignments.length}개
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.upcomingAssignments.map((assignment) => {
                    const deadlineColor = getDeadlineColor(assignment.dueDate);
                    const deadlineStatus = getDeadlineStatus(assignment.dueDate);
                    const isUrgent = assignment.daysLeft <= 1;

                    return (
                      <div
                        key={assignment.id}
                        className="border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                        onClick={() => router.push(`/assignments/${assignment.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 line-clamp-1 hover:text-blue-600">
                              {assignment.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {assignment.courseTitle}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {isUrgent && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <Badge className={deadlineColor}>
                              {deadlineStatus}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>마감: {formatKoreanDateTime(assignment.dueDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            <span>{assignment.daysLeft}일 남음</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 수강 중인 코스별 과제 (향후 확장 가능) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                수강 중인 코스
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.courses.map((course) => (
                  <div
                    key={course.id}
                    className="border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => router.push(`/courses/${course.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 line-clamp-1 hover:text-blue-600">
                          {course.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant="outline">
                          진행률 {course.progress}%
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                      <span>전체 과제: {course.totalAssignments}개</span>
                      <span>완료: {course.completedAssignments}개</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 과제가 없는 경우 */}
          {allAssignments.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    과제가 없습니다
                  </h3>
                  <p className="text-gray-600 mb-4">
                    아직 등록된 과제가 없거나 모든 과제를 완료했습니다.
                  </p>
                  <Button onClick={() => router.push('/courses')}>
                    다른 코스 탐색하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </HomeLayout>
  );
}
