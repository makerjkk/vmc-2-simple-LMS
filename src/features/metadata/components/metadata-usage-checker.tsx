'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AlertTriangle, BookOpen, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategoryUsageQuery } from '../hooks/useMetadataQuery';

interface MetadataUsageCheckerProps {
  categoryId: string;
  onCourseClick?: (courseId: string) => void;
}

/**
 * 사용 중인 메타데이터 확인 컴포넌트
 */
export const MetadataUsageChecker = ({ categoryId, onCourseClick }: MetadataUsageCheckerProps) => {
  const { data: usage, isLoading, error } = useCategoryUsageQuery(categoryId);

  // 코스 상태 표시명 변환
  const getCourseStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return '초안';
      case 'published': return '게시됨';
      case 'archived': return '보관됨';
      default: return status;
    }
  };

  // 코스 상태별 색상 설정
  const getCourseStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            사용 현황을 불러오는 중 오류가 발생했습니다: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            사용 현황을 불러올 수 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {usage.categoryName} 사용 현황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 사용 현황 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="text-2xl font-bold">{usage.courseCount}</div>
            <p className="text-sm text-muted-foreground">사용 중인 코스</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              {usage.canDelete ? (
                <div className="text-green-600 font-semibold">삭제 가능</div>
              ) : (
                <div className="text-red-600 font-semibold">삭제 불가</div>
              )}
              {usage.canDeactivate ? (
                <div className="text-green-600 font-semibold">비활성화 가능</div>
              ) : (
                <div className="text-red-600 font-semibold">비활성화 불가</div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {usage.canDelete 
                ? '사용 중인 코스가 없어 안전하게 삭제할 수 있습니다.'
                : '사용 중인 코스가 있어 삭제할 수 없습니다.'
              }
            </p>
          </div>
        </div>

        {/* 경고 메시지 */}
        {!usage.canDelete && (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">주의사항</h4>
              <p className="text-sm text-yellow-700 mt-1">
                이 카테고리를 사용하는 코스가 {usage.courseCount}개 있습니다. 
                카테고리를 삭제하려면 먼저 모든 코스의 카테고리를 변경해야 합니다.
              </p>
            </div>
          </div>
        )}

        {/* 사용 중인 코스 목록 */}
        {usage.courses.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">사용 중인 코스</h4>
            <div className="space-y-3">
              {usage.courses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium truncate">{course.title}</h5>
                      <Badge 
                        variant="secondary"
                        className={getCourseStatusColor(course.status)}
                      >
                        {getCourseStatusLabel(course.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      강사: {course.instructorName}
                    </p>
                  </div>
                  {onCourseClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCourseClick(course.id)}
                      className="ml-4"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {usage.courses.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            이 카테고리를 사용하는 코스가 없습니다.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
