'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, CheckCircle, XCircle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useReportActionMutation } from '../hooks/useReportActionMutation';
import { useErrorDialog } from '@/hooks/useErrorDialog';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { ExecuteReportActionSchema } from '../lib/dto';

interface ReportActionFormProps {
  reportId: string;
  reportStatus: 'received' | 'investigating' | 'resolved';
  onSuccess?: () => void;
}

/**
 * 신고 처리 액션 폼 컴포넌트
 */
export const ReportActionForm = ({ reportId, reportStatus, onSuccess }: ReportActionFormProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const actionMutation = useReportActionMutation();
  const { errorState, hideError } = useErrorDialog();

  const form = useForm<z.infer<typeof ExecuteReportActionSchema>>({
    resolver: zodResolver(ExecuteReportActionSchema),
    defaultValues: {
      actionType: 'warn',
      reason: '',
      actionDetails: {},
    },
  });

  // 액션 타입별 설정
  const getActionConfig = (actionType: string) => {
    switch (actionType) {
      case 'warn':
        return {
          label: '경고',
          description: '사용자에게 경고를 발송합니다.',
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
        };
      case 'invalidate_submission':
        return {
          label: '제출물 무효화',
          description: '해당 제출물을 무효화하고 재제출을 요청합니다.',
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        };
      case 'restrict_account':
        return {
          label: '계정 제한',
          description: '사용자 계정에 제한을 가합니다.',
          icon: Ban,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        };
      case 'dismiss':
        return {
          label: '신고 기각',
          description: '신고를 기각하고 종료합니다.',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        };
      default:
        return {
          label: '알 수 없음',
          description: '',
          icon: AlertTriangle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
        };
    }
  };

  const handleSubmit = async (data: z.infer<typeof ExecuteReportActionSchema>) => {
    try {
      await actionMutation.mutateAsync({
        reportId,
        data,
      });
      
      setIsDialogOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      // 에러는 mutation에서 처리됨
    }
  };

  // 해결된 신고는 액션 실행 불가
  if (reportStatus === 'resolved') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            이미 해결된 신고입니다. 추가 액션을 실행할 수 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedActionType = form.watch('actionType');
  const actionConfig = getActionConfig(selectedActionType);
  const ActionIcon = actionConfig.icon;

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>신고 처리 액션</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* 액션 타입 선택 */}
            <FormField
              control={form.control}
              name="actionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>처리 액션</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="처리할 액션을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="warn">경고</SelectItem>
                      <SelectItem value="invalidate_submission">제출물 무효화</SelectItem>
                      <SelectItem value="restrict_account">계정 제한</SelectItem>
                      <SelectItem value="dismiss">신고 기각</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 선택된 액션 미리보기 */}
            <div className={`p-4 rounded-lg border ${actionConfig.bgColor}`}>
              <div className="flex items-center gap-3">
                <ActionIcon className={`h-5 w-5 ${actionConfig.color}`} />
                <div>
                  <h4 className={`font-medium ${actionConfig.color}`}>
                    {actionConfig.label}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {actionConfig.description}
                  </p>
                </div>
              </div>
            </div>

            {/* 처리 사유 */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>처리 사유</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="처리 사유를 상세히 입력해주세요..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 실행 버튼 */}
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button 
                  type="button" 
                  className="w-full"
                  disabled={!form.formState.isValid || actionMutation.isPending}
                >
                  {actionMutation.isPending ? '처리 중...' : `${actionConfig.label} 실행`}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <ActionIcon className={`h-5 w-5 ${actionConfig.color}`} />
                    {actionConfig.label} 실행 확인
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    정말로 이 액션을 실행하시겠습니까? 실행 후에는 되돌릴 수 없습니다.
                    <br />
                    <br />
                    <strong>처리 사유:</strong> {form.getValues('reason')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={form.handleSubmit(handleSubmit)}
                    className={actionConfig.color.includes('red') ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    실행
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </form>
        </Form>
      </CardContent>
    </Card>
    
    <ErrorDialog errorState={errorState} onClose={hideError} />
  </>
  );
};
