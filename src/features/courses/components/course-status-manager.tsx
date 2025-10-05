"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Eye, 
  Archive, 
  RotateCcw, 
  Loader2, 
  Users,
  AlertTriangle,
} from 'lucide-react';
import { useUpdateCourseStatus } from '../hooks/useUpdateCourseStatus';
import { type InstructorCourseResponse } from '../lib/dto';
import { useToast } from '@/hooks/use-toast';

interface CourseStatusManagerProps {
  course: InstructorCourseResponse;
}

/**
 * 코스 상태 관리 컴포넌트
 * 현재 상태 표시, 가능한 상태 전환 버튼 제공, 확인 다이얼로그 처리
 */
export function CourseStatusManager({ course }: CourseStatusManagerProps) {
  const { toast } = useToast();
  const updateStatusMutation = useUpdateCourseStatus();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  // 상태별 스타일 및 라벨
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft':
        return {
          label: '초안',
          variant: 'secondary' as const,
          description: '작성 중인 코스입니다. 학습자에게 공개되지 않습니다.',
        };
      case 'published':
        return {
          label: '게시됨',
          variant: 'default' as const,
          description: '학습자들이 수강신청할 수 있는 공개된 코스입니다.',
        };
      case 'archived':
        return {
          label: '보관됨',
          variant: 'outline' as const,
          description: '신규 수강신청이 차단된 코스입니다. 기존 수강생은 계속 접근 가능합니다.',
        };
      default:
        return {
          label: '알 수 없음',
          variant: 'destructive' as const,
          description: '알 수 없는 상태입니다.',
        };
    }
  };

  // 가능한 상태 전환 옵션
  const getAvailableTransitions = (currentStatus: string) => {
    const transitions = [];

    switch (currentStatus) {
      case 'draft':
        transitions.push({
          status: 'published',
          label: '게시하기',
          icon: Eye,
          variant: 'default' as const,
          description: '코스를 공개하여 학습자들이 수강신청할 수 있도록 합니다.',
          warning: null,
        });
        break;

      case 'published':
        transitions.push({
          status: 'archived',
          label: '보관하기',
          icon: Archive,
          variant: 'outline' as const,
          description: '신규 수강신청을 차단합니다. 기존 수강생은 계속 접근할 수 있습니다.',
          warning: course.enrollmentCount > 0 
            ? `현재 ${course.enrollmentCount}명의 수강생이 있습니다. 보관 후에도 기존 수강생들은 계속 코스에 접근할 수 있습니다.`
            : null,
        });
        break;

      case 'archived':
        transitions.push({
          status: 'published',
          label: '복원하기',
          icon: RotateCcw,
          variant: 'default' as const,
          description: '코스를 다시 공개하여 신규 수강신청을 받을 수 있도록 합니다.',
          warning: null,
        });
        break;
    }

    return transitions;
  };

  // 상태 변경 처리
  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        courseId: course.id,
        status: newStatus as 'draft' | 'published' | 'archived',
      });

      const statusInfo = getStatusInfo(newStatus);
      toast({
        title: "상태 변경 완료",
        description: `코스가 "${statusInfo.label}" 상태로 변경되었습니다.`,
      });

      setPendingStatus(null);
    } catch (error) {
      console.error('상태 변경 오류:', error);
      
      toast({
        title: "상태 변경 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
      
      setPendingStatus(null);
    }
  };

  const currentStatusInfo = getStatusInfo(course.status);
  const availableTransitions = getAvailableTransitions(course.status);
  const isLoading = updateStatusMutation.isPending;

  return (
    <div className="space-y-4">
      {/* 현재 상태 표시 */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">현재 상태:</span>
            <Badge variant={currentStatusInfo.variant}>
              {currentStatusInfo.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {currentStatusInfo.description}
          </p>
        </div>
      </div>

      {/* 수강생 정보 (published/archived 상태일 때) */}
      {(course.status === 'published' || course.status === 'archived') && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>수강생 {course.enrollmentCount}명</span>
        </div>
      )}

      {/* 상태 전환 버튼들 */}
      {availableTransitions.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium">상태 변경:</span>
          <div className="flex flex-wrap gap-2">
            {availableTransitions.map((transition) => {
              const Icon = transition.icon;
              
              return (
                <AlertDialog key={transition.status}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant={transition.variant}
                      size="sm"
                      disabled={isLoading}
                      onClick={() => setPendingStatus(transition.status)}
                    >
                      {isLoading && pendingStatus === transition.status ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4 mr-2" />
                      )}
                      {transition.label}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {transition.label}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p>{transition.description}</p>
                        
                        {transition.warning && (
                          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-yellow-800">
                              {transition.warning}
                            </p>
                          </div>
                        )}
                        
                        <p className="font-medium">
                          계속하시겠습니까?
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setPendingStatus(null)}>
                        취소
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleStatusChange(transition.status)}
                        disabled={isLoading}
                      >
                        {isLoading && pendingStatus === transition.status ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Icon className="h-4 w-4 mr-2" />
                        )}
                        {transition.label}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
