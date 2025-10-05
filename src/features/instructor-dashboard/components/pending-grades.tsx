'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useInstructorDashboard } from "../hooks/useInstructorDashboard";
import { sortSubmissionsByPriority } from "@/lib/utils/instructor-stats";
import type { PendingSubmission } from "../lib/dto";

/**
 * 채점 대기 제출물 컴포넌트
 */
export function PendingGrades() {
  const { data, isLoading, error } = useInstructorDashboard();

  if (isLoading) {
    return <PendingGradesLoading />;
  }

  if (error || !data) {
    return <PendingGradesError />;
  }

  const sortedSubmissions = sortSubmissionsByPriority(data.pendingSubmissions);
  const displaySubmissions = sortedSubmissions.slice(0, 10); // 최대 10개

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            채점 대기
            {data.pendingSubmissions.length > 0 && (
              <Badge variant="secondary">{data.pendingSubmissions.length}</Badge>
            )}
          </CardTitle>
          {data.pendingSubmissions.length > 0 && (
            <Button size="sm" variant="outline" className="gap-2">
              <ExternalLink className="h-3 w-3" />
              전체 보기
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displaySubmissions.length === 0 ? (
          <EmptyPendingGradesState />
        ) : (
          <div className="space-y-3">
            {displaySubmissions.map((submission) => (
              <PendingSubmissionItem key={submission.id} submission={submission} />
            ))}
            {data.pendingSubmissions.length > 10 && (
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  {data.pendingSubmissions.length - 10}개의 추가 제출물이 있습니다
                </p>
                <Button variant="outline" size="sm">
                  모든 채점 대기 제출물 보기
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 개별 채점 대기 제출물 아이템 컴포넌트
 */
function PendingSubmissionItem({ submission }: { submission: PendingSubmission }) {
  const submittedDate = new Date(submission.submittedAt);
  const timeAgo = formatDistanceToNow(submittedDate, { addSuffix: true, locale: ko });

  const getPriorityBadge = () => {
    if (submission.daysOverdue && submission.daysOverdue > 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {submission.daysOverdue}일 지남
        </Badge>
      );
    }
    
    if (submission.isLate) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          지각 제출
        </Badge>
      );
    }

    return null;
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm truncate">{submission.assignmentTitle}</h4>
          {getPriorityBadge()}
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
      <Button size="sm" className="ml-3 gap-1">
        <FileText className="h-3 w-3" />
        채점하기
      </Button>
    </div>
  );
}

/**
 * 채점 대기가 없는 상태 컴포넌트
 */
function EmptyPendingGradesState() {
  return (
    <div className="text-center py-8">
      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
      <h3 className="font-medium mb-1">채점할 제출물이 없습니다</h3>
      <p className="text-sm text-muted-foreground">
        모든 제출물이 채점 완료되었거나 새로운 제출물이 없습니다.
      </p>
    </div>
  );
}

/**
 * 로딩 상태 컴포넌트
 */
function PendingGradesLoading() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-20" />
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
function PendingGradesError() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          채점 대기
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">채점 대기 정보를 불러올 수 없습니다.</p>
        </div>
      </CardContent>
    </Card>
  );
}
