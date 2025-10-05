'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowLeft, Clock, User, AlertCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportStatusBadge } from './report-status-badge';
import { ReportActionForm } from './report-action-form';
import { useReportQuery } from '../hooks/useReportQuery';
import { useReportStatusMutation } from '../hooks/useReportStatusMutation';

interface ReportDetailProps {
  reportId: string;
  onBack: () => void;
}

/**
 * 신고 상세 컴포넌트
 */
export const ReportDetail = ({ reportId, onBack }: ReportDetailProps) => {
  const [statusUpdate, setStatusUpdate] = useState<{
    status: 'investigating' | 'resolved';
    actionTaken?: string;
  } | null>(null);

  const { data: report, isLoading, error } = useReportQuery(reportId);
  const statusMutation = useReportStatusMutation();

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

  // 상태 업데이트 처리
  const handleStatusUpdate = async () => {
    if (!statusUpdate) return;

    try {
      await statusMutation.mutateAsync({
        reportId,
        data: statusUpdate,
      });
      setStatusUpdate(null);
    } catch (error) {
      // 에러는 mutation에서 처리됨
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">오류가 발생했습니다</h3>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">신고를 찾을 수 없습니다</h3>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로 돌아가기
        </Button>
        <ReportStatusBadge status={report.status} />
      </div>

      {/* 신고 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            신고 상세 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">신고 타입</label>
              <div className="mt-1">
                <Badge variant="outline">
                  {getReportedTypeLabel(report.reportedType)}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">신고 사유</label>
              <p className="mt-1 font-medium">{report.reason}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">신고자</label>
              <p className="mt-1">{report.reporterName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">신고 일시</label>
              <p className="mt-1">
                {format(new Date(report.createdAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium text-muted-foreground">신고 내용</label>
            <div className="mt-2 p-4 bg-muted rounded-lg">
              <p className="whitespace-pre-wrap">{report.content}</p>
            </div>
          </div>

          {report.handledBy && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">처리자</label>
                  <p className="mt-1">{report.handledByName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">처리 일시</label>
                  <p className="mt-1">
                    {report.handledAt && format(new Date(report.handledAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                  </p>
                </div>
              </div>
              {report.actionTaken && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">처리 내용</label>
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <p className="whitespace-pre-wrap">{report.actionTaken}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 상태 변경 */}
      {report.status !== 'resolved' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              상태 변경
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">새 상태</label>
                <Select
                  value={statusUpdate?.status || ''}
                  onValueChange={(value: 'investigating' | 'resolved') => 
                    setStatusUpdate(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상태를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {report.status === 'received' && (
                      <SelectItem value="investigating">조사중으로 변경</SelectItem>
                    )}
                    <SelectItem value="resolved">해결됨으로 변경</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {statusUpdate?.status === 'resolved' && (
              <div>
                <label className="text-sm font-medium mb-2 block">처리 내용</label>
                <Textarea
                  placeholder="처리 내용을 입력하세요..."
                  value={statusUpdate.actionTaken || ''}
                  onChange={(e) => 
                    setStatusUpdate(prev => ({ ...prev!, actionTaken: e.target.value }))
                  }
                  className="min-h-[80px]"
                />
              </div>
            )}

            <Button
              onClick={handleStatusUpdate}
              disabled={!statusUpdate?.status || statusMutation.isPending}
              className="w-full md:w-auto"
            >
              {statusMutation.isPending ? '처리 중...' : '상태 변경'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 액션 히스토리 */}
      {report.actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              처리 이력
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.actions.map((action) => (
                <div key={action.id} className="border-l-2 border-muted pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {getActionTypeLabel(action.actionType)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        by {action.performedByName}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(action.performedAt), 'MM.dd HH:mm', { locale: ko })}
                    </span>
                  </div>
                  {action.actionDetails && (
                    <div className="text-sm text-muted-foreground">
                      {JSON.stringify(action.actionDetails, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 액션 실행 폼 */}
      <ReportActionForm
        reportId={reportId}
        reportStatus={report.status}
        onSuccess={() => {
          // 성공 시 데이터 새로고침은 mutation에서 처리됨
        }}
      />
    </div>
  );
};
