'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HomeLayout } from '@/components/layout/home-layout';

import { AssignmentList } from '@/features/assignments/components/instructor/assignment-list';
import { AssignmentForm } from '@/features/assignments/components/instructor/assignment-form';
import { useInstructorCourses } from '@/features/courses/hooks/useInstructorCourses';
import { useCourseQuery } from '@/features/courses/hooks/useCourseQuery';
import type { InstructorAssignmentResponse } from '@/features/assignments/lib/dto';

/**
 * 강사용 과제 목록 페이지
 * 특정 코스의 과제들을 관리할 수 있습니다.
 */
export default function InstructorAssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<InstructorAssignmentResponse | null>(null);

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
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
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

  // 과제 생성 폼 표시
  if (showCreateForm) {
    return (
      <HomeLayout>
        <div className="container mx-auto py-6 space-y-6">
          {/* 헤더 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowCreateForm(false)}
              >
                ← 돌아가기
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
              setShowCreateForm(false);
              // 필요시 생성된 과제 상세 페이지로 이동
              router.push(`/instructor/courses/${courseId}/assignments/${assignment.id}`);
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      </HomeLayout>
    );
  }

  // 과제 수정 폼 표시
  if (editingAssignment) {
    return (
      <HomeLayout>
        <div className="container mx-auto py-6 space-y-6">
          {/* 헤더 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setEditingAssignment(null)}
              >
                ← 돌아가기
              </Button>
            </div>
            <h1 className="text-3xl font-bold">과제 수정</h1>
            <p className="text-muted-foreground">
              {editingAssignment.title} 과제를 수정합니다.
            </p>
          </div>

          {/* 과제 수정 폼 */}
          <AssignmentForm
            courseId={courseId}
            assignment={editingAssignment}
            onSuccess={(assignment) => {
              setEditingAssignment(null);
              // 필요시 수정된 과제 상세 페이지로 이동
              router.push(`/instructor/courses/${courseId}/assignments/${assignment.id}`);
            }}
            onCancel={() => setEditingAssignment(null)}
          />
        </div>
      </HomeLayout>
    );
  }

  // 메인 과제 목록 페이지
  return (
    <HomeLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* 헤더 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/instructor/dashboard')}
            >
              ← 대시보드로 돌아가기
            </Button>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">과제 관리</h1>
              <p className="text-muted-foreground">
                {courseData.title} 코스의 과제를 관리합니다.
              </p>
            </div>
            
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              새 과제 만들기
            </Button>
          </div>
        </div>

        {/* 과제 목록 */}
        <AssignmentList
          courseId={courseId}
          totalEnrollments={courseData.enrollmentCount}
          onCreateAssignment={() => setShowCreateForm(true)}
          onEditAssignment={(assignment) => setEditingAssignment(assignment)}
          onViewSubmissions={(assignment) => {
            router.push(`/instructor/courses/${courseId}/assignments/${assignment.id}/submissions`);
          }}
        />
      </div>
    </HomeLayout>
  );
}
