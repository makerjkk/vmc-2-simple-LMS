'use client';

import { useState, useCallback } from 'react';

export interface ErrorDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
}

/**
 * 에러 다이얼로그 관리 훅
 * 사용자에게 에러 상황을 명확하게 전달하기 위한 다이얼로그 상태 관리
 */
export const useErrorDialog = () => {
  const [errorState, setErrorState] = useState<ErrorDialogState>({
    isOpen: false,
    title: '',
    message: '',
    details: undefined,
  });

  /**
   * 에러 다이얼로그 표시
   */
  const showError = useCallback((
    title: string,
    message: string,
    details?: string
  ) => {
    setErrorState({
      isOpen: true,
      title,
      message,
      details,
    });
  }, []);

  /**
   * 에러 다이얼로그 닫기
   */
  const hideError = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  /**
   * Error 객체로부터 에러 다이얼로그 표시
   */
  const showErrorFromException = useCallback((
    error: Error | unknown,
    title: string = '오류가 발생했습니다'
  ) => {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    const details = error instanceof Error ? error.stack : undefined;
    
    showError(title, message, details);
  }, [showError]);

  return {
    errorState,
    showError,
    hideError,
    showErrorFromException,
  };
};
