'use client';

import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { HomeLayout } from '@/components/layout/home-layout';

import { SubmissionList } from '@/features/assignments/components/instructor/submission-list';
import { AssignmentStats } from '@/features/assignments/components/instructor/assignment-stats';
import { useInstructorAssignments } from '@/features/assignments/hooks/instructor/useInstructorAssignments';
import { useCourseQuery } from '@/features/courses/hooks/useCourseQuery';
import { useInstructorCourses } from '@/features/courses/hooks/useInstructorCourses';
import type { SubmissionDetailResponse } from '@/features/assignments/lib/dto';

/**
 * 강사용 제출물 관리 페이지
 * 특정 과제의 제출물들을 관리할 수 있습니다.
 */
export default function AssignmentSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const assignmentId = params.assignmentId as string;

  // 코스 정보 조회
  const { 
    data: courseData, 
    isLoading: courseLoading 
  } = useCourseQuery(courseId);

  // 강사 권한 확인
  const { 
    data: instructorCoursesData,
    isLoading: instructorCoursesLoading 
  } = useInstructorCourses();

  // 과제 정보 조회
  const { 
    data: assignmentsData, 
    isLoading: assignmentsLoading 
  } = useInstructorAssignments(courseId);

  const assignment = assignmentsData?.assignments.find(a => a.id === assignmentId);

  // 로딩 상태
  if (courseLoading || instructorCoursesLoading || assignmentsLoading) {
    return (
      <HomeLayout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          
          {/* 통계 스켈레톤 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* 제출물 목록 스켈레톤 */}
          <div className="grid gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
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
  if (!courseData || !assignment) {
    return (
      <HomeLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                과제 정보를 불러올 수 없습니다.
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

  // 제출물 상세 보기 핸들러
  const handleSubmissionClick = (submission: SubmissionDetailResponse) => {
    // 제출물 상세 페이지로 이동하거나 모달 표시
    // 현재는 콘솔 로그로 대체
    console.log('제출물 상세 보기:', submission);
    
    // 실제 구현 시에는 다음과 같이 할 수 있습니다:
    // router.push(`/instructor/courses/${courseId}/assignments/${assignmentId}/submissions/${submission.id}`);
    // 또는 모달을 열어서 제출물 상세 정보와 채점 기능을 제공
  };

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
          <div>
            <h1 className="text-3xl font-bold">제출물 관리</h1>
            <p className="text-muted-foreground">
              {assignment.title} 과제의 제출물을 관리합니다.
            </p>
          </div>
        </div>

        {/* 과제 통계 (간단 버전) */}
        <AssignmentStats
          assignment={assignment}
          totalEnrollments={courseData.enrollmentCount}
          compact={true}
        />

        {/* 제출물 목록 */}
        <SubmissionList
          assignmentId={assignmentId}
          onSubmissionSelect={handleSubmissionClick}
          onGradeSubmission={(submissionId) => {
            // 채점 페이지로 이동하는 로직 추가 필요
            console.log('Grade submission:', submissionId);
          }}
          onViewSubmission={(submissionId) => {
            // 제출물 상세 보기 로직 추가 필요
            console.log('View submission:', submissionId);
          }}
        />
      </div>
    </HomeLayout>
  );
}
