'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { useDebounce } from 'react-use';
import type { CourseFilters as CourseFiltersType, SortOption } from '@/lib/utils/search';

interface CourseFiltersProps {
  onSearchChange: (term: string) => void;
  onFilterChange: (filters: CourseFiltersType) => void;
  onSortChange: (sort: SortOption) => void;
  initialSearch?: string;
  initialFilters?: CourseFiltersType;
  initialSort?: SortOption;
  categories?: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

/**
 * 코스 검색/필터/정렬 컴포넌트
 */
export const CourseFilters = ({
  onSearchChange,
  onFilterChange,
  onSortChange,
  initialSearch = '',
  initialFilters = {},
  initialSort = 'latest',
  categories = [],
  isLoading = false,
}: CourseFiltersProps) => {
  // 로컬 상태
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState(initialFilters.difficulty || 'all');
  const [selectedSort, setSelectedSort] = useState<SortOption>(initialSort);
  const [showFilters, setShowFilters] = useState(false);

  // 검색어 디바운싱 (500ms)
  useDebounce(
    () => {
      onSearchChange(searchTerm);
    },
    500,
    [searchTerm]
  );

  // 필터 변경 시 부모 컴포넌트에 알림 (의존성에서 콜백 함수 제거)
  useEffect(() => {
    const filters: CourseFiltersType = {};
    if (selectedCategory && selectedCategory !== 'all') filters.category = selectedCategory;
    if (selectedDifficulty && selectedDifficulty !== 'all') filters.difficulty = selectedDifficulty as CourseFiltersType['difficulty'];
    
    onFilterChange(filters);
  }, [selectedCategory, selectedDifficulty]); // onFilterChange 제거

  // 정렬 변경 시 부모 컴포넌트에 알림 (의존성에서 콜백 함수 제거)
  useEffect(() => {
    onSortChange(selectedSort);
  }, [selectedSort]); // onSortChange 제거

  // 필터 초기화
  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    setSelectedSort('latest');
  };

  // 활성 필터 개수 계산
  const activeFiltersCount = [selectedCategory, selectedDifficulty].filter(value => value && value !== 'all').length;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* 검색 및 기본 컨트롤 */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* 검색 입력 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="코스 제목이나 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>

            {/* 정렬 선택 */}
            <Select value={selectedSort} onValueChange={(value) => setSelectedSort(value as SortOption)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">최신순</SelectItem>
                <SelectItem value="popular">인기순</SelectItem>
              </SelectContent>
            </Select>

            {/* 필터 토글 버튼 */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              필터
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>

          {/* 확장 필터 */}
          {showFilters && (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* 카테고리 선택 */}
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">카테고리</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 카테고리</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 난이도 선택 */}
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">난이도</label>
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="난이도 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 난이도</SelectItem>
                      <SelectItem value="beginner">초급</SelectItem>
                      <SelectItem value="intermediate">중급</SelectItem>
                      <SelectItem value="advanced">고급</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 필터 액션 버튼 */}
              <div className="flex justify-between items-center pt-2">
                <div className="text-sm text-muted-foreground">
                  {activeFiltersCount > 0 && `${activeFiltersCount}개 필터 적용됨`}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    disabled={!searchTerm && activeFiltersCount === 0}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    초기화
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    닫기
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
