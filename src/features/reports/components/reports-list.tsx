'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Eye, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ReportStatusBadge } from './report-status-badge';
import { useReportsQuery } from '../hooks/useReportsQuery';
import type { ReportsQueryParams } from '../lib/dto';
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_NUMBER } from '@/constants/pagination';

interface ReportsListProps {
  onReportClick: (reportId: string) => void;
}

/**
 * 신고 목록 컴포넌트
 */
export const ReportsList = ({ onReportClick }: ReportsListProps) => {
  const [queryParams, setQueryParams] = useState<ReportsQueryParams>({
    page: DEFAULT_PAGE_NUMBER,
    limit: DEFAULT_PAGE_SIZE,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const { data, isLoading, error } = useReportsQuery(queryParams);

  // 필터 변경 핸들러
  const handleFilterChange = (key: keyof ReportsQueryParams, value: any) => {
    setQueryParams(prev => ({
      ...prev,
      [key]: value,
      page: 1, // 필터 변경 시 첫 페이지로 이동
    }));
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setQueryParams(prev => ({ ...prev, page }));
  };

  // 신고 타입 표시명 변환
  const getReportedTypeLabel = (type: string) => {
    switch (type) {
      case 'course': return '코스';
      case 'assignment': return '과제';
      case 'submission': return '제출물';
      case 'user': return '사용자';
      default: return type;
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            오류가 발생했습니다: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            필터 및 검색
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 상태 필터 */}
            <div>
              <label className="text-sm font-medium mb-2 block">상태</label>
              <Select
                value={queryParams.status || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('status', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="received">접수됨</SelectItem>
                  <SelectItem value="investigating">조사중</SelectItem>
                  <SelectItem value="resolved">해결됨</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 신고 타입 필터 */}
            <div>
              <label className="text-sm font-medium mb-2 block">신고 타입</label>
              <Select
                value={queryParams.reportedType || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('reportedType', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="타입 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="course">코스</SelectItem>
                  <SelectItem value="assignment">과제</SelectItem>
                  <SelectItem value="submission">제출물</SelectItem>
                  <SelectItem value="user">사용자</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 정렬 */}
            <div>
              <label className="text-sm font-medium mb-2 block">정렬</label>
              <Select
                value={`${queryParams.sortBy}-${queryParams.sortOrder}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-');
                  setQueryParams(prev => ({ ...prev, sortBy: sortBy as any, sortOrder: sortOrder as any }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="정렬 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">최신순</SelectItem>
                  <SelectItem value="created_at-asc">오래된순</SelectItem>
                  <SelectItem value="updated_at-desc">최근 업데이트순</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 페이지 크기 */}
            <div>
              <label className="text-sm font-medium mb-2 block">페이지 크기</label>
              <Select
                value={queryParams.limit.toString()}
                onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10개</SelectItem>
                  <SelectItem value="20">20개</SelectItem>
                  <SelectItem value="50">50개</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 신고 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>
            신고 목록
            {data && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (총 {data.pagination.total}건)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              신고가 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {data?.reports.map((report) => (
                <div
                  key={report.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onReportClick(report.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getReportedTypeLabel(report.reportedType)}
                      </Badge>
                      <span className="font-medium">{report.reason}</span>
                    </div>
                    <ReportStatusBadge status={report.status} />
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {report.content}
                  </p>
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>신고자: {report.reporterName}</span>
                      {report.handledByName && (
                        <span>처리자: {report.handledByName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span>
                        {format(new Date(report.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReportClick(report.id);
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        상세
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={data.pagination.page === 1}
                onClick={() => handlePageChange(data.pagination.page - 1)}
              >
                이전
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  const isActive = page === data.pagination.page;
                  
                  return (
                    <Button
                      key={page}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                disabled={data.pagination.page === data.pagination.totalPages}
                onClick={() => handlePageChange(data.pagination.page + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
