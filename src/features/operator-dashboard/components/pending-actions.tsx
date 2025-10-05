'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Clock, AlertTriangle, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePendingActionsQuery } from '../hooks/usePendingActionsQuery';

/**
 * 처리 대기 액션 컴포넌트
 */
export const PendingActions = () => {
  const { data, isLoading, error } = usePendingActionsQuery();

  // 액션 타입 표시명 변환
  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case 'warn': return '경고';
      case 'invalidate_submission': return '제출물 무효화';
      case 'restrict_account': return '계정 제한';
      case 'dismiss': return '신고 기각';
      default: return type;
    }
  };

  // 액션 타입별 색상 설정
  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'warn': return 'bg-yellow-100 text-yellow-800';
      case 'invalidate_submission': return 'bg-red-100 text-red-800';
      case 'restrict_account': return 'bg-red-100 text-red-800';
      case 'dismiss': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            처리 대기 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600">
            처리 대기 현황을 불러오는 중 오류가 발생했습니다: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 대기 현황 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              처리 대기 신고
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{data?.pendingReports.toLocaleString() || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              처리가 필요한 신고
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              긴급 처리 필요
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {data?.urgentReports.toLocaleString() || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              3일 이상 미처리 신고
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 최근 처리 액션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            최근 처리 액션
            {data && (
              <span className="text-sm font-normal text-muted-foreground">
                ({data.recentActions.length}건)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : !data || data.recentActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              최근 처리된 액션이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="secondary"
                      className={getActionTypeColor(action.actionType)}
                    >
                      {getActionTypeLabel(action.actionType)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      처리자: {action.performedByName}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(action.performedAt), 'MM.dd HH:mm', { locale: ko })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
