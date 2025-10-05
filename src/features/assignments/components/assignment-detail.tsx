'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Clock, 
  Weight, 
  AlertCircle,
  Loader2,
  RefreshCw,
  BookOpen,
  Calendar,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { useAssignmentQuery } from '../hooks/useAssignmentQuery';
import { useSubmissionQuery } from '../hooks/useSubmissionQuery';
import { SubmissionForm } from './submission-form';
import { SubmissionStatus } from './submission-status';
import { 
  getAssignmentStatusLabel,
  getAssignmentStatusColor,
  formatDueDate,
  type Assignment,
  type Submission
} from '@/lib/utils/assignment';

interface AssignmentDetailProps {
  assignmentId: string;
}

/**
 * 과제 상세 컴포넌트
 * 과제의 상세 정보와 제출 인터페이스를 제공
 */
export const AssignmentDetail = ({ assignmentId }: AssignmentDetailProps) => {
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  const {
    data: assignment,
    isLoading: assignmentLoading,
    isError: assignmentError,
    error,
    refetch: refetchAssignment,
  } = useAssignmentQuery(assignmentId);

  const {
    data: submission,
    isLoading: submissionLoading,
    refetch: refetchSubmission,
  } = useSubmissionQuery(assignmentId);

  const isLoading = assignmentLoading || submissionLoading;
  const isError = assignmentError;

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
                <Button onClick={() => refetchAssignment()} variant="outline">
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

  // 과제 및 제출물 데이터 변환
  const assignmentData: Assignment = {
    id: assignment.id,
    status: assignment.status,
    dueDate: assignment.dueDate,
    allowLateSubmission: assignment.allowLateSubmission,
    allowResubmission: assignment.allowResubmission,
  };

  const submissionData: Submission | undefined = submission ? {
    id: submission.id,
    status: submission.status,
    submittedAt: submission.submittedAt,
    isLate: submission.isLate,
    score: null, // API 응답에서 점수 정보가 없으므로 null로 설정
    feedback: null, // API 응답에서 피드백 정보가 없으므로 null로 설정
    content: submission.content,
    linkUrl: submission.linkUrl,
  } : undefined;

  // 제출 성공 후 콜백
  const handleSubmissionSuccess = () => {
    setShowSubmissionForm(false);
    refetchSubmission();
    refetchAssignment();
  };

  // 재제출 버튼 클릭 핸들러
  const handleResubmitClick = () => {
    setShowSubmissionForm(true);
  };

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
                  {formatDueDate(assignment.dueDate)}
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
          <div className="space-y-3">
            <h4 className="font-semibold">제출 상태</h4>
            <SubmissionStatus
              assignment={assignmentData}
              submission={submissionData}
              onResubmitClick={handleResubmitClick}
            />
          </div>
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

      {/* 제출 인터페이스 */}
      {showSubmissionForm ? (
        <SubmissionForm
          assignment={assignmentData}
          existingSubmission={submissionData}
          onSubmitSuccess={handleSubmissionSuccess}
        />
      ) : (
        <div className="flex justify-center">
          <Button
            onClick={() => setShowSubmissionForm(true)}
            size="lg"
            className="min-w-[200px]"
          >
            {submissionData ? '재제출하기' : '과제 제출하기'}
          </Button>
        </div>
      )}
    </div>
  );
};
