"use client";

import { use } from 'react';
import { HomeLayout } from '@/components/layout/home-layout';
import { CourseDetail } from '@/features/courses/components/course-detail';

type CourseDetailPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * 코스 상세 페이지
 * 특정 코스의 상세 정보를 표시하고 수강신청 기능을 제공
 */
export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { id } = use(params);

  return (
    <HomeLayout>
      <div className="container mx-auto py-8">
        <CourseDetail courseId={id} />
      </div>
    </HomeLayout>
  );
}
