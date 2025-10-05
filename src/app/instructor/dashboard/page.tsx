"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { Plus, BookOpen, Users, FileText } from "lucide-react";

type InstructorDashboardPageProps = {
  params: Promise<Record<string, never>>;
};

export default function InstructorDashboardPage({ params }: InstructorDashboardPageProps) {
  void params;
  const { user } = useCurrentUser();

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">강사 대시보드</h1>
          <p className="text-muted-foreground mt-2">
            코스와 과제를 관리하고 학습자들의 진행상황을 확인하세요.
          </p>
        </div>

        {user && (
          <Card>
            <CardHeader>
              <CardTitle>
                환영합니다, {user.profile?.fullName || user.email}님!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {user.profile?.role === 'instructor' 
                  ? '강사로 가입이 완료되었습니다. 이제 코스를 개설하고 과제를 관리할 수 있습니다.'
                  : '강사 대시보드에 오신 것을 환영합니다.'
                }
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                첫 번째 코스 만들기
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 통계 카드들 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">내 코스</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                개설된 코스가 없습니다
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">수강생</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                등록된 수강생이 없습니다
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">채점 대기</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                채점할 과제가 없습니다
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 빠른 작업 */}
        <Card>
          <CardHeader>
            <CardTitle>빠른 작업</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Button variant="outline" className="h-20 flex-col">
                <BookOpen className="w-6 h-6 mb-2" />
                새 코스 만들기
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <FileText className="w-6 h-6 mb-2" />
                과제 관리
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
