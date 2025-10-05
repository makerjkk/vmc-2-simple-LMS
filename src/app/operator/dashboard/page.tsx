'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, BarChart3, AlertTriangle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OperatorStats } from '@/features/operator-dashboard/components/operator-stats';
import { RecentReports } from '@/features/operator-dashboard/components/recent-reports';
import { PendingActions } from '@/features/operator-dashboard/components/pending-actions';

/**
 * 운영자 대시보드 페이지
 */
export default function OperatorDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  // 신고 상세 페이지로 이동
  const handleReportClick = (reportId: string) => {
    router.push(`/operator/reports/${reportId}`);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">운영자 대시보드</h1>
            <p className="text-muted-foreground">
              시스템 현황을 모니터링하고 신고를 관리할 수 있습니다.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/operator/reports')}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            신고 관리
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/operator/metadata')}
          >
            <Settings className="h-4 w-4 mr-2" />
            메타데이터 관리
          </Button>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            전체 현황
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            최근 신고
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            처리 현황
          </TabsTrigger>
        </TabsList>

        {/* 전체 현황 탭 */}
        <TabsContent value="overview" className="space-y-6">
          <OperatorStats />
        </TabsContent>

        {/* 최근 신고 탭 */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentReports
              limit={10}
              onReportClick={handleReportClick}
            />
            <PendingActions />
          </div>
        </TabsContent>

        {/* 처리 현황 탭 */}
        <TabsContent value="actions" className="space-y-6">
          <PendingActions />
        </TabsContent>
      </Tabs>
    </div>
  );
}
