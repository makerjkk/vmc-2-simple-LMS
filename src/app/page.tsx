'use client';

import { HomeLayout } from '@/components/layout/home-layout';
import { HeroSection } from '@/features/home/components/hero-section';
import { FeaturedCourses } from '@/features/home/components/featured-courses';
import { StatsSection } from '@/features/home/components/stats-section';

/**
 * 홈페이지 메인 컴포넌트
 */
export default function HomePage() {
  return (
    <HomeLayout>
      <HeroSection />
      <FeaturedCourses />
      <StatsSection />
    </HomeLayout>
  );
}