'use client';

import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HomeLayout } from '@/components/layout/home-layout';

import { AssignmentForm } from '@/features/assignments/components/instructor/assignment-form';
import { useCourseQuery } from '@/features/courses/hooks/useCourseQuery';
import { useInstructorCourses } from '@/features/courses/hooks/useInstructorCourses';

/**
 * 강사용 과제 생성 페이지
 * 새로운 과제를 생성할 수 있습니다.
 */
export default function NewAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  // 코스 정보 조회
  const { 
    data: courseData, 
    isLoading: courseLoading,
    error: courseError 
  } = useCourseQuery(courseId);

  // 강사 권한 확인을 위한 강사 코스 목록 조회
  const { 
    data: instructorCoursesData,
    isLoading: instructorCoursesLoading 
  } = useInstructorCourses();

  // 로딩 상태
  if (courseLoading || instructorCoursesLoading) {
    return (
      <HomeLayout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </HomeLayout>
    );
  }

  // 에러 상태
  if (courseError || !courseData) {
    return (
      <HomeLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                코스 정보를 불러올 수 없습니다.
              </div>
            </CardContent>
          </Card>
        </div>
      </HomeLayout>
    );
  }

  // 강사 권한 확인
  const isInstructor = instructorCoursesData?.courses.some(course => course.id === courseId);
  if (!isInstructor) {
    return (
      <HomeLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                이 코스에 대한 권한이 없습니다.
              </div>
            </CardContent>
          </Card>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* 헤더 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push(`/instructor/courses/${courseId}/assignments`)}
            >
              ← 과제 목록으로 돌아가기
            </Button>
          </div>
          <h1 className="text-3xl font-bold">새 과제 만들기</h1>
          <p className="text-muted-foreground">
            {courseData.title} 코스에 새로운 과제를 추가합니다.
          </p>
        </div>

        {/* 과제 생성 폼 */}
        <AssignmentForm
          courseId={courseId}
          onSuccess={(assignment) => {
            // 생성 완료 후 과제 목록으로 이동
            router.push(`/instructor/courses/${courseId}/assignments`);
          }}
          onCancel={() => {
            // 취소 시 과제 목록으로 돌아가기
            router.push(`/instructor/courses/${courseId}/assignments`);
          }}
        />
      </div>
    </HomeLayout>
  );
}
