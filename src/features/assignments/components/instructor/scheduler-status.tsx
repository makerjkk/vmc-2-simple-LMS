'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play, 
  BarChart3, 
  RefreshCw, 
  AlertTriangle,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSchedulerStatus, useSchedulerStats, useManualTriggerScheduler } from '../../hooks/instructor/useScheduler';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

interface SchedulerStatusProps {
  showStats?: boolean;
  showManualTrigger?: boolean;
  compact?: boolean;
}

/**
 * 스케줄러 상태를 표시하는 컴포넌트
 */
export function SchedulerStatus({ 
  showStats = true, 
  showManualTrigger = true,
  compact = false,
}: SchedulerStatusProps) {
  const [statsRange, setStatsRange] = useState(30);
  const { user } = useCurrentUser();
  
  const { data: status, isLoading: statusLoading, error: statusError, refetch: refetchStatus } = useSchedulerStatus();
  const { data: stats, isLoading: statsLoading, error: statsError } = useSchedulerStats(statsRange);
  const manualTrigger = useManualTriggerScheduler();

  /**
   * 수동 스케줄러 실행
   */
  const handleManualTrigger = async (force: boolean = false) => {
    if (!user?.id) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!force && status?.isRunning) {
      const confirmed = confirm('스케줄러가 이미 실행 중입니다. 강제로 실행하시겠습니까?');
      if (!confirmed) return;
    }

    try {
      await manualTrigger.mutateAsync({
        adminId: user.id,
        force,
      });
      alert('스케줄러가 성공적으로 실행되었습니다.');
    } catch (error) {
      console.error('수동 스케줄러 실행 실패:', error);
      alert('스케줄러 실행에 실패했습니다.');
    }
  };

  /**
   * 상태에 따른 배지 색상 반환
   */
  const getStatusBadge = () => {
    if (!status) return null;

    if (status.isRunning) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">실행 중</Badge>;
    }

    if (status.lastErrorAt && (!status.lastSuccessAt || new Date(status.lastErrorAt) > new Date(status.lastSuccessAt))) {
      return <Badge variant="destructive">오류 발생</Badge>;
    }

    return <Badge variant="secondary" className="bg-green-100 text-green-800">정상</Badge>;
  };

  /**
   * 성공률에 따른 색상 반환
   */
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (statusError) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              스케줄러 상태를 불러오는 중 오류가 발생했습니다.
              <Button variant="outline" size="sm" onClick={() => refetchStatus()} className="ml-2">
                다시 시도
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 스케줄러 상태 카드 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              자동 마감 스케줄러
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {statusLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : status ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    마지막 실행
                  </div>
                  <div className="text-sm font-medium">
                    {status.lastRunAt 
                      ? format(new Date(status.lastRunAt), 'PPp', { locale: ko })
                      : '실행 기록 없음'
                    }
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    마지막 성공
                  </div>
                  <div className="text-sm font-medium">
                    {status.lastSuccessAt 
                      ? format(new Date(status.lastSuccessAt), 'PPp', { locale: ko })
                      : '성공 기록 없음'
                    }
                  </div>
                </div>
              </div>

              {status.lastErrorAt && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center text-sm text-red-600 mb-1">
                    <XCircle className="h-4 w-4 mr-1" />
                    마지막 오류 ({format(new Date(status.lastErrorAt), 'PPp', { locale: ko })})
                  </div>
                  <div className="text-sm text-red-800">
                    {status.lastErrorMessage || '오류 메시지가 없습니다.'}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                <div className="text-center">
                  <div className="text-lg font-semibold">{status.runCount}</div>
                  <div className="text-xs text-gray-600">총 실행</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{status.successCount}</div>
                  <div className="text-xs text-gray-600">성공</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">{status.errorCount}</div>
                  <div className="text-xs text-gray-600">오류</div>
                </div>
              </div>

              {status.runCount > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>성공률</span>
                    <span className={`font-semibold ${getSuccessRateColor(status.successRate)}`}>
                      {status.successRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={status.successRate} className="h-2" />
                </div>
              )}

              {showManualTrigger && user?.profile?.role === 'instructor' && (
                <div className="pt-2 border-t">
                  <Button
                    onClick={() => handleManualTrigger(false)}
                    disabled={manualTrigger.isPending}
                    className="w-full"
                    variant={status.isRunning ? "outline" : "default"}
                  >
                    {manualTrigger.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    수동 실행
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* 스케줄러 통계 카드 */}
      {showStats && !compact && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                처리 통계 (최근 {statsRange}일)
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatsRange(7)}
                  className={statsRange === 7 ? 'bg-blue-100' : ''}
                >
                  7일
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatsRange(30)}
                  className={statsRange === 30 ? 'bg-blue-100' : ''}
                >
                  30일
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : statsError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  통계 데이터를 불러오는 중 오류가 발생했습니다.
                </AlertDescription>
              </Alert>
            ) : stats ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalProcessed}</div>
                    <div className="text-sm text-blue-800">처리된 과제</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{stats.totalErrors}</div>
                    <div className="text-sm text-red-800">오류 발생</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.averageProcessingTime}ms
                    </div>
                    <div className="text-sm text-green-800">평균 처리시간</div>
                  </div>
                </div>

                {stats.lastNDaysActivity.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      일별 처리 현황
                    </div>
                    <div className="space-y-1">
                      {stats.lastNDaysActivity.slice(-7).map((activity) => (
                        <div key={activity.date} className="flex items-center justify-between text-sm">
                          <span>{format(new Date(activity.date), 'M/d (E)', { locale: ko })}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-600">{activity.processed}개 처리</span>
                            {activity.errors > 0 && (
                              <span className="text-red-600">{activity.errors}개 오류</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
