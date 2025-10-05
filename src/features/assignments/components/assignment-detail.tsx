'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Clock, 
  Weight, 
  AlertCircle,
  Loader2,
  RefreshCw,
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
  Link as LinkIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { useAssignmentQuery } from '../hooks/useAssignmentQuery';
import { SubmissionStatus } from '@/components/ui/submission-status';
import { 
  canSubmitAssignment, 
  getAssignmentStatusLabel,
  getAssignmentStatusColor,
  getSubmitButtonText,
  type Assignment,
  type Submission
} from '@/lib/utils/assignment';
import { 
  formatKoreanDateTime, 
  getDaysUntilDue, 
  getDeadlineColor,
  getDeadlineStatus 
} from '@/lib/utils/date';

interface AssignmentDetailProps {
  assignmentId: string;
}

/**
 * 과제 상세 컴포넌트
 * 과제의 상세 정보와 제출 인터페이스를 제공
 */
export const AssignmentDetail = ({ assignmentId }: AssignmentDetailProps) => {
  const {
    data: assignment,
    isLoading,
    isError,
    error,
    refetch,
  } = useAssignmentQuery(assignmentId);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 뒤로가기 버튼 */}
        <Button variant="ghost" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            대시보드로
          </Link>
        </Button>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">과제 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (isError || !assignment) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 뒤로가기 버튼 */}
        <Button variant="ghost" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            대시보드로
          </Link>
        </Button>

        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">과제를 찾을 수 없습니다</h3>
                <p className="text-muted-foreground mt-2">
                  {error instanceof Error ? error.message : '요청하신 과제가 존재하지 않거나 접근할 수 없습니다.'}
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => refetch()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  다시 시도
                </Button>
                <Button asChild>
                  <Link href="/dashboard">대시보드로</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 제출 가능 여부 확인
  const assignmentData: Assignment = {
    id: assignment.id,
    status: assignment.status,
    dueDate: assignment.dueDate,
    allowLateSubmission: assignment.allowLateSubmission,
    allowResubmission: assignment.allowResubmission,
  };

  const submissionData: Submission | undefined = assignment.submission ? {
    id: assignment.submission.id,
    status: assignment.submission.status,
    submittedAt: assignment.submission.submittedAt,
    isLate: assignment.submission.isLate,
    score: assignment.submission.score,
    feedback: assignment.submission.feedback,
  } : undefined;

  const canSubmit = canSubmitAssignment(assignmentData, submissionData);
  const submitButtonText = getSubmitButtonText(assignmentData, submissionData);
  const daysUntilDue = getDaysUntilDue(assignment.dueDate);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 뒤로가기 버튼 */}
      <Button variant="ghost" asChild>
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />
          대시보드로
        </Link>
      </Button>

      {/* 과제 헤더 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className={getAssignmentStatusColor(assignment.status)}>
                  {getAssignmentStatusLabel(assignment.status)}
                </Badge>
                <Badge variant="outline" className={getDeadlineColor(assignment.dueDate)}>
                  {getDeadlineStatus(assignment.dueDate)}
                </Badge>
              </div>
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
              <p className="text-muted-foreground">
                {assignment.course.title}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 과제 정보 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">마감일</p>
                <p className="font-medium">
                  {formatKoreanDateTime(assignment.dueDate)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Weight className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">점수 비중</p>
                <p className="font-medium">{assignment.scoreWeight}%</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">지각 제출</p>
                <p className="font-medium">
                  {assignment.allowLateSubmission ? (
                    <span className="text-green-600">허용</span>
                  ) : (
                    <span className="text-red-600">불허</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">재제출</p>
                <p className="font-medium">
                  {assignment.allowResubmission ? (
                    <span className="text-green-600">허용</span>
                  ) : (
                    <span className="text-red-600">불허</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 제출 상태 */}
          {assignment.submission ? (
            <div className="space-y-3">
              <h4 className="font-semibold">제출 상태</h4>
              <SubmissionStatus
                status={assignment.submission.status}
                isLate={assignment.submission.isLate}
                score={assignment.submission.score}
                submittedAt={assignment.submission.submittedAt}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-semibold">제출 상태</h4>
              <SubmissionStatus
                status="not-submitted"
                dueDate={assignment.dueDate}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 과제 설명 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            과제 설명
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">{assignment.description}</div>
          </div>
        </CardContent>
      </Card>

      {/* 제출물 정보 (제출한 경우) */}
      {assignment.submission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              제출물 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">제출 내용</Label>
              <div className="mt-1 p-3 bg-muted rounded-md">
                <p className="whitespace-pre-wrap">{assignment.submission.content}</p>
              </div>
            </div>
            
            {assignment.submission.link && (
              <div>
                <Label className="text-sm font-medium">첨부 링크</Label>
                <div className="mt-1">
                  <a 
                    href={assignment.submission.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline"
                  >
                    <LinkIcon className="h-4 w-4" />
                    {assignment.submission.link}
                  </a>
                </div>
              </div>
            )}

            {assignment.submission.feedback && (
              <div>
                <Label className="text-sm font-medium">피드백</Label>
                <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="whitespace-pre-wrap">{assignment.submission.feedback}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 제출 인터페이스 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            과제 제출
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canSubmit ? (
            <form className="space-y-4">
              <div>
                <Label htmlFor="content" className="text-sm font-medium">
                  제출 내용 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="과제 내용을 입력하세요..."
                  className="mt-1"
                  rows={6}
                  defaultValue={assignment.submission?.content || ''}
                />
              </div>
              
              <div>
                <Label htmlFor="link" className="text-sm font-medium">
                  첨부 링크 (선택사항)
                </Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://..."
                  className="mt-1"
                  defaultValue={assignment.submission?.link || ''}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {submitButtonText}
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8 space-y-3">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h4 className="font-semibold text-muted-foreground">제출할 수 없습니다</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {assignment.status === 'closed' 
                    ? '마감된 과제입니다.'
                    : assignment.submission && !assignment.allowResubmission
                    ? '재제출이 허용되지 않습니다.'
                    : '제출 조건을 만족하지 않습니다.'
                  }
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
