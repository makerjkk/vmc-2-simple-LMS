"use client";

import { use } from 'react';
import { notFound } from 'next/navigation';
import { RoleGuard } from "@/components/auth/role-guard";
import { CourseForm } from "@/features/courses/components/course-form";
import { useInstructorCourses } from "@/features/courses/hooks/useInstructorCourses";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

type EditCoursePageProps = {
  params: Promise<{ id: string }>;
};

/**
 * 코스 수정 페이지
 * 강사가 자신의 코스 정보를 수정할 수 있는 페이지
 */
export default function EditCoursePage({ params }: EditCoursePageProps) {
  const { id: courseId } = use(params);

  // 강사의 모든 코스를 조회하여 해당 코스 찾기
  const { 
    data: coursesData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useInstructorCourses();

  // 로딩 상태
  if (isLoading) {
    return (
      <RoleGuard allowedRoles={['instructor']}>
        <div className="container mx-auto py-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          <Card>
            <CardContent className="p-6 space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    );
  }

  // 에러 상태
  if (isError) {
    return (
      <RoleGuard allowedRoles={['instructor']}>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">코스 정보를 불러올 수 없습니다</h3>
              <p className="text-muted-foreground text-center mb-4">
                {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}
              </p>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                다시 시도
              </Button>
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    );
  }

  // 해당 코스 찾기
  const course = coursesData?.courses.find(c => c.id === courseId);

  // 코스를 찾을 수 없는 경우
  if (!course) {
    notFound();
  }

  return (
    <RoleGuard allowedRoles={['instructor']}>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">코스 정보 수정</h1>
          <p className="text-muted-foreground mt-2">
            &ldquo;{course.title}&rdquo; 코스의 정보를 수정하고 업데이트하세요.
          </p>
        </div>
        
        <CourseForm 
          mode="edit" 
          courseId={courseId}
          initialData={course}
        />
      </div>
    </RoleGuard>
  );
}
