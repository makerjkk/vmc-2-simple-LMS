'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  Save, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  User, 
  Calendar,
  Link as LinkIcon,
  FileText,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

import { GradingFormSchema, type GradingFormData } from '@/lib/validation/grading';
import { useSubmissionGrading } from '../../hooks/instructor/useSubmissionGrading';
import { useSubmissionDetailGrading, useCanGradeSubmission } from '../../hooks/instructor/useSubmissionDetailGrading';
import { getGradeStatusLabel, getGradeStatusColor, formatGradeScore } from '@/lib/utils/grade';
import type { SubmissionForGrading } from '../../lib/dto';

interface GradingFormProps {
  /** 제출물 ID */
  submissionId: string;
  /** 채점 완료 시 콜백 */
  onGradingComplete?: (submission: SubmissionForGrading) => void;
  /** 취소 버튼 클릭 시 콜백 */
  onCancel?: () => void;
  /** 컴팩트 모드 (작은 화면용) */
  compact?: boolean;
}

/**
 * 강사용 채점 폼 컴포넌트
 * 제출물에 점수와 피드백을 부여하거나 재제출을 요청하는 폼
 */
export function GradingForm({
  submissionId,
  onGradingComplete,
  onCancel,
  compact = false,
}: GradingFormProps) {
  const [selectedAction, setSelectedAction] = useState<'grade' | 'request_resubmission'>('grade');

  // 제출물 상세 정보 조회
  const { 
    data: submission, 
    isLoading: isLoadingSubmission, 
    error: submissionError 
  } = useSubmissionDetailGrading(submissionId);

  // 채점 가능 여부 확인
  const { 
    canGrade, 
    isAlreadyGraded, 
    reason 
  } = useCanGradeSubmission(submissionId);

  // 채점 뮤테이션
  const gradingMutation = useSubmissionGrading();

  // 폼 설정
  const form = useForm<GradingFormData>({
    resolver: zodResolver(GradingFormSchema),
    defaultValues: {
      score: undefined,
      feedback: '',
      action: 'grade',
    },
  });

  // 기존 채점 정보로 폼 초기화
  useEffect(() => {
    if (submission && isAlreadyGraded) {
      form.reset({
        score: submission.score || undefined,
        feedback: submission.feedback || '',
        action: 'grade',
      });
    }
  }, [submission, isAlreadyGraded, form]);

  // 액션 변경 시 점수 필드 처리
  useEffect(() => {
    if (selectedAction === 'request_resubmission') {
      form.setValue('score', undefined);
    }
    form.setValue('action', selectedAction);
  }, [selectedAction, form]);

  // 폼 제출 처리
  const handleSubmit = async (data: GradingFormData) => {
    try {
      const result = await gradingMutation.mutateAsync({
        submissionId,
        data,
      });

      // 성공 시 콜백 호출
      if (onGradingComplete && submission) {
        const updatedSubmission: SubmissionForGrading = {
          ...submission,
          status: result.status === 'graded' ? 'graded' : 'resubmission_required',
          score: result.score,
          feedback: result.feedback,
          gradedAt: result.gradedAt,
        };
        onGradingComplete(updatedSubmission);
      }
    } catch (error) {
      console.error('채점 실패:', error);
    }
  };

  // 로딩 상태
  if (isLoadingSubmission) {
    return <GradingFormSkeleton compact={compact} />;
  }

  // 에러 상태
  if (submissionError || !submission) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">제출물을 불러올 수 없습니다</p>
            <p className="text-sm text-gray-600">잠시 후 다시 시도해주세요.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 채점 불가 상태
  if (!canGrade && reason) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <p className="text-lg font-medium mb-2">채점할 수 없습니다</p>
            <p className="text-sm text-gray-600">{reason}</p>
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="mt-4">
                돌아가기
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${compact ? 'max-w-2xl' : 'max-w-4xl'} mx-auto`}>
      {/* 제출물 정보 */}
      <SubmissionInfoCard submission={submission} compact={compact} />

      {/* 채점 폼 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {isAlreadyGraded ? '재채점' : '채점'}
          </CardTitle>
          {isAlreadyGraded && (
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                이미 채점된 제출물입니다. 새로운 점수와 피드백으로 업데이트됩니다.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* 채점 액션 선택 */}
              <div className="space-y-3">
                <FormLabel>채점 방식</FormLabel>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant={selectedAction === 'grade' ? 'default' : 'outline'}
                    onClick={() => setSelectedAction('grade')}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    채점 완료
                  </Button>
                  <Button
                    type="button"
                    variant={selectedAction === 'request_resubmission' ? 'default' : 'outline'}
                    onClick={() => setSelectedAction('request_resubmission')}
                    className="flex-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    재제출 요청
                  </Button>
                </div>
              </div>

              {/* 점수 입력 (채점 완료 시에만) */}
              {selectedAction === 'grade' && (
                <FormField
                  control={form.control}
                  name="score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>점수 *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="0-100 사이의 점수를 입력하세요"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === '' ? undefined : parseFloat(value));
                            }}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                            점
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        0점부터 100점까지 입력 가능합니다.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* 피드백 입력 */}
              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>피드백 *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          selectedAction === 'grade'
                            ? "학습자에게 전달할 피드백을 작성해주세요. 잘한 점과 개선할 점을 구체적으로 작성하면 도움이 됩니다."
                            : "재제출이 필요한 이유와 개선 방향을 구체적으로 작성해주세요."
                        }
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      최대 2000자까지 입력 가능합니다. ({field.value?.length || 0}/2000)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 액션 버튼 */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={gradingMutation.isPending}
                  className="flex-1"
                >
                  {gradingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {selectedAction === 'grade' ? '채점 완료' : '재제출 요청'}
                    </>
                  )}
                </Button>
                
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={gradingMutation.isPending}
                  >
                    취소
                  </Button>
                )}
              </div>

              {/* 에러 메시지 */}
              {gradingMutation.error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    채점 처리 중 오류가 발생했습니다. 다시 시도해주세요.
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 제출물 정보 카드 컴포넌트
 */
function SubmissionInfoCard({ 
  submission, 
  compact 
}: { 
  submission: SubmissionForGrading; 
  compact: boolean;
}) {
  const statusColor = getGradeStatusColor(submission.status);
  const statusLabel = getGradeStatusLabel(submission.status);
  
  const formattedSubmittedAt = format(
    new Date(submission.submittedAt), 
    'yyyy년 MM월 dd일 HH:mm', 
    { locale: ko }
  );

  const formattedGradedAt = submission.gradedAt 
    ? format(new Date(submission.gradedAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{submission.assignmentTitle}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={statusColor}>
                {statusLabel}
              </Badge>
              {submission.isLate && (
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  <Clock className="w-3 h-3 mr-1" />
                  지각 제출
                </Badge>
              )}
            </div>
          </div>
          
          {submission.score !== null && (
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatGradeScore(submission.score)}
              </div>
              <div className="text-sm text-gray-600">현재 점수</div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 학습자 정보 */}
        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-gray-500" />
          <div>
            <div className="font-medium">{submission.learnerName}</div>
            <div className="text-sm text-gray-600">{submission.learnerEmail}</div>
          </div>
        </div>

        {/* 제출 일시 */}
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-500" />
          <div>
            <div className="text-sm">제출일시: {formattedSubmittedAt}</div>
            {formattedGradedAt && (
              <div className="text-sm text-gray-600">채점일시: {formattedGradedAt}</div>
            )}
          </div>
        </div>

        <Separator />

        {/* 제출 내용 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="font-medium">제출 내용</span>
          </div>
          
          <div className={`bg-gray-50 rounded-lg p-4 ${compact ? 'max-h-32 overflow-y-auto' : 'max-h-48 overflow-y-auto'}`}>
            <p className="text-sm whitespace-pre-wrap">{submission.content}</p>
          </div>

          {/* 링크 URL */}
          {submission.linkUrl && (
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-gray-500" />
              <a
                href={submission.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                첨부 링크 보기
              </a>
            </div>
          )}
        </div>

        {/* 기존 피드백 (재채점 시) */}
        {submission.feedback && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium">기존 피드백</span>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-sm whitespace-pre-wrap">{submission.feedback}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 로딩 스켈레톤 컴포넌트
 */
function GradingFormSkeleton({ compact }: { compact: boolean }) {
  return (
    <div className={`space-y-6 ${compact ? 'max-w-2xl' : 'max-w-4xl'} mx-auto`}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-64 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-40 animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded w-20 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
