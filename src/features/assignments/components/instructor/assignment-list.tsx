'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  MoreHorizontal, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Play, 
  Pause, 
  RotateCcw,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

import { 
  getAssignmentStatusLabel, 
  getAssignmentStatusColor,
  formatDueDate,
  isDueSoon,
  isAssignmentOverdue,
  getAssignmentActions,
  calculateAssignmentProgress,
  calculateAssignmentPriority,
  type InstructorAssignment
} from '@/lib/utils/assignment';
import { useInstructorAssignments } from '../../hooks/instructor/useInstructorAssignments';
import { useUpdateAssignmentStatus } from '../../hooks/instructor/useUpdateAssignmentStatus';
import { useDeleteAssignment } from '../../hooks/instructor/useDeleteAssignment';
import type { InstructorAssignmentResponse } from '../../lib/dto';

interface AssignmentListProps {
  /** 코스 ID */
  courseId: string;
  /** 수강생 수 (진행률 계산용) */
  totalEnrollments?: number;
  /** 과제 생성 버튼 클릭 시 콜백 */
  onCreateAssignment?: () => void;
  /** 과제 수정 버튼 클릭 시 콜백 */
  onEditAssignment?: (assignment: InstructorAssignmentResponse) => void;
  /** 제출물 보기 버튼 클릭 시 콜백 */
  onViewSubmissions?: (assignment: InstructorAssignmentResponse) => void;
}

/**
 * 강사용 과제 목록 컴포넌트
 * 상태별 탭과 과제 관리 기능을 제공합니다.
 */
export function AssignmentList({
  courseId,
  totalEnrollments = 0,
  onCreateAssignment,
  onEditAssignment,
  onViewSubmissions,
}: AssignmentListProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'published' | 'closed'>('all');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; assignment?: InstructorAssignmentResponse }>({ open: false });

  // 쿼리 훅들
  const { 
    data: assignmentsData, 
    isLoading, 
    error 
  } = useInstructorAssignments(courseId, {
    status: activeTab === 'all' ? undefined : activeTab,
  });

  const updateStatusMutation = useUpdateAssignmentStatus();
  const deleteMutation = useDeleteAssignment();

  // 상태 변경 처리
  const handleStatusChange = async (
    assignment: InstructorAssignmentResponse, 
    newStatus: 'draft' | 'published' | 'closed'
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        assignmentId: assignment.id,
        status: newStatus,
      });
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!deleteDialog.assignment) return;

    try {
      await deleteMutation.mutateAsync({
        assignmentId: deleteDialog.assignment.id,
        courseId: deleteDialog.assignment.courseId,
      });
      setDeleteDialog({ open: false });
    } catch (error) {
      console.error('과제 삭제 실패:', error);
    }
  };

  // 과제 카드 렌더링
  const renderAssignmentCard = (assignment: InstructorAssignmentResponse) => {
    const actions = getAssignmentActions(assignment as any, assignment.submissionCount);
    const progress = calculateAssignmentProgress(assignment as any, totalEnrollments);
    const priority = calculateAssignmentPriority(assignment as any, totalEnrollments);

    return (
      <Card key={assignment.id} className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{assignment.title}</CardTitle>
                <Badge className={getAssignmentStatusColor(assignment.status)}>
                  {getAssignmentStatusLabel(assignment.status)}
                </Badge>
                {priority.priority === 'high' && (
                  <Badge variant="destructive">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    긴급
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className={isDueSoon(assignment.dueDate) ? 'text-orange-600' : ''}>
                    {formatDueDate(assignment.dueDate)}
                  </span>
                  {isAssignmentOverdue(assignment.dueDate) && assignment.status === 'published' && (
                    <Badge variant="destructive" className="ml-1">마감</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{assignment.submissionCount}명 제출</span>
                </div>
                
                <div>
                  <span className="font-medium">{assignment.scoreWeight}%</span>
                </div>
              </div>
            </div>

            {/* 액션 메뉴 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.canEdit && (
                  <DropdownMenuItem onClick={() => onEditAssignment?.(assignment)}>
                    <Edit className="w-4 h-4 mr-2" />
                    수정
                  </DropdownMenuItem>
                )}
                
                {assignment.submissionCount > 0 && (
                  <DropdownMenuItem onClick={() => onViewSubmissions?.(assignment)}>
                    <Eye className="w-4 h-4 mr-2" />
                    제출물 보기 ({assignment.submissionCount})
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {actions.canPublish && (
                  <DropdownMenuItem onClick={() => handleStatusChange(assignment, 'published')}>
                    <Play className="w-4 h-4 mr-2" />
                    게시
                  </DropdownMenuItem>
                )}

                {actions.canClose && (
                  <DropdownMenuItem onClick={() => handleStatusChange(assignment, 'closed')}>
                    <Pause className="w-4 h-4 mr-2" />
                    마감
                  </DropdownMenuItem>
                )}

                {actions.canReopen && (
                  <DropdownMenuItem onClick={() => handleStatusChange(assignment, 'published')}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    재개
                  </DropdownMenuItem>
                )}

                {actions.canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialog({ open: true, assignment })}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {assignment.description}
          </p>

          {/* 진행률 표시 */}
          {assignment.status === 'published' && totalEnrollments > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>제출률</span>
                <span>{progress.submissionRate}%</span>
              </div>
              <Progress value={progress.submissionRate} className="h-2" />
              
              {assignment.submissionCount > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>채점 완료</span>
                  <span>{assignment.gradedCount}/{assignment.submissionCount}</span>
                </div>
              )}
            </div>
          )}

          {/* 우선순위 이유 */}
          {priority.reasons.length > 0 && (
            <div className="mt-3 text-xs text-muted-foreground">
              {priority.reasons.join(' • ')}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-10 w-full" />
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
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            과제 목록을 불러오는 중 오류가 발생했습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  const assignments = assignmentsData?.assignments || [];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">과제 관리</h2>
        {onCreateAssignment && (
          <Button onClick={onCreateAssignment}>
            <Plus className="w-4 h-4 mr-2" />
            새 과제 만들기
          </Button>
        )}
      </div>

      {/* 상태별 탭 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="draft">초안</TabsTrigger>
          <TabsTrigger value="published">게시됨</TabsTrigger>
          <TabsTrigger value="closed">마감됨</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  {activeTab === 'all' 
                    ? '아직 생성된 과제가 없습니다.' 
                    : `${getAssignmentStatusLabel(activeTab as any)} 상태의 과제가 없습니다.`}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {assignments.map(renderAssignmentCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>과제 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteDialog.assignment?.title}&quot; 과제를 삭제하시겠습니까?
              <br />
              삭제된 과제는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
