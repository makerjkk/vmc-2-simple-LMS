"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { CategorySelect } from './category-select';
import { useCreateCourse } from '../hooks/useCreateCourse';
import { useUpdateCourse } from '../hooks/useUpdateCourse';
import { 
  CreateCourseRequestSchema,
  type CreateCourseRequest,
  type UpdateCourseRequest,
  type InstructorCourseResponse,
} from '../lib/dto';
import { useToast } from '@/hooks/use-toast';
import { useErrorDialog } from '@/hooks/useErrorDialog';
import { ErrorDialog } from '@/components/ui/error-dialog';

interface CourseFormProps {
  mode: 'create' | 'edit';
  courseId?: string;
  initialData?: InstructorCourseResponse;
}

/**
 * 코스 생성/수정 폼 컴포넌트
 * React Hook Form + Zod 검증을 사용하여 실시간 검증 및 에러 표시
 */
export function CourseForm({ mode, courseId, initialData }: CourseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { errorState, showErrorFromException, hideError } = useErrorDialog();
  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();

  // 폼 설정
  const form = useForm<CreateCourseRequest>({
    resolver: zodResolver(CreateCourseRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      curriculum: '',
      categoryId: '',
      difficulty: 'beginner',
    },
  });

  // 수정 모드일 때 초기 데이터 설정
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      form.reset({
        title: initialData.title,
        description: initialData.description || '',
        curriculum: initialData.curriculum || '',
        categoryId: initialData.category?.id || '',
        difficulty: initialData.difficulty,
      });
    }
  }, [mode, initialData, form]);

  // 폼 제출 처리
  const onSubmit = async (data: CreateCourseRequest) => {
    try {
      if (mode === 'create') {
        // 코스 생성
        const result = await createCourseMutation.mutateAsync(data);
        
        toast({
          title: "🎉 코스 생성 완료!",
          description: `"${result.title}" 코스가 성공적으로 등록되었습니다. 강사 대시보드에서 확인하세요.`,
          duration: 4000,
        });
        
        // 강사 대시보드로 이동
                router.push('/instructor/dashboard?tab=draft');
        
      } else if (mode === 'edit' && courseId) {
        // 코스 수정
        const updateData: UpdateCourseRequest = {};
        
        // 변경된 필드만 업데이트 데이터에 포함
        if (initialData) {
          if (data.title !== initialData.title) updateData.title = data.title;
          if (data.description !== (initialData.description || '')) updateData.description = data.description;
          if (data.curriculum !== (initialData.curriculum || '')) updateData.curriculum = data.curriculum;
          if (data.categoryId !== (initialData.category?.id || '')) updateData.categoryId = data.categoryId;
          if (data.difficulty !== initialData.difficulty) updateData.difficulty = data.difficulty;
        } else {
          // 초기 데이터가 없으면 모든 필드 업데이트
          updateData.title = data.title;
          updateData.description = data.description;
          updateData.curriculum = data.curriculum;
          updateData.categoryId = data.categoryId;
          updateData.difficulty = data.difficulty;
        }
        
        // 변경사항이 있는 경우만 업데이트
        if (Object.keys(updateData).length > 0) {
          await updateCourseMutation.mutateAsync({ courseId, courseData: updateData });
          
          toast({
            title: "코스 수정 완료",
            description: "코스 정보가 성공적으로 수정되었습니다.",
          });
        } else {
          toast({
            title: "변경사항 없음",
            description: "수정할 내용이 없습니다.",
          });
        }
      }
    } catch (error) {
      console.error('폼 제출 오류:', error);
      
      // 토스트와 에러 다이얼로그 둘 다 표시
      toast({
        title: mode === 'create' ? "❌ 코스 생성 실패" : "❌ 코스 수정 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
        duration: 5000,
      });
      
      // 에러 다이얼로그도 표시
      showErrorFromException(
        error instanceof Error ? error : new Error("알 수 없는 오류가 발생했습니다."),
        mode === 'create' ? "코스 생성 실패" : "코스 수정 실패"
      );
    }
  };

  // 임시저장 처리 (draft 상태로 저장)
  const onSaveDraft = () => {
    // 현재 폼 데이터로 제출 (생성 시에는 자동으로 draft 상태)
    form.handleSubmit(onSubmit)();
  };

  const isLoading = createCourseMutation.isPending || updateCourseMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로가기
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? '새 코스 만들기' : '코스 정보 수정'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 코스 제목 */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>코스 제목 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="코스 제목을 입력하세요 (3-200자)"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      학습자들이 쉽게 이해할 수 있는 명확한 제목을 작성해주세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 코스 설명 */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>코스 설명 *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="코스에 대한 상세한 설명을 입력하세요 (10-2000자)"
                        className="min-h-[120px]"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      코스의 목표, 대상 학습자, 주요 내용 등을 포함해주세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 커리큘럼 */}
              <FormField
                control={form.control}
                name="curriculum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>커리큘럼</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="코스의 커리큘럼을 입력하세요 (선택사항, 최대 5000자)"
                        className="min-h-[200px]"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      주차별 학습 내용, 과제, 평가 방법 등을 상세히 작성해주세요.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 카테고리 */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>카테고리 *</FormLabel>
                      <FormControl>
                        <CategorySelect
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoading}
                          error={!!form.formState.errors.categoryId}
                        />
                      </FormControl>
                      <FormDescription>
                        코스에 가장 적합한 카테고리를 선택해주세요.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 난이도 */}
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>난이도 *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="난이도를 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">초급</SelectItem>
                          <SelectItem value="intermediate">중급</SelectItem>
                          <SelectItem value="advanced">고급</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        대상 학습자의 수준에 맞는 난이도를 선택해주세요.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 버튼 그룹 */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                {mode === 'create' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onSaveDraft}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    임시저장
                  </Button>
                )}
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {mode === 'create' ? '코스 생성' : '수정 완료'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* 에러 다이얼로그 */}
      <ErrorDialog errorState={errorState} onClose={hideError} />
    </div>
  );
}
