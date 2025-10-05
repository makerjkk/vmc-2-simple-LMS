'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Edit, Users, BarChart3, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

import { AssignmentForm } from '@/features/assignments/components/instructor/assignment-form';
import { AssignmentStatusManager } from '@/features/assignments/components/instructor/assignment-status-manager';
import { AssignmentStats } from '@/features/assignments/components/instructor/assignment-stats';
import { SubmissionList } from '@/features/assignments/components/instructor/submission-list';
import { useInstructorAssignments } from '@/features/assignments/hooks/instructor/useInstructorAssignments';
import { useCourseQuery } from '@/features/courses/hooks/useCourseQuery';
import { useInstructorCourses } from '@/features/courses/hooks/useInstructorCourses';
import type { InstructorAssignmentResponse, SubmissionDetailResponse } from '@/features/assignments/lib/dto';

/**
 * 강사용 과제 상세 페이지
 * 과제의 상세 정보, 통계, 제출물 관리를 제공합니다.
 */
export default function InstructorAssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const assignmentId = params.assignmentId as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'settings'>('overview');
  const [isEditing, setIsEditing] = useState(false);

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

  // 과제 목록에서 해당 과제 찾기
  const { 
    data: assignmentsData, 
    isLoading: assignmentsLoading 
  } = useInstructorAssignments(courseId);

  const assignment = assignmentsData?.assignments.find(a => a.id === assignmentId);

  // 로딩 상태
  if (courseLoading || instructorCoursesLoading || assignmentsLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        
        <Skeleton className="h-12 w-full" />
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (!courseData || !assignment) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              과제 정보를 불러올 수 없습니다.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 강사 권한 확인
  const isInstructor = instructorCoursesData?.courses.some(course => course.id === courseId);
  if (!isInstructor) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              이 코스에 대한 권한이 없습니다.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 수정 모드
  if (isEditing) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        {/* 헤더 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              ← 돌아가기
            </Button>
          </div>
          <h1 className="text-3xl font-bold">과제 수정</h1>
          <p className="text-muted-foreground">
            {assignment.title} 과제를 수정합니다.
          </p>
        </div>

        {/* 과제 수정 폼 */}
        <AssignmentForm
          courseId={courseId}
          assignment={assignment}
          onSuccess={() => {
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  // 제출물 상세 보기 핸들러
  const handleSubmissionClick = (submission: SubmissionDetailResponse) => {
    // 제출물 상세 페이지로 이동 (필요시 구현)
    console.log('제출물 상세 보기:', submission);
  };

  return (
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{assignment.title}</h1>
            <p className="text-muted-foreground">
              {courseData.title} 코스의 과제
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              수정
            </Button>
            
            {assignment.submissionCount > 0 && (
              <Button
                onClick={() => setActiveTab('submissions')}
              >
                <Users className="w-4 h-4 mr-2" />
                제출물 보기 ({assignment.submissionCount})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            개요
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <Users className="w-4 h-4 mr-2" />
            제출물 ({assignment.submissionCount})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            설정
          </TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 과제 설명 */}
          <Card>
            <CardHeader>
              <CardTitle>과제 설명</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">
                {assignment.description}
              </div>
            </CardContent>
          </Card>

          {/* 통계 */}
          <AssignmentStats
            assignment={assignment}
            totalEnrollments={courseData.enrollmentCount}
          />

          {/* 상태 관리 */}
          <AssignmentStatusManager
            assignment={assignment}
            totalEnrollments={courseData.enrollmentCount}
            onStatusChanged={(updatedAssignment) => {
              // 상태 변경 후 필요한 처리
              console.log('과제 상태 변경됨:', updatedAssignment);
            }}
          />
        </TabsContent>

        {/* 제출물 탭 */}
        <TabsContent value="submissions">
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
        </TabsContent>

        {/* 설정 탭 */}
        <TabsContent value="settings" className="space-y-6">
          {/* 과제 정보 */}
          <Card>
            <CardHeader>
              <CardTitle>과제 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">점수 비중</div>
                  <div className="text-2xl font-bold">{assignment.scoreWeight}%</div>
                </div>
                <div>
                  <div className="text-sm font-medium">제출물 수</div>
                  <div className="text-2xl font-bold">{assignment.submissionCount}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">제출 정책</div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• 지각 제출: {assignment.allowLateSubmission ? '허용' : '불허용'}</div>
                  <div>• 재제출: {assignment.allowResubmission ? '허용' : '불허용'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 상태 관리 */}
          <AssignmentStatusManager
            assignment={assignment}
            totalEnrollments={courseData.enrollmentCount}
            onStatusChanged={(updatedAssignment) => {
              console.log('과제 상태 변경됨:', updatedAssignment);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
