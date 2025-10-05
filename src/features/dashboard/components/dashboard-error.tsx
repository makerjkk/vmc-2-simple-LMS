"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface DashboardErrorProps {
  error: Error;
  onRetry: () => void;
}

/**
 * 대시보드 에러 상태를 표시하는 컴포넌트
 */
export function DashboardError({ error, onRetry }: DashboardErrorProps) {
  return (
    <Card className="border-red-200">
      <CardContent className="p-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="h-16 w-16 mx-auto" />
          </div>
          
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            대시보드 로딩 중 오류가 발생했습니다
          </h3>
          
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            {error.message || '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={onRetry}
              className="inline-flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              다시 시도
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2"
            >
              페이지 새로고침
            </Button>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-slate-500">
              문제가 계속 발생하면 관리자에게 문의해주세요.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
