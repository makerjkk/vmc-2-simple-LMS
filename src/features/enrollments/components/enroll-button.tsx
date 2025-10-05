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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useEnrollment } from '../hooks/useEnrollment';
import { Loader2, UserPlus, UserMinus, CheckCircle, BookOpen, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ToastAction } from '@/components/ui/toast';

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
  const router = useRouter();
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
        title: '🎉 수강신청 완료!',
        description: `"${courseTitle}" 수강신청이 완료되었습니다. 이제 학습을 시작할 수 있습니다!`,
        duration: 5000,
        action: (
          <ToastAction 
            altText="학습하기"
            onClick={() => router.push('/dashboard')}
          >
            학습하기
          </ToastAction>
        ),
      });
      onEnrollmentChange?.(true);
    } catch (error) {
      toast({
        title: '❌ 수강신청 실패',
        description: error instanceof Error ? error.message : '수강신청 중 오류가 발생했습니다.',
        variant: 'destructive',
        duration: 5000,
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

  // 학습하기 버튼 클릭 처리
  const handleGoToLearning = () => {
    // 학습자 대시보드로 이동
    router.push('/dashboard');
  };

  // 버튼 클릭 처리 (수강신청만)
  const handleClick = () => {
    if (!isEnrolled) {
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
          <CheckCircle className="h-4 w-4 mr-2" />
          수강완료
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

  // 버튼 variant 및 스타일 결정
  const buttonVariant = isEnrolled ? 'default' : variant;
  const buttonClassName = isEnrolled 
    ? `${className} bg-green-600 hover:bg-green-700 text-white border-green-600` 
    : className;

  // 수강완료 상태에서는 드롭다운 메뉴 표시
  if (isEnrolled) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={isDisabled}
              size={size}
              variant={buttonVariant}
              className={buttonClassName}
            >
              {getButtonContent()}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48">
            <DropdownMenuItem onClick={handleGoToLearning} className="cursor-pointer">
              <BookOpen className="h-4 w-4 mr-2" />
              학습하기
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setShowUnenrollDialog(true)} 
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              수강취소
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 수강취소 확인 다이얼로그 */}
        <AlertDialog open={showUnenrollDialog} onOpenChange={setShowUnenrollDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>수강취소 확인</AlertDialogTitle>
              <AlertDialogDescription>
                정말로 "{courseTitle}" 수강을 취소하시겠습니까?
                <br />
                수강취소 후에는 학습 진행 상황이 초기화될 수 있습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUnenroll}
                className="bg-red-600 hover:bg-red-700"
              >
                수강취소
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // 수강신청 상태에서는 일반 버튼 표시
  return (
    <>
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        size={size}
        variant={buttonVariant}
        className={buttonClassName}
      >
        {getButtonContent()}
      </Button>

    </>
  );
};
