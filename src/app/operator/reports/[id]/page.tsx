'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ReportDetail } from '@/features/reports/components/report-detail';

interface OperatorReportDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * 운영자 신고 상세 페이지
 */
export default function OperatorReportDetailPage({ params }: OperatorReportDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  // 신고 목록으로 돌아가기
  const handleBack = () => {
    router.push('/operator/reports');
  };

  return (
    <div className="space-y-6">
      <ReportDetail
        reportId={id}
        onBack={handleBack}
      />
    </div>
  );
}
