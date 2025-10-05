"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { CourseForm } from "@/features/courses/components/course-form";

type NewCoursePageProps = {
  params: Promise<Record<string, never>>;
};

/**
 * 새 코스 생성 페이지
 * 강사가 새로운 코스를 생성할 수 있는 폼 페이지
 */
export default function NewCoursePage({ params }: NewCoursePageProps) {
  void params;

  return (
    <RoleGuard allowedRoles={['instructor']}>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">새 코스 만들기</h1>
          <p className="text-muted-foreground mt-2">
            새로운 코스를 개설하고 학습자들과 지식을 공유하세요.
          </p>
        </div>
        
        <CourseForm mode="create" />
      </div>
    </RoleGuard>
  );
}
