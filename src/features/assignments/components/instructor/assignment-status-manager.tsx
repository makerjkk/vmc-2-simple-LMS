'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';

import { 
  getAssignmentStatusLabel, 
  getAssignmentStatusColor,
  validateStatusTransition,
  formatDueDate,
  isAssignmentOverdue
} from '@/lib/utils/assignment';
import { useUpdateAssignmentStatus } from '../../hooks/instructor/useUpdateAssignmentStatus';
import { AssignmentLogs } from './assignment-logs';
import type { InstructorAssignmentResponse } from '../../lib/dto';

interface AssignmentStatusManagerProps {
  /** 과제 정보 */
  assignment: InstructorAssignmentResponse;
  /** 수강생 수 */
  totalEnrollments?: number;
  /** 상태 변경 성공 시 콜백 */
  onStatusChanged?: (assignment: InstructorAssignmentResponse) => void;
}

/**
 * 강사용 과제 상태 관리 컴포넌트
 * 과제의 상태 전환과 관련 정보를 표시합니다.
 */
export function AssignmentStatusManager({
  assignment,
  totalEnrollments = 0,
  onStatusChanged,
}: AssignmentStatusManagerProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    newStatus?: 'draft' | 'published' | 'closed';
    title?: string;
    description?: string;
    warning?: string;
  }>({ open: false });

  const updateStatusMutation = useUpdateAssignmentStatus();

  // 상태 전환 가능 여부 확인
  const getStatusTransitions = () => {
    const transitions = [];

    // Draft → Published
    if (assignment.status === 'draft') {
      const validation = validateStatusTransition(
        'draft', 
        'published', 
        assignment.submissionCount > 0,
        assignment.dueDate
      );
      
      if (validation.isValid) {
        transitions.push({
          status: 'published' as const,
          label: '게시',
          icon: Play,
          variant: 'default' as const,
          description: '과제를 학습자에게 공개합니다.',
        });
      }
    }

    // Published → Closed
    if (assignment.status === 'published') {
      const validation = validateStatusTransition(
        'published', 
        'closed', 
        assignment.submissionCount > 0
      );
      
      if (validation.isValid) {
        transitions.push({
          status: 'closed' as const,
          label: '마감',
          icon: Pause,
          variant: 'secondary' as const,
          description: '과제를 마감하고 더 이상 제출을 받지 않습니다.',
        });
      }
    }

    // Closed → Published (조건부)
    if (assignment.status === 'closed') {
      const validation = validateStatusTransition(
        'closed', 
        'published', 
        assignment.submissionCount > 0,
        assignment.dueDate
      );
      
      if (validation.isValid) {
        transitions.push({
          status: 'published' as const,
          label: '재개',
          icon: RotateCcw,
          variant: 'outline' as const,
          description: '과제를 다시 게시하고 제출을 받습니다.',
        });
      }
    }

    return transitions;
  };

  // 상태 변경 확인 다이얼로그 열기
  const handleStatusChangeClick = (
    newStatus: 'draft' | 'published' | 'closed',
    title: string,
    description: string,
    warning?: string
  ) => {
    setConfirmDialog({
      open: true,
      newStatus,
      title,
      description,
      warning,
    });
  };

  // 상태 변경 실행
  const handleStatusChange = async () => {
    if (!confirmDialog.newStatus) return;

    try {
      const result = await updateStatusMutation.mutateAsync({
        assignmentId: assignment.id,
        status: confirmDialog.newStatus,
      });

      setConfirmDialog({ open: false });
      onStatusChanged?.(result);
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  };

  const transitions = getStatusTransitions();
  const isOverdue = isAssignmentOverdue(assignment.dueDate);
  const submissionRate = totalEnrollments > 0 
    ? Math.round((assignment.submissionCount / totalEnrollments) * 100)
    : 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            과제 상태 관리
            <Badge className={getAssignmentStatusColor(assignment.status)}>
              {getAssignmentStatusLabel(assignment.status)}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 현재 상태 정보 */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 마감일 정보 */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">마감일</div>
                  <div className={`text-sm ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {formatDueDate(assignment.dueDate)}
                    {isOverdue && ' (경과)'}
                  </div>
                </div>
              </div>

              {/* 제출 현황 */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">제출 현황</div>
                  <div className="text-sm text-muted-foreground">
                    {assignment.submissionCount}명 제출
                    {totalEnrollments > 0 && ` (${submissionRate}%)`}
                  </div>
                </div>
              </div>

              {/* 채점 현황 */}
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">채점 현황</div>
                  <div className="text-sm text-muted-foreground">
                    {assignment.gradedCount}/{assignment.submissionCount} 완료
                  </div>
                </div>
              </div>
            </div>

            {/* 상태별 알림 */}
            {assignment.status === 'draft' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  아직 학습자에게 공개되지 않은 과제입니다. 게시하면 학습자가 과제를 확인할 수 있습니다.
                </AlertDescription>
              </Alert>
            )}

            {assignment.status === 'published' && isOverdue && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  마감일이 지난 과제입니다. 
                  {assignment.allowLateSubmission 
                    ? '지각 제출이 허용되어 계속 제출을 받고 있습니다.' 
                    : '더 이상 제출을 받지 않습니다.'}
                </AlertDescription>
              </Alert>
            )}

            {assignment.status === 'closed' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  마감된 과제입니다. 더 이상 제출을 받지 않으며, 채점만 가능합니다.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* 상태 전환 버튼들 */}
          {transitions.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium">상태 변경</h4>
                <div className="flex flex-wrap gap-2">
                  {transitions.map((transition) => {
                    const Icon = transition.icon;
                    return (
                      <Button
                        key={transition.status}
                        variant={transition.variant}
                        size="sm"
                        onClick={() => handleStatusChangeClick(
                          transition.status,
                          `과제 ${transition.label}`,
                          transition.description,
                          transition.warning
                        )}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {transition.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* 상태 전환 불가 안내 */}
          {transitions.length === 0 && assignment.status === 'closed' && isOverdue && (
            <Alert>
              <AlertDescription>
                마감일이 지난 과제는 다시 게시할 수 없습니다.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 상태 변경 이력 */}
      <div className="mt-4">
        <AssignmentLogs 
          assignmentId={assignment.id} 
          showFilters={true}
          maxItems={5}
          compact={true}
        />
      </div>

      {/* 상태 변경 확인 다이얼로그 */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div>{confirmDialog.description}</div>
              {confirmDialog.warning && (
                <div className="text-orange-600 font-medium">
                  ⚠️ {confirmDialog.warning}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
