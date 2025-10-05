"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { InstructorCourseList } from "@/features/courses/components/instructor-course-list";

type InstructorCoursesPageProps = {
  params: Promise<Record<string, never>>;
};

/**
 * 강사 코스 관리 페이지
 * 강사가 자신의 코스들을 관리할 수 있는 메인 페이지
 */
export default function InstructorCoursesPage({ params }: InstructorCoursesPageProps) {
  void params;

  return (
    <RoleGuard allowedRoles={['instructor']}>
      <div className="container mx-auto py-8">
        <InstructorCourseList />
      </div>
    </RoleGuard>
  );
}
