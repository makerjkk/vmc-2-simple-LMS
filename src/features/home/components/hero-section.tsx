'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BookOpen, Users, Award, TrendingUp } from 'lucide-react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

/**
 * 홈페이지 히어로 섹션 컴포넌트
 */
export const HeroSection = () => {
  const { user, isAuthenticated } = useCurrentUser();

  const features = [
    {
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      title: '다양한 코스',
      description: '전문가가 제작한 고품질 학습 콘텐츠',
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: '커뮤니티',
      description: '동료 학습자들과 함께하는 성장',
    },
    {
      icon: <Award className="h-6 w-6 text-primary" />,
      title: '체계적 관리',
      description: '과제 제출부터 피드백까지 완벽 지원',
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-primary" />,
      title: '성장 추적',
      description: '학습 진도와 성과를 한눈에 확인',
    },
  ];

  const getRoleBasedCTA = () => {
    if (!isAuthenticated) {
      return {
        primary: { href: '/signup', label: '지금 시작하기' },
        secondary: { href: '/courses', label: '코스 둘러보기' },
      };
    }

    const role = user?.profile?.role;
    switch (role) {
      case 'instructor':
        return {
          primary: { href: '/instructor/dashboard', label: '강사 대시보드' },
          secondary: { href: '/instructor/courses/new', label: '새 코스 만들기' },
        };
      case 'operator':
        return {
          primary: { href: '/operator/dashboard', label: '운영자 대시보드' },
          secondary: { href: '/courses', label: '코스 관리' },
        };
      case 'learner':
      default:
        return {
          primary: { href: '/dashboard', label: '내 대시보드' },
          secondary: { href: '/courses', label: '코스 탐색' },
        };
    }
  };

  const cta = getRoleBasedCTA();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
      
      <div className="relative container mx-auto px-4 py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* 좌측: 메인 콘텐츠 */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                <span className="text-slate-900 dark:text-white">배움의 즐거움을</span>
                <br />
                <span className="text-primary">함께 나누세요</span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl">
                전문 강사진과 체계적인 커리큘럼으로 여러분의 성장을 지원합니다.
                언제 어디서나 원하는 속도로 학습하고, 실력을 키워보세요.
              </p>
            </div>

            {/* CTA 버튼 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="text-lg px-8 py-6">
                <Link href={cta.primary.href} className="flex items-center gap-2">
                  {cta.primary.label}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 py-6">
                <Link href={cta.secondary.href}>
                  {cta.secondary.label}
                </Link>
              </Button>
            </div>

            {/* 사용자 환영 메시지 (로그인한 경우) */}
            {isAuthenticated && user && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        환영합니다, {user.profile?.fullName || user.email}님!
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        오늘도 새로운 것을 배워보세요.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 우측: 특징 카드들 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
