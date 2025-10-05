'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle, AlertCircle, RotateCcw, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useInstructorDashboard } from "../hooks/useInstructorDashboard";
import type { RecentSubmission } from "../lib/dto";

/**
 * 최근 제출물 컴포넌트
 */
export function RecentSubmissions() {
  const { data, isLoading, error } = useInstructorDashboard();

  if (isLoading) {
    return <RecentSubmissionsLoading />;
  }

  if (error || !data) {
    return <RecentSubmissionsError />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            최근 제출물
            {data.recentSubmissions.length > 0 && (
              <Badge variant="secondary">{data.recentSubmissions.length}</Badge>
            )}
          </CardTitle>
          {data.recentSubmissions.length > 0 && (
            <Button size="sm" variant="outline" className="gap-2">
              <ExternalLink className="h-3 w-3" />
              전체 보기
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.recentSubmissions.length === 0 ? (
          <EmptyRecentSubmissionsState />
        ) : (
          <div className="space-y-3">
            {data.recentSubmissions.map((submission) => (
              <RecentSubmissionItem key={submission.id} submission={submission} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 개별 최근 제출물 아이템 컴포넌트
 */
function RecentSubmissionItem({ submission }: { submission: RecentSubmission }) {
  const submittedDate = new Date(submission.submittedAt);
  const timeAgo = formatDistanceToNow(submittedDate, { addSuffix: true, locale: ko });

  const getStatusBadge = () => {
    const statusConfig = {
      submitted: {
        icon: Clock,
        variant: 'secondary' as const,
        label: '제출됨',
        color: 'text-blue-600',
      },
      graded: {
        icon: CheckCircle,
        variant: 'default' as const,
        label: '채점완료',
        color: 'text-green-600',
      },
      resubmission_required: {
        icon: RotateCcw,
        variant: 'outline' as const,
        label: '재제출요청',
        color: 'text-orange-600',
      },
    };

    const config = statusConfig[submission.status];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <IconComponent className={`h-3 w-3 ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const getActionButton = () => {
    switch (submission.status) {
      case 'submitted':
        return (
          <Button size="sm" variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            채점하기
          </Button>
        );
      case 'graded':
        return (
          <Button size="sm" variant="ghost" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            확인
          </Button>
        );
      case 'resubmission_required':
        return (
          <Button size="sm" variant="outline" className="gap-1">
            <RotateCcw className="h-3 w-3" />
            재검토
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm truncate">{submission.assignmentTitle}</h4>
          {getStatusBadge()}
          {submission.isLate && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              지각
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground truncate">
            {submission.courseTitle} • {submission.learnerName}
          </p>
          <p className="text-xs text-muted-foreground">
            제출일: {timeAgo}
          </p>
        </div>
      </div>
      <div className="ml-3">
        {getActionButton()}
      </div>
    </div>
  );
}

/**
 * 최근 제출물이 없는 상태 컴포넌트
 */
function EmptyRecentSubmissionsState() {
  return (
    <div className="text-center py-8">
      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
      <h3 className="font-medium mb-1">최근 제출물이 없습니다</h3>
      <p className="text-sm text-muted-foreground">
        최근 7일 이내에 새로운 제출물이 없습니다.
      </p>
    </div>
  );
}

/**
 * 로딩 상태 컴포넌트
 */
function RecentSubmissionsLoading() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-5 w-8" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-20 ml-3" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 에러 상태 컴포넌트
 */
function RecentSubmissionsError() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          최근 제출물
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">최근 제출물 정보를 불러올 수 없습니다.</p>
        </div>
      </CardContent>
    </Card>
  );
}
