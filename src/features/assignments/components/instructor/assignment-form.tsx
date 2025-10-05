'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

import { assignmentFormSchema, type AssignmentFormData } from '@/lib/validation/assignment';
import { validateScoreWeightTotal } from '@/lib/utils/assignment';
import { useCreateAssignment } from '../../hooks/instructor/useCreateAssignment';
import { useUpdateAssignment } from '../../hooks/instructor/useUpdateAssignment';
import type { InstructorAssignmentResponse } from '../../lib/dto';

interface AssignmentFormProps {
  /** 코스 ID */
  courseId: string;
  /** 수정할 과제 정보 (수정 모드인 경우) */
  assignment?: InstructorAssignmentResponse;
  /** 기존 과제들의 점수 비중 목록 */
  existingWeights?: number[];
  /** 폼 제출 성공 시 콜백 */
  onSuccess?: (assignment: InstructorAssignmentResponse) => void;
  /** 취소 버튼 클릭 시 콜백 */
  onCancel?: () => void;
}

/**
 * 강사용 과제 생성/수정 폼 컴포넌트
 * 과제의 기본 정보를 입력받고 검증합니다.
 */
export function AssignmentForm({
  courseId,
  assignment,
  existingWeights = [],
  onSuccess,
  onCancel,
}: AssignmentFormProps) {
  const [isDraft, setIsDraft] = useState(true);
  
  const createMutation = useCreateAssignment();
  const updateMutation = useUpdateAssignment();
  
  const isEditing = !!assignment;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  // 폼 설정
  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: assignment ? {
      title: assignment.title,
      description: assignment.description,
      dueDate: new Date(assignment.dueDate),
      scoreWeight: assignment.scoreWeight,
      allowLateSubmission: assignment.allowLateSubmission,
      allowResubmission: assignment.allowResubmission,
    } : {
      title: '',
      description: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 일주일 후
      scoreWeight: 10,
      allowLateSubmission: false,
      allowResubmission: false,
    },
  });

  // 점수 비중 검증
  const currentWeight = form.watch('scoreWeight');
  const otherWeights = existingWeights.filter((_, index) => 
    !isEditing || index !== existingWeights.indexOf(assignment?.scoreWeight || 0)
  );
  const weightValidation = validateScoreWeightTotal(currentWeight, otherWeights);

  // 폼 제출 처리
  const handleSubmit = async (data: AssignmentFormData) => {
    try {
      const submitData = {
        ...data,
        dueDate: data.dueDate.toISOString(),
      };

      let result: InstructorAssignmentResponse;

      if (isEditing) {
        result = await updateMutation.mutateAsync({
          assignmentId: assignment.id,
          data: submitData,
        });
      } else {
        result = await createMutation.mutateAsync({
          courseId,
          data: submitData,
        });
      }

      onSuccess?.(result);
    } catch (error) {
      console.error('과제 저장 실패:', error);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditing ? '과제 수정' : '새 과제 만들기'}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* 기본 정보 섹션 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">기본 정보</h3>
              
              {/* 과제 제목 */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>과제 제목 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="과제 제목을 입력하세요"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      학습자에게 표시될 과제 제목입니다. (3-200자)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 과제 설명 */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>과제 설명 *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="과제에 대한 자세한 설명을 입력하세요&#10;&#10;예시:&#10;- 과제 목표&#10;- 요구사항&#10;- 제출 형식&#10;- 평가 기준"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      과제의 목표, 요구사항, 제출 형식 등을 상세히 작성해주세요. (10-5000자)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* 일정 및 점수 섹션 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">일정 및 점수</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 마감일 */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>마감일 *</FormLabel>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left font-normal"
                          type="button"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'datetime-local';
                            input.value = format(field.value, "yyyy-MM-dd'T'HH:mm");
                            input.onchange = (e) => {
                              const target = e.target as HTMLInputElement;
                              field.onChange(new Date(target.value));
                            };
                            input.click();
                          }}
                        >
                          {field.value ? (
                            format(field.value, 'yyyy년 M월 d일 HH:mm', { locale: ko })
                          ) : (
                            <span>마감일을 선택하세요</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                      <FormDescription>
                        과제 제출 마감일과 시간을 설정하세요.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 점수 비중 */}
                <FormField
                  control={form.control}
                  name="scoreWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>점수 비중 (%) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        전체 성적에서 이 과제가 차지할 비중을 설정하세요.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 점수 비중 경고 */}
              {!weightValidation.isValid && (
                <Alert>
                  <AlertDescription>
                    {weightValidation.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* 점수 비중 현황 */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>현재 점수 비중 합계:</span>
                  <Badge variant={weightValidation.total > 100 ? 'destructive' : 'default'}>
                    {weightValidation.total}%
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* 제출 정책 섹션 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">제출 정책</h3>
              
              <div className="space-y-3">
                {/* 지각 제출 허용 */}
                <FormField
                  control={form.control}
                  name="allowLateSubmission"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>지각 제출 허용</FormLabel>
                        <FormDescription>
                          마감일이 지난 후에도 제출을 허용합니다.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {/* 재제출 허용 */}
                <FormField
                  control={form.control}
                  name="allowResubmission"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>재제출 허용</FormLabel>
                        <FormDescription>
                          학습자가 과제를 다시 제출할 수 있도록 허용합니다.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  취소
                </Button>
              )}
              
              <Button
                type="submit"
                disabled={isLoading || !weightValidation.isValid}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? '수정 완료' : '과제 생성'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
