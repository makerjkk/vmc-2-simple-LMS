'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Clock, User, Settings, Zap, AlertCircle, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAssignmentLogs } from '../../hooks/instructor/useAssignmentLogs';
import type { AssignmentLog } from '../../lib/logs-dto';

interface AssignmentLogsProps {
  assignmentId: string;
  showFilters?: boolean;
  maxItems?: number;
  compact?: boolean;
}

/**
 * Assignment 상태 변경 이력을 표시하는 컴포넌트
 */
export function AssignmentLogs({ 
  assignmentId, 
  showFilters = true, 
  maxItems = 10,
  compact = false,
}: AssignmentLogsProps) {
  const [changeReason, setChangeReason] = useState<'manual' | 'auto_close' | 'system' | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [isExpanded, setIsExpanded] = useState(!compact);

  const { data, isLoading, error, refetch } = useAssignmentLogs({
    assignmentId,
    changeReason,
    page,
    limit: maxItems,
  });

  /**
   * 변경 사유에 따른 아이콘 반환
   */
  const getChangeReasonIcon = (reason: string) => {
    switch (reason) {
      case 'manual':
        return <User className="h-4 w-4" />;
      case 'auto_close':
        return <Clock className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  /**
   * 변경 사유에 따른 라벨 반환
   */
  const getChangeReasonLabel = (reason: string) => {
    switch (reason) {
      case 'manual':
        return '수동 변경';
      case 'auto_close':
        return '자동 마감';
      case 'system':
        return '시스템';
      default:
        return '알 수 없음';
    }
  };

  /**
   * 상태에 따른 색상 반환
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * 상태에 따른 라벨 반환
   */
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return '초안';
      case 'published':
        return '게시됨';
      case 'closed':
        return '마감됨';
      default:
        return status;
    }
  };

  /**
   * 로그 항목 렌더링
   */
  const renderLogItem = (log: AssignmentLog) => (
    <div key={log.id} className="flex items-start space-x-3 p-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-shrink-0 mt-1">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
          {getChangeReasonIcon(log.changeReason)}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <Badge variant="outline" className={getStatusColor(log.previousStatus)}>
            {getStatusLabel(log.previousStatus)}
          </Badge>
          <Zap className="h-3 w-3 text-gray-400" />
          <Badge variant="outline" className={getStatusColor(log.newStatus)}>
            {getStatusLabel(log.newStatus)}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>{log.changedByName}</span>
          <span>•</span>
          <span>{getChangeReasonLabel(log.changeReason)}</span>
          <span>•</span>
          <span>{format(new Date(log.createdAt), 'PPp', { locale: ko })}</span>
        </div>
        
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {log.changeReason === 'auto_close' && log.metadata.dueDate && (
              <span>마감일: {format(new Date(log.metadata.dueDate), 'PPp', { locale: ko })}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>로그를 불러오는 중 오류가 발생했습니다.</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">상태 변경 이력</CardTitle>
          <div className="flex items-center space-x-2">
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
            {showFilters && isExpanded && (
              <Select value={changeReason || 'all'} onValueChange={(value) => {
                setChangeReason(value === 'all' ? undefined : value as 'manual' | 'auto_close' | 'system');
                setPage(1);
              }}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="manual">수동 변경</SelectItem>
                  <SelectItem value="auto_close">자동 마감</SelectItem>
                  <SelectItem value="system">시스템</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-3 w-3" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.logs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>변경 이력이 없습니다.</p>
              {changeReason && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setChangeReason(undefined);
                    setPage(1);
                  }}
                  className="mt-2"
                >
                  필터 초기화
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto">
                {data?.logs.map(renderLogItem)}
              </div>
              
              {data && data.pagination.totalPages > 1 && (
                <div className="p-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {data.pagination.total}개 중 {data.logs.length}개 표시
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                      >
                        이전
                      </Button>
                      <span className="text-sm text-gray-600">
                        {page} / {data.pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === data.pagination.totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        다음
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
