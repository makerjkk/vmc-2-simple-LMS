'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

import { useAssignmentSubmissionsGrading, useGradingStats } from '../../hooks/instructor/useAssignmentSubmissionsGrading';
import { getGradeStatusLabel, getGradeStatusColor, calculateGradingProgress } from '@/lib/utils/grade';
import type { SubmissionForGrading } from '../../lib/dto';

interface SubmissionListProps {
  /** 과제 ID */
  assignmentId: string;
  /** 제출물 선택 시 콜백 */
  onSubmissionSelect?: (submission: SubmissionForGrading) => void;
  /** 채점 페이지로 이동 콜백 */
  onGradeSubmission?: (submissionId: string) => void;
  /** 제출물 상세 보기 콜백 */
  onViewSubmission?: (submissionId: string) => void;
}

/**
 * 강사용 제출물 목록 컴포넌트
 * 채점을 위한 제출물 목록을 표시하고 필터링 기능을 제공
 */
export function SubmissionList({
  assignmentId,
  onSubmissionSelect,
  onGradeSubmission,
  onViewSubmission,
}: SubmissionListProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'submitted' | 'graded' | 'resubmission_required'>('all');
  const [isLateFilter, setIsLateFilter] = useState<boolean | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 제출물 목록 조회
  const { 
    data: submissionsData, 
    isLoading, 
    error 
  } = useAssignmentSubmissionsGrading(assignmentId, {
    status: activeTab === 'all' ? undefined : activeTab,
    isLate: isLateFilter,
    page: currentPage,
    limit: pageSize,
  });

  // 채점 통계 조회
  const { data: stats } = useGradingStats(assignmentId);

  // 검색 필터링
  const filteredSubmissions = submissionsData?.submissions.filter(submission =>
    searchTerm === '' || 
    submission.learnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.learnerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // 페이지네이션 정보
  const pagination = submissionsData?.pagination;
  const totalPages = pagination?.totalPages || 1;

  // 로딩 상태
  if (isLoading) {
    return <SubmissionListSkeleton />;
  }

  // 에러 상태
  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">제출물 목록을 불러올 수 없습니다</p>
            <p className="text-sm text-gray-600">잠시 후 다시 시도해주세요.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 채점 진행 상황 */}
      {stats && <GradingProgressCard stats={stats} />}

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              제출물 목록
            </CardTitle>
            
            <div className="flex flex-col sm:flex-row gap-2">
              {/* 검색 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="학습자 이름 또는 이메일 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>

              {/* 지각 필터 */}
              <Select
                value={isLateFilter === undefined ? 'all' : isLateFilter.toString()}
                onValueChange={(value) => 
                  setIsLateFilter(value === 'all' ? undefined : value === 'true')
                }
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="false">정시</SelectItem>
                  <SelectItem value="true">지각</SelectItem>
                </SelectContent>
              </Select>

              {/* 페이지 크기 */}
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* 상태별 탭 */}
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value as typeof activeTab);
            setCurrentPage(1);
          }}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                전체 ({stats?.total || 0})
              </TabsTrigger>
              <TabsTrigger value="submitted">
                미채점 ({stats?.pending || 0})
              </TabsTrigger>
              <TabsTrigger value="graded">
                채점완료 ({stats?.graded || 0})
              </TabsTrigger>
              <TabsTrigger value="resubmission_required">
                재제출요청 ({stats?.resubmissionRequired || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredSubmissions.length === 0 ? (
                <EmptyState activeTab={activeTab} />
              ) : (
                <SubmissionTable 
                  submissions={filteredSubmissions}
                  onGradeSubmission={onGradeSubmission}
                  onViewSubmission={onViewSubmission}
                  onSubmissionSelect={onSubmissionSelect}
                />
              )}
            </TabsContent>
          </Tabs>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                총 {pagination?.total || 0}개 중 {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, pagination?.total || 0)}개 표시
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  이전
                </Button>
                
                <span className="text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 채점 진행 상황 카드 컴포넌트
 */
function GradingProgressCard({ stats }: { stats: any }) {
  const progress = calculateGradingProgress(stats.total, stats.graded);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          채점 진행 상황
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">전체 진행률</span>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-gray-600">전체</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <div className="text-xs text-gray-600">미채점</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.graded}</div>
              <div className="text-xs text-gray-600">채점완료</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.resubmissionRequired}</div>
              <div className="text-xs text-gray-600">재제출요청</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 제출물 테이블 컴포넌트
 */
function SubmissionTable({ 
  submissions, 
  onGradeSubmission, 
  onViewSubmission,
  onSubmissionSelect 
}: {
  submissions: SubmissionForGrading[];
  onGradeSubmission?: (submissionId: string) => void;
  onViewSubmission?: (submissionId: string) => void;
  onSubmissionSelect?: (submission: SubmissionForGrading) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-medium">학습자</th>
            <th className="text-left py-3 px-4 font-medium">상태</th>
            <th className="text-left py-3 px-4 font-medium">점수</th>
            <th className="text-left py-3 px-4 font-medium">제출일시</th>
            <th className="text-left py-3 px-4 font-medium">작업</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <SubmissionRow
              key={submission.id}
              submission={submission}
              onGradeSubmission={onGradeSubmission}
              onViewSubmission={onViewSubmission}
              onSubmissionSelect={onSubmissionSelect}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 제출물 행 컴포넌트
 */
function SubmissionRow({ 
  submission, 
  onGradeSubmission, 
  onViewSubmission,
  onSubmissionSelect 
}: {
  submission: SubmissionForGrading;
  onGradeSubmission?: (submissionId: string) => void;
  onViewSubmission?: (submissionId: string) => void;
  onSubmissionSelect?: (submission: SubmissionForGrading) => void;
}) {
  const statusColor = getGradeStatusColor(submission.status);
  const statusLabel = getGradeStatusLabel(submission.status);
  
  const formattedSubmittedAt = format(
    new Date(submission.submittedAt), 
    'MM/dd HH:mm', 
    { locale: ko }
  );

  return (
    <tr 
      className="border-b hover:bg-gray-50 cursor-pointer"
      onClick={() => onSubmissionSelect?.(submission)}
    >
      <td className="py-3 px-4">
        <div>
          <div className="font-medium">{submission.learnerName}</div>
          <div className="text-sm text-gray-600">{submission.learnerEmail}</div>
        </div>
      </td>
      
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Badge className={statusColor}>
            {statusLabel}
          </Badge>
          {submission.isLate && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              <Clock className="w-3 h-3 mr-1" />
              지각
            </Badge>
          )}
        </div>
      </td>
      
      <td className="py-3 px-4">
        {submission.score !== null ? (
          <span className="font-medium">{submission.score}점</span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      
      <td className="py-3 px-4">
        <span className="text-sm">{formattedSubmittedAt}</span>
      </td>
      
      <td className="py-3 px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewSubmission?.(submission.id)}>
              <Eye className="w-4 h-4 mr-2" />
              상세 보기
            </DropdownMenuItem>
            {(submission.status === 'submitted' || submission.status === 'resubmission_required') && (
              <DropdownMenuItem onClick={() => onGradeSubmission?.(submission.id)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                채점하기
              </DropdownMenuItem>
            )}
            {submission.status === 'graded' && (
              <DropdownMenuItem onClick={() => onGradeSubmission?.(submission.id)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                재채점하기
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

/**
 * 빈 상태 컴포넌트
 */
function EmptyState({ activeTab }: { activeTab: string }) {
  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'submitted':
        return '채점 대기 중인 제출물이 없습니다.';
      case 'graded':
        return '채점 완료된 제출물이 없습니다.';
      case 'resubmission_required':
        return '재제출 요청된 제출물이 없습니다.';
      default:
        return '제출물이 없습니다.';
    }
  };

  return (
    <div className="text-center py-12">
      <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
      <p className="text-lg font-medium text-gray-600 mb-2">{getEmptyMessage()}</p>
      <p className="text-sm text-gray-500">
        학습자들이 과제를 제출하면 여기에 표시됩니다.
      </p>
    </div>
  );
}

/**
 * 로딩 스켈레톤 컴포넌트
 */
function SubmissionListSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-2 w-full" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-8 w-12 mx-auto mb-2" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 flex-1" />
              ))}
            </div>
            
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}