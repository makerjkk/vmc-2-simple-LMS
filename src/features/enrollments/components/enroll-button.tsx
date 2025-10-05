'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useEnrollment } from '../hooks/useEnrollment';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';

interface EnrollButtonProps {
  courseId: string;
  courseTitle?: string;
  isEnrolled: boolean;
  onEnrollmentChange?: (enrolled: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  className?: string;
}

/**
 * 수강신청/취소 버튼 컴포넌트
 */
export const EnrollButton = ({
  courseId,
  courseTitle = '이 코스',
  isEnrolled,
  onEnrollmentChange,
  disabled = false,
  size = 'default',
  variant = 'default',
  className,
}: EnrollButtonProps) => {
  const { user, isAuthenticated } = useCurrentUser();
  const { enroll, unenroll, isLoading } = useEnrollment();
  const { toast } = useToast();
  const [showUnenrollDialog, setShowUnenrollDialog] = useState(false);

  // 인증 상태 확인
  const isLearner = user?.profile?.role === 'learner';

  // 수강신청 처리
  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast({
        title: '로그인이 필요합니다',
        description: '수강신청을 하려면 먼저 로그인해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (!isLearner) {
      toast({
        title: '권한이 없습니다',
        description: '학습자만 수강신청할 수 있습니다.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await enroll(courseId);
      toast({
        title: '수강신청 완료',
        description: `${courseTitle} 수강신청이 완료되었습니다.`,
      });
      onEnrollmentChange?.(true);
    } catch (error) {
      toast({
        title: '수강신청 실패',
        description: error instanceof Error ? error.message : '수강신청 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 수강취소 처리
  const handleUnenroll = async () => {
    try {
      await unenroll(courseId);
      toast({
        title: '수강취소 완료',
        description: `${courseTitle} 수강취소가 완료되었습니다.`,
      });
      onEnrollmentChange?.(false);
      setShowUnenrollDialog(false);
    } catch (error) {
      toast({
        title: '수강취소 실패',
        description: error instanceof Error ? error.message : '수강취소 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 버튼 클릭 처리
  const handleClick = () => {
    if (isEnrolled) {
      setShowUnenrollDialog(true);
    } else {
      handleEnroll();
    }
  };

  // 버튼 비활성화 조건
  const isDisabled = disabled || isLoading || !isAuthenticated || !isLearner;

  // 버튼 텍스트 및 아이콘
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          처리중...
        </>
      );
    }

    if (isEnrolled) {
      return (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          수강취소
        </>
      );
    }

    return (
      <>
        <UserPlus className="h-4 w-4 mr-2" />
        수강신청
      </>
    );
  };

  // 버튼 variant 결정
  const buttonVariant = isEnrolled ? 'outline' : variant;

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        size={size}
        variant={buttonVariant}
        className={className}
      >
        {getButtonContent()}
      </Button>

      {/* 수강취소 확인 다이얼로그 */}
      <AlertDialog open={showUnenrollDialog} onOpenChange={setShowUnenrollDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>수강취소 확인</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 <strong>{courseTitle}</strong> 수강을 취소하시겠습니까?
              <br />
              <br />
              수강취소 시 다음과 같은 영향이 있습니다:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>과제 제출 및 성적 데이터가 집계에서 제외됩니다</li>
                <li>언제든지 다시 수강신청할 수 있습니다</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnenroll}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  처리중...
                </>
              ) : (
                '수강취소'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
