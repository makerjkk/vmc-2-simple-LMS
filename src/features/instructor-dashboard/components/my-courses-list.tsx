'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, Star, Edit, Eye, Archive, Plus, RefreshCw, FileText } from "lucide-react";
import { useInstructorDashboard } from "../hooks/useInstructorDashboard";
import { useRouter, useSearchParams } from "next/navigation";
import { useUpdateCourseStatus } from "@/features/courses/hooks/useUpdateCourseStatus";
import { useErrorDialog } from "@/hooks/useErrorDialog";
import { ErrorDialog } from "@/components/ui/error-dialog";
import type { InstructorCourse } from "../lib/dto";

type CourseStatus = 'draft' | 'published' | 'archived';

/**
 * 내 코스 목록 컴포넌트
 */
export function MyCoursesList() {
  const { data, isLoading, error, refetch } = useInstructorDashboard();
  const [activeTab, setActiveTab] = useState<CourseStatus>('draft');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { errorState, hideError } = useErrorDialog();

  // URL 파라미터에서 탭 정보 읽기
  useEffect(() => {
    const tab = searchParams.get('tab') as CourseStatus;
    if (tab && ['draft', 'published', 'archived'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 수동 새로고침 함수
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // 새 코스 만들기 페이지로 이동
  const handleCreateCourse = () => {
    router.push('/instructor/courses/new');
  };

  // 탭 변경 핸들러 (URL 업데이트 포함)
  const handleTabChange = (status: CourseStatus) => {
    setActiveTab(status);
    const params = new URLSearchParams(searchParams);
    params.set('tab', status);
    router.replace(`/instructor/dashboard?${params.toString()}`);
  };

  if (isLoading) {
    return <MyCoursesListLoading />;
  }

  if (error || !data) {
    return <MyCoursesListError />;
  }

  const courses = data.courses;
  const filteredCourses = courses.filter(course => course.status === activeTab);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            내 코스
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            <Button size="sm" className="gap-2" onClick={handleCreateCourse}>
              <Plus className="h-4 w-4" />
              새 코스 만들기
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <EmptyCoursesState />
        ) : (
          <>
            <CourseStatusTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              courses={courses}
            />
            <div className="mt-6">
              {filteredCourses.length === 0 ? (
                <EmptyFilteredCoursesState status={activeTab} />
              ) : (
                <CourseGrid courses={filteredCourses} />
              )}
            </div>
          </>
        )}
      </CardContent>
      <ErrorDialog errorState={errorState} onClose={hideError} />
    </Card>
  );
}

/**
 * 코스 상태별 탭 컴포넌트
 */
function CourseStatusTabs({
  activeTab,
  onTabChange,
  courses,
}: {
  activeTab: CourseStatus;
  onTabChange: (status: CourseStatus) => void;
  courses: InstructorCourse[];
}) {
  const tabs = [
    { status: 'published' as const, label: '게시됨', count: courses.filter(c => c.status === 'published').length },
    { status: 'draft' as const, label: '초안', count: courses.filter(c => c.status === 'draft').length },
    { status: 'archived' as const, label: '보관됨', count: courses.filter(c => c.status === 'archived').length },
  ];

  return (
    <div className="flex space-x-1 border-b">
      {tabs.map((tab) => (
        <button
          key={tab.status}
          onClick={() => onTabChange(tab.status)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab.status
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
}

/**
 * 코스 그리드 컴포넌트
 */
function CourseGrid({ courses }: { courses: InstructorCourse[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}

/**
 * 개별 코스 카드 컴포넌트
 */
function CourseCard({ course }: { course: InstructorCourse }) {
  const router = useRouter();
  const updateCourseStatusMutation = useUpdateCourseStatus();
  const getStatusBadge = (status: CourseStatus) => {
    const variants = {
      draft: { variant: 'secondary' as const, label: '초안' },
      published: { variant: 'default' as const, label: '게시됨' },
      archived: { variant: 'outline' as const, label: '보관됨' },
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // 코스 편집 페이지로 이동
  const handleEdit = () => {
    console.log('Navigating to edit page:', `/instructor/courses/${course.id}/edit`);
    try {
      router.push(`/instructor/courses/${course.id}/edit`);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // 과제 관리 페이지로 이동
  const handleAssignments = () => {
    console.log('Navigating to assignments page:', `/instructor/courses/${course.id}/assignments`);
    try {
      router.push(`/instructor/courses/${course.id}/assignments`);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // 코스 상태 변경
  const handleStatusChange = (newStatus: 'draft' | 'published' | 'archived') => {
    updateCourseStatusMutation.mutate({
      courseId: course.id,
      status: newStatus
    });
  };

  const getActionButtons = (status: CourseStatus) => {
    switch (status) {
      case 'draft':
        return (
          <>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-1"
              onClick={handleEdit}
              disabled={updateCourseStatusMutation.isPending}
            >
              <Edit className="h-3 w-3" />
              편집
            </Button>
            <Button 
              size="sm" 
              className="gap-1"
              onClick={() => handleStatusChange('published')}
              disabled={updateCourseStatusMutation.isPending}
            >
              <Eye className="h-3 w-3" />
              게시
            </Button>
          </>
        );
      case 'published':
        return (
          <>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-1"
              onClick={handleEdit}
              disabled={updateCourseStatusMutation.isPending}
            >
              <Edit className="h-3 w-3" />
              편집
            </Button>
            <Button 
              size="sm" 
              variant="default" 
              className="gap-1"
              onClick={handleAssignments}
              disabled={updateCourseStatusMutation.isPending}
            >
              <FileText className="h-3 w-3" />
              과제 관리
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-1"
              onClick={() => handleStatusChange('archived')}
              disabled={updateCourseStatusMutation.isPending}
            >
              <Archive className="h-3 w-3" />
              보관
            </Button>
          </>
        );
      case 'archived':
        return (
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1"
            onClick={() => handleStatusChange('published')}
            disabled={updateCourseStatusMutation.isPending}
          >
            <Eye className="h-3 w-3" />
            복원
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{course.title}</h3>
            <div className="mt-1">
              {getStatusBadge(course.status)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3" />
            <span>수강생 {course.enrollmentCount}명</span>
          </div>
          {course.averageRating !== null && (
            <div className="flex items-center gap-2">
              <Star className="h-3 w-3" />
              <span>평점 {course.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          {getActionButtons(course.status)}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 코스가 없는 상태 컴포넌트
 */
function EmptyCoursesState() {
  return (
    <div className="text-center py-12">
      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">첫 번째 코스를 만들어보세요</h3>
      <p className="text-muted-foreground mb-6">
        아직 개설한 코스가 없습니다. 새로운 코스를 만들어 학습자들과 지식을 공유해보세요.
      </p>
      <Button className="gap-2">
        <Plus className="h-4 w-4" />
        첫 코스 만들기
      </Button>
    </div>
  );
}

/**
 * 필터된 코스가 없는 상태 컴포넌트
 */
function EmptyFilteredCoursesState({ status }: { status: CourseStatus }) {
  const messages = {
    draft: '초안 상태의 코스가 없습니다.',
    published: '게시된 코스가 없습니다.',
    archived: '보관된 코스가 없습니다.',
  };

  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">{messages[status]}</p>
    </div>
  );
}

/**
 * 로딩 상태 컴포넌트
 */
function MyCoursesListLoading() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-1 border-b mb-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 mt-2" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 에러 상태 컴포넌트
 */
function MyCoursesListError() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          내 코스
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">코스 정보를 불러올 수 없습니다.</p>
        </div>
      </CardContent>
    </Card>
  );
}
