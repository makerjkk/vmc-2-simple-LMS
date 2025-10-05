'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  ExternalLink,
  Calendar,
  User,
  Star
} from 'lucide-react';
import {
  getSubmissionStatusText,
  getSubmissionStatusColor,
  formatDueDate,
  canResubmit,
  type Assignment,
  type Submission
} from '@/lib/utils/assignment';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface SubmissionStatusProps {
  assignment: Assignment;
  submission?: Submission | null;
  onResubmitClick?: () => void;
  className?: string;
}

/**
 * 과제 제출 상태 표시 컴포넌트
 * 제출 상태, 점수, 피드백 등을 표시하고 재제출 버튼을 제공
 */
export const SubmissionStatus: React.FC<SubmissionStatusProps> = ({
  assignment,
  submission,
  onResubmitClick,
  className,
}) => {
  // 제출 상태 정보
  const statusText = getSubmissionStatusText(submission, assignment);
  const statusColor = getSubmissionStatusColor(submission, assignment);
  const canResubmitAssignment = canResubmit(assignment, submission);

  // 제출물이 없는 경우
  if (!submission) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            제출 상태
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={statusColor}>{statusText}</Badge>
            <span className="text-sm text-muted-foreground">
              마감일: {formatDueDate(assignment.dueDate)}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            제출 상태
          </div>
          <Badge variant={statusColor}>{statusText}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 제출 기본 정보 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">제출일:</span>
            <span>
              {format(parseISO(submission.submittedAt), 'M월 d일 HH:mm', { locale: ko })}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">상태:</span>
            <span className={submission.isLate ? 'text-orange-600' : 'text-green-600'}>
              {submission.isLate ? '지각 제출' : '정시 제출'}
            </span>
          </div>
        </div>

        <Separator />

        {/* 제출 내용 */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            제출 내용
          </h4>
          <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
            {submission.content}
          </div>
        </div>

        {/* 참고 링크 */}
        {submission.linkUrl && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              참고 링크
            </h4>
            <a
              href={submission.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
            >
              {submission.linkUrl}
            </a>
          </div>
        )}

        {/* 채점 정보 (채점 완료된 경우) */}
        {submission.status === 'graded' && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                채점 결과
              </h4>
              
              {/* 점수 */}
              {submission.score !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">점수:</span>
                  <span className="font-semibold text-lg">
                    {submission.score}점 / 100점
                  </span>
                  <Badge variant={submission.score >= 70 ? 'default' : 'destructive'}>
                    {submission.score >= 90 ? '우수' : submission.score >= 70 ? '양호' : '미흡'}
                  </Badge>
                </div>
              )}

              {/* 피드백 */}
              {submission.feedback && (
                <div className="space-y-2">
                  <span className="text-muted-foreground">피드백:</span>
                  <div className="bg-blue-50 border-l-4 border-blue-200 p-3 text-sm">
                    {submission.feedback}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* 재제출 요청 메시지 */}
        {submission.status === 'resubmission_required' && (
          <>
            <Separator />
            <div className="bg-orange-50 border-l-4 border-orange-200 p-3">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">재제출이 요청되었습니다</span>
              </div>
              {submission.feedback && (
                <p className="mt-2 text-sm text-orange-700">
                  {submission.feedback}
                </p>
              )}
            </div>
          </>
        )}

        {/* 재제출 버튼 */}
        {canResubmitAssignment && onResubmitClick && (
          <div className="flex justify-end pt-2">
            <Button
              onClick={onResubmitClick}
              variant={submission.status === 'resubmission_required' ? 'default' : 'outline'}
              size="sm"
            >
              재제출하기
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
