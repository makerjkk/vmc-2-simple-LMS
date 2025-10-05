'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportStatusBadge } from '@/features/reports/components/report-status-badge';
import { useRecentReportsQuery } from '../hooks/useRecentReportsQuery';

interface RecentReportsProps {
  limit?: number;
  onReportClick?: (reportId: string) => void;
}

/**
 * 최근 신고 목록 컴포넌트
 */
export const RecentReports = ({ limit = 10, onReportClick }: RecentReportsProps) => {
  const { data, isLoading, error } = useRecentReportsQuery(limit);

  // 신고 타입 표시명 변환
  const getReportedTypeLabel = (type: string) => {
    switch (type) {
      case 'course': return '코스';
      case 'assignment': return '과제';
      case 'submission': return '제출물';
      case 'user': return '사용자';
      default: return type;
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            최근 신고
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600">
            최근 신고를 불러오는 중 오류가 발생했습니다: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          최근 신고
          {data && (
            <span className="text-sm font-normal text-muted-foreground">
              ({data.reports.length}건)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : !data || data.reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            최근 신고가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {data.reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {getReportedTypeLabel(report.reportedType)}
                    </Badge>
                    <span className="font-medium text-sm truncate">
                      {report.reason}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>신고자: {report.reporterName}</span>
                    <span>•</span>
                    <span>
                      {format(new Date(report.createdAt), 'MM.dd HH:mm', { locale: ko })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <ReportStatusBadge status={report.status} />
                  {onReportClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReportClick(report.id)}
                      className="h-8 px-2"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
