'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Plus, Edit, Trash2, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MetadataForm } from './metadata-form';
import { MetadataUsageChecker } from './metadata-usage-checker';
import { useCategoriesQuery } from '../hooks/useMetadataQuery';
import { useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation } from '../hooks/useMetadataMutation';
import { useErrorDialog } from '@/hooks/useErrorDialog';
import { ErrorDialog } from '@/components/ui/error-dialog';
import type { CategoryResponse } from '../lib/dto';

/**
 * 카테고리 관리 컴포넌트
 */
export const CategoriesManager = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'usage' | null>(null);

  const { data: categoriesData, isLoading, error } = useCategoriesQuery();
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();
  const { errorState, hideError } = useErrorDialog();

  // 다이얼로그 열기
  const openDialog = (mode: 'create' | 'edit' | 'usage', category?: CategoryResponse) => {
    setSelectedCategory(category || null);
    setDialogMode(mode);
  };

  // 다이얼로그 닫기
  const closeDialog = () => {
    setSelectedCategory(null);
    setDialogMode(null);
  };

  // 카테고리 생성
  const handleCreate = async (data: any) => {
    await createMutation.mutateAsync(data);
    closeDialog();
  };

  // 카테고리 수정
  const handleUpdate = async (data: any) => {
    if (!selectedCategory) return;
    await updateMutation.mutateAsync({
      categoryId: selectedCategory.id,
      data,
    });
    closeDialog();
  };

  // 카테고리 삭제
  const handleDelete = async (categoryId: string) => {
    await deleteMutation.mutateAsync(categoryId);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            카테고리 목록을 불러오는 중 오류가 발생했습니다: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">카테고리 관리</h2>
          <p className="text-muted-foreground">
            코스 카테고리를 생성, 수정, 삭제할 수 있습니다.
          </p>
        </div>
        <Button onClick={() => openDialog('create')}>
          <Plus className="h-4 w-4 mr-2" />
          새 카테고리 추가
        </Button>
      </div>

      {/* 카테고리 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>
            카테고리 목록
            {categoriesData && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (총 {categoriesData.total}개)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : !categoriesData || categoriesData.categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 카테고리가 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {categoriesData.categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{category.name}</h3>
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? '활성' : '비활성'}
                      </Badge>
                      <Badge variant="outline">
                        {category.courseCount}개 코스
                      </Badge>
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      생성일: {format(new Date(category.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                      {category.updatedAt !== category.createdAt && (
                        <span className="ml-4">
                          수정일: {format(new Date(category.updatedAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDialog('usage', category)}
                      title="사용 현황 확인"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDialog('edit', category)}
                      title="수정"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={category.courseCount > 0}
                          title={category.courseCount > 0 ? '사용 중인 코스가 있어 삭제할 수 없습니다' : '삭제'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>카테고리 삭제</AlertDialogTitle>
                          <AlertDialogDescription>
                            정말로 &quot;{category.name}&quot; 카테고리를 삭제하시겠습니까? 
                            이 작업은 되돌릴 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(category.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 다이얼로그 */}
      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' && '새 카테고리 추가'}
              {dialogMode === 'edit' && '카테고리 수정'}
              {dialogMode === 'usage' && '카테고리 사용 현황'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogMode === 'create' && (
            <MetadataForm
              mode="create"
              onSubmit={handleCreate}
              onCancel={closeDialog}
              isLoading={createMutation.isPending}
            />
          )}
          
          {dialogMode === 'edit' && selectedCategory && (
            <MetadataForm
              mode="edit"
              category={selectedCategory}
              onSubmit={handleUpdate}
              onCancel={closeDialog}
              isLoading={updateMutation.isPending}
            />
          )}
          
          {dialogMode === 'usage' && selectedCategory && (
            <MetadataUsageChecker
              categoryId={selectedCategory.id}
              onCourseClick={(courseId) => {
                // 코스 상세 페이지로 이동하는 로직 (필요시 구현)
                console.log('Navigate to course:', courseId);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <ErrorDialog errorState={errorState} onClose={hideError} />
    </div>
  );
};
