'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportsList } from '@/features/reports/components/reports-list';

/**
 * 운영자 신고 목록 페이지
 */
export default function OperatorReportsPage() {
  const router = useRouter();

  // 신고 상세 페이지로 이동
  const handleReportClick = (reportId: string) => {
    router.push(`/operator/reports/${reportId}`);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/operator/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            대시보드로 돌아가기
          </Button>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">신고 관리</h1>
              <p className="text-muted-foreground">
                접수된 신고를 확인하고 처리할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 신고 목록 */}
      <ReportsList onReportClick={handleReportClick} />
    </div>
  );
}
