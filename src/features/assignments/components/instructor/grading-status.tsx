'use client';

import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Users, 
  TrendingUp,
  Filter
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

import { useGradingStats } from '../../hooks/instructor/useAssignmentSubmissionsGrading';
import { calculateGradingProgress, getGradeStatusColor } from '@/lib/utils/grade';

interface GradingStatusProps {
  /** 과제 ID */
  assignmentId: string;
  /** 필터 변경 콜백 */
  onFilterChange?: (filter: {
    status?: 'submitted' | 'graded' | 'resubmission_required';
    isLate?: boolean;
  }) => void;
  /** 컴팩트 모드 */
  compact?: boolean;
}

/**
 * 채점 상태 표시 컴포넌트
 * 채점 진행률과 상태별 통계를 표시하고 빠른 필터링 기능 제공
 */
export function GradingStatus({
  assignmentId,
  onFilterChange,
  compact = false,
}: GradingStatusProps) {
  // 채점 통계 조회
  const { data: stats, isLoading, error } = useGradingStats(assignmentId);

  // 로딩 상태
  if (isLoading) {
    return <GradingStatusSkeleton compact={compact} />;
  }

  // 에러 상태
  if (error || !stats) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">통계를 불러올 수 없습니다</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = calculateGradingProgress(stats.total, stats.graded);
  const pendingPercentage = stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0;
  const resubmissionPercentage = stats.total > 0 ? Math.round((stats.resubmissionRequired / stats.total) * 100) : 0;

  return (
    <div className={`space-y-4 ${compact ? 'max-w-2xl' : ''}`}>
      {/* 전체 진행률 카드 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5" />
            채점 진행 상황
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 진행률 바 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">전체 진행률</span>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* 통계 그리드 */}
          <div className={`grid gap-4 ${compact ? 'grid-cols-2' : 'grid-cols-4'}`}>
            <StatCard
              icon={<Users className="w-4 h-4" />}
              label="전체"
              value={stats.total}
              color="text-blue-600"
              onClick={() => onFilterChange?.({})}
            />
            <StatCard
              icon={<Clock className="w-4 h-4" />}
              label="미채점"
              value={stats.pending}
              color="text-orange-600"
              percentage={pendingPercentage}
              onClick={() => onFilterChange?.({ status: 'submitted' })}
            />
            <StatCard
              icon={<CheckCircle className="w-4 h-4" />}
              label="채점완료"
              value={stats.graded}
              color="text-green-600"
              percentage={100 - pendingPercentage - resubmissionPercentage}
              onClick={() => onFilterChange?.({ status: 'graded' })}
            />
            <StatCard
              icon={<AlertCircle className="w-4 h-4" />}
              label="재제출요청"
              value={stats.resubmissionRequired}
              color="text-purple-600"
              percentage={resubmissionPercentage}
              onClick={() => onFilterChange?.({ status: 'resubmission_required' })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 빠른 필터 버튼들 */}
      {!compact && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="w-4 h-4" />
              빠른 필터
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="전체 보기"
                count={stats.total}
                onClick={() => onFilterChange?.({})}
              />
              <FilterButton
                label="미채점만"
                count={stats.pending}
                variant="orange"
                onClick={() => onFilterChange?.({ status: 'submitted' })}
              />
              <FilterButton
                label="채점완료만"
                count={stats.graded}
                variant="green"
                onClick={() => onFilterChange?.({ status: 'graded' })}
              />
              <FilterButton
                label="재제출요청만"
                count={stats.resubmissionRequired}
                variant="purple"
                onClick={() => onFilterChange?.({ status: 'resubmission_required' })}
              />
              <FilterButton
                label="지각 제출만"
                count={0} // 지각 제출 수는 별도 API 호출 필요
                variant="red"
                onClick={() => onFilterChange?.({ isLate: true })}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * 통계 카드 컴포넌트
 */
function StatCard({
  icon,
  label,
  value,
  color,
  percentage,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  percentage?: number;
  onClick?: () => void;
}) {
  return (
    <div
      className={`p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`${color}`}>
          {icon}
        </div>
        {percentage !== undefined && (
          <span className="text-xs text-gray-500">{percentage}%</span>
        )}
      </div>
      <div className="space-y-1">
        <div className={`text-2xl font-bold ${color}`}>
          {value}
        </div>
        <div className="text-xs text-gray-600">
          {label}
        </div>
      </div>
    </div>
  );
}

/**
 * 필터 버튼 컴포넌트
 */
function FilterButton({
  label,
  count,
  variant = 'default',
  onClick,
}: {
  label: string;
  count: number;
  variant?: 'default' | 'orange' | 'green' | 'purple' | 'red';
  onClick?: () => void;
}) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'orange':
        return 'border-orange-200 text-orange-700 hover:bg-orange-50';
      case 'green':
        return 'border-green-200 text-green-700 hover:bg-green-50';
      case 'purple':
        return 'border-purple-200 text-purple-700 hover:bg-purple-50';
      case 'red':
        return 'border-red-200 text-red-700 hover:bg-red-50';
      default:
        return 'border-gray-200 text-gray-700 hover:bg-gray-50';
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`${getVariantClasses()} h-auto py-2 px-3`}
    >
      <span className="text-sm">{label}</span>
      <Badge variant="secondary" className="ml-2 text-xs">
        {count}
      </Badge>
    </Button>
  );
}

/**
 * 채점 상태 요약 컴포넌트 (간단한 버전)
 */
export function GradingStatusSummary({
  assignmentId,
  showProgress = true,
}: {
  assignmentId: string;
  showProgress?: boolean;
}) {
  const { data: stats, isLoading } = useGradingStats(assignmentId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        {showProgress && <Skeleton className="h-2 w-24" />}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const progress = calculateGradingProgress(stats.total, stats.graded);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Users className="w-4 h-4" />
        <span>총 {stats.total}개</span>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <Badge className={getGradeStatusColor('submitted')}>
          미채점 {stats.pending}
        </Badge>
        <Badge className={getGradeStatusColor('graded')}>
          완료 {stats.graded}
        </Badge>
        {stats.resubmissionRequired > 0 && (
          <Badge className={getGradeStatusColor('resubmission_required')}>
            재제출 {stats.resubmissionRequired}
          </Badge>
        )}
      </div>

      {showProgress && (
        <div className="flex items-center gap-2 min-w-24">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-xs text-gray-600 whitespace-nowrap">
            {progress}%
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 로딩 스켈레톤 컴포넌트
 */
function GradingStatusSkeleton({ compact }: { compact: boolean }) {
  return (
    <div className={`space-y-4 ${compact ? 'max-w-2xl' : ''}`}>
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
          
          <div className={`grid gap-4 ${compact ? 'grid-cols-2' : 'grid-cols-4'}`}>
            {Array.from({ length: compact ? 2 : 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!compact && (
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
