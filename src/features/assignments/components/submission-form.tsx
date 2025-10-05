'use client';

import * as React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSubmissionMutation, useResubmissionMutation } from '../hooks/useSubmissionMutation';
import { validateSubmissionData } from '@/lib/validation/submission';
import { 
  getSubmissionAvailabilityMessage,
  formatDueDate,
  type Assignment,
  type Submission 
} from '@/lib/utils/assignment';
import type { CreateSubmissionRequest } from '@/lib/remote/api-client';

// 폼 스키마 정의
const SubmissionFormSchema = z.object({
  content: z.string().min(1, '과제 내용을 입력해주세요.').max(5000, '내용이 너무 깁니다.'),
  linkUrl: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, '올바른 URL 형식을 입력해주세요.'),
});

type SubmissionFormData = z.infer<typeof SubmissionFormSchema>;

export interface SubmissionFormProps {
  assignment: Assignment;
  existingSubmission?: Submission | null;
  onSubmitSuccess?: () => void;
  className?: string;
}

/**
 * 과제 제출/재제출 폼 컴포넌트
 * 제출 가능 여부를 검증하고 적절한 UI를 표시
 */
export const SubmissionForm: React.FC<SubmissionFormProps> = ({
  assignment,
  existingSubmission,
  onSubmitSuccess,
  className,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 뮤테이션 훅 설정
  const submissionMutation = useSubmissionMutation(assignment.id);
  const resubmissionMutation = useResubmissionMutation(assignment.id);

  // 제출 가능 여부 확인
  const availabilityInfo = getSubmissionAvailabilityMessage(assignment, existingSubmission);
  const isResubmission = Boolean(existingSubmission);

  // 폼 설정
  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(SubmissionFormSchema),
    defaultValues: {
      content: existingSubmission?.content || '',
      linkUrl: existingSubmission?.linkUrl || '',
    },
  });

  // 폼 제출 핸들러
  const handleSubmit = async (data: SubmissionFormData) => {
    setIsSubmitting(true);

    try {
      // 클라이언트 측 검증
      const validation = validateSubmissionData({
        content: data.content,
        linkUrl: data.linkUrl || null,
      });

      if (!validation.isValid) {
        Object.entries(validation.errors).forEach(([field, message]) => {
          form.setError(field as keyof SubmissionFormData, { message });
        });
        return;
      }

      // API 요청 데이터 준비
      const requestData: CreateSubmissionRequest = {
        content: data.content,
        linkUrl: data.linkUrl || null,
      };

      // 제출 또는 재제출 실행
      if (isResubmission) {
        await resubmissionMutation.mutateAsync(requestData);
        toast({
          title: '재제출 완료',
          description: '과제가 성공적으로 재제출되었습니다.',
        });
      } else {
        await submissionMutation.mutateAsync(requestData);
        toast({
          title: '제출 완료',
          description: '과제가 성공적으로 제출되었습니다.',
        });
      }

      // 성공 콜백 실행
      onSubmitSuccess?.();

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: '제출 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isResubmission ? '과제 재제출' : '과제 제출'}
          {existingSubmission?.isLate && (
            <span className="text-sm text-orange-600 font-normal">(지각 제출)</span>
          )}
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          마감일: {formatDueDate(assignment.dueDate)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 제출 가능 상태 알림 */}
        <Alert variant={availabilityInfo.variant === 'destructive' ? 'destructive' : 'default'}>
          <div className="flex items-center gap-2">
            {availabilityInfo.variant === 'destructive' && <AlertTriangle className="h-4 w-4" />}
            {availabilityInfo.variant === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
            {availabilityInfo.variant === 'default' && availabilityInfo.canSubmit && <CheckCircle className="h-4 w-4 text-green-500" />}
            <AlertDescription>{availabilityInfo.message}</AlertDescription>
          </div>
        </Alert>

        {/* 제출 불가능한 경우 폼 비활성화 */}
        {!availabilityInfo.canSubmit ? (
          <div className="text-center py-8 text-muted-foreground">
            제출이 불가능한 상태입니다.
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* 과제 내용 입력 */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>과제 내용 *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="과제 내용을 입력해주세요..."
                        className="min-h-[200px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      최대 5,000자까지 입력 가능합니다. ({field.value?.length || 0}/5,000)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 참고 링크 입력 */}
              <FormField
                control={form.control}
                name="linkUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>참고 링크 (선택사항)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      과제와 관련된 참고 자료나 결과물의 링크를 입력해주세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 제출 버튼 */}
              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || submissionMutation.isPending || resubmissionMutation.isPending}
                  className="min-w-[120px]"
                >
                  {isSubmitting || submissionMutation.isPending || resubmissionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isResubmission ? '재제출 중...' : '제출 중...'}
                    </>
                  ) : (
                    isResubmission ? '재제출하기' : '제출하기'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
};
