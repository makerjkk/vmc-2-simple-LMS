"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

type CoursesPageProps = {
  params: Promise<Record<string, never>>;
};

export default function CoursesPage({ params }: CoursesPageProps) {
  void params;
  const { user } = useCurrentUser();

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">코스 카탈로그</h1>
          <p className="text-muted-foreground mt-2">
            다양한 코스를 탐색하고 학습을 시작해보세요.
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
                {user.profile?.role === 'learner' 
                  ? '학습자로 가입이 완료되었습니다. 이제 코스를 탐색하고 수강신청을 할 수 있습니다.'
                  : '코스 카탈로그에 오신 것을 환영합니다.'
                }
              </p>
              <Button>코스 둘러보기</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 임시 코스 카드들 */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>샘플 코스 {i}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  이것은 샘플 코스입니다. 실제 코스 관리 기능은 추후 구현됩니다.
                </p>
                <Button variant="outline" className="w-full">
                  자세히 보기
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
