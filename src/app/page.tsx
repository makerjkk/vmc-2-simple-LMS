'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { HomeLayout } from '@/components/layout/home-layout';
import { HeroSection } from '@/features/home/components/hero-section';
import { FeaturedCourses } from '@/features/home/components/featured-courses';
import { StatsSection } from '@/features/home/components/stats-section';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, BookOpen, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * 홈페이지 메인 컴포넌트
 */
export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useCurrentUser();
  const [showWelcome, setShowWelcome] = useState(false);

  // URL 파라미터에서 welcome 플래그 확인
  useEffect(() => {
    const welcomeParam = searchParams.get('welcome');
    if (welcomeParam === 'true' && isAuthenticated && user?.profile?.role === 'learner') {
      setShowWelcome(true);
    }
  }, [searchParams, isAuthenticated, user]);

  return (
    <HomeLayout>
      {/* 신규 가입 환영 메시지 */}
      {showWelcome && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="container mx-auto py-8">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-green-800">
                  <CheckCircle className="h-6 w-6" />
                  회원가입이 완료되었습니다!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-green-700">
                  <strong>{user?.profile?.fullName || user?.email}님</strong>, 
                  학습 플랫폼에 오신 것을 환영합니다! 🎉
                </p>
                <p className="text-green-600">
                  이제 다양한 코스를 탐색하고, 수강신청을 통해 학습을 시작할 수 있습니다.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button 
                    onClick={() => router.push('/courses')}
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    코스 탐색하기
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    내 대시보드
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => setShowWelcome(false)}
                    className="text-green-700 hover:text-green-800"
                  >
                    닫기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <HeroSection />
      <FeaturedCourses />
      <StatsSection />
    </HomeLayout>
  );
}