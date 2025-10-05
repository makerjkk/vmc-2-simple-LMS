"use client";

import { forwardRef } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/features/categories/hooks/useCategories';

interface CategorySelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

/**
 * 카테고리 선택 드롭다운 컴포넌트
 * 활성 카테고리만 표시하며 로딩 및 에러 상태를 처리
 */
export const CategorySelect = forwardRef<HTMLButtonElement, CategorySelectProps>(
  ({ value, onValueChange, placeholder = "카테고리를 선택하세요", disabled = false, error = false }, ref) => {
    const { data: categoriesData, isLoading, isError, error: queryError } = useCategories();

    // 디버깅 정보 출력 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log('CategorySelect 상태:', {
        isLoading,
        isError,
        queryError: queryError?.message,
        categoriesCount: categoriesData?.categories?.length || 0,
        categories: categoriesData?.categories?.map(c => ({ id: c.id, name: c.name })) || []
      });
    }

    // 로딩 중일 때
    if (isLoading) {
      return (
        <Select disabled>
          <SelectTrigger 
            ref={ref}
            className={error ? "border-red-500" : ""}
          >
            <SelectValue placeholder="카테고리 로딩 중..." />
          </SelectTrigger>
        </Select>
      );
    }

    // 에러 발생 시
    if (isError) {
      return (
        <Select disabled>
          <SelectTrigger 
            ref={ref}
            className="border-red-500"
          >
            <SelectValue placeholder="카테고리 로드 실패 - 페이지를 새로고침해주세요" />
          </SelectTrigger>
        </Select>
      );
    }

    // 카테고리가 없는 경우
    if (!categoriesData?.categories || categoriesData.categories.length === 0) {
      return (
        <Select disabled>
          <SelectTrigger 
            ref={ref}
            className={error ? "border-red-500" : ""}
          >
            <SelectValue placeholder="사용 가능한 카테고리가 없습니다" />
          </SelectTrigger>
        </Select>
      );
    }

    return (
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger 
          ref={ref}
          className={error ? "border-red-500" : ""}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {categoriesData.categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex flex-col">
                <span className="font-medium">{category.name}</span>
                {category.description && (
                  <span className="text-sm text-muted-foreground">
                    {category.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);

CategorySelect.displayName = "CategorySelect";
