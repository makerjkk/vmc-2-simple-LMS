'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { CreateCategoryRequestSchema, UpdateCategoryRequestSchema } from '../lib/dto';
import type { CategoryResponse } from '../lib/dto';

interface MetadataFormProps {
  mode: 'create' | 'edit';
  category?: CategoryResponse;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * 메타데이터 생성/수정 폼 컴포넌트
 */
export const MetadataForm = ({ mode, category, onSubmit, onCancel, isLoading }: MetadataFormProps) => {
  const schema = mode === 'create' ? CreateCategoryRequestSchema : UpdateCategoryRequestSchema;
  
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: mode === 'edit' && category ? {
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
    } : {
      name: '',
      description: '',
      isActive: true,
    },
  });

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await onSubmit(data);
      if (mode === 'create') {
        form.reset();
      }
    } catch (error) {
      // 에러는 상위 컴포넌트에서 처리됨
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? '새 카테고리 추가' : '카테고리 수정'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* 카테고리 이름 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>카테고리 이름 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="카테고리 이름을 입력하세요"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 설명 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="카테고리에 대한 설명을 입력하세요 (선택사항)"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 활성 상태 (수정 모드에서만) */}
            {mode === 'edit' && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">활성 상태</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        비활성화하면 새로운 코스에서 이 카테고리를 선택할 수 없습니다.
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {/* 버튼 */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !form.formState.isValid}
              >
                {isLoading ? '처리 중...' : mode === 'create' ? '추가' : '수정'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
