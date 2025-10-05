'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import type { ErrorDialogState } from '@/hooks/useErrorDialog';

interface ErrorDialogProps {
  errorState: ErrorDialogState;
  onClose: () => void;
}

/**
 * 에러 상황을 사용자에게 명확하게 전달하는 다이얼로그 컴포넌트
 */
export function ErrorDialog({ errorState, onClose }: ErrorDialogProps) {
  return (
    <AlertDialog open={errorState.isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle className="text-destructive">
              {errorState.title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {errorState.message}
            {errorState.details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  기술적 세부사항 보기
                </summary>
                <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                  {errorState.details}
                </pre>
              </details>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>
            확인
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
