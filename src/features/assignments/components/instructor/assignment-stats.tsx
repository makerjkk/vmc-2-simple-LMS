'use client';

import { 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  Target,
  Calendar
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { 
  calculateAssignmentProgress,
  calculateAssignmentPriority,
  formatDueDate,
  isDueSoon,
  isAssignmentOverdue,
  getAssignmentStatusLabel
} from '@/lib/utils/assignment';
import { useAssignmentSubmissionStats } from '../../hooks/instructor/useAssignmentSubmissions';
import type { InstructorAssignmentResponse } from '../../lib/dto';

interface AssignmentStatsProps {
  /** 과제 정보 */
  assignment: InstructorAssignmentResponse;
  /** 총 수강생 수 */
  totalEnrollments?: number;
  /** 간단한 표시 모드 */
  compact?: boolean;
}

/**
 * 강사용 과제 통계 컴포넌트
 * 과제의 제출률, 채점률, 우선순위 등을 표시합니다.
 */
export function AssignmentStats({
  assignment,
  totalEnrollments = 0,
  compact = false,
}: AssignmentStatsProps) {
  const { 
    data: stats, 
    isLoading 
  } = useAssignmentSubmissionStats(assignment.id);

  // 진행률 계산
  const progress = calculateAssignmentProgress(assignment as any, totalEnrollments);
  const priority = calculateAssignmentPriority(assignment as any, totalEnrollments);
  
  // 상태 정보
  const isOverdue = isAssignmentOverdue(assignment.dueDate);
  const dueSoon = isDueSoon(assignment.dueDate);

  // 로딩 상태
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: compact ? 2 : 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // 간단한 표시 모드
  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* 기본 정보 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{assignment.title}</h4>
                <Badge variant="outline">
                  {getAssignmentStatusLabel(assignment.status)}
                </Badge>
              </div>
              
              {priority.priority === 'high' && (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  긴급
                </Badge>
              )}
            </div>

            {/* 진행률 */}
            {assignment.status === 'published' && totalEnrollments > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>제출률</span>
                  <span>{progress.submissionRate}%</span>
                </div>
                <Progress value={progress.submissionRate} className="h-1" />
              </div>
            )}

            {/* 마감일 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span className={isOverdue ? 'text-destructive' : dueSoon ? 'text-orange-600' : ''}>
                {formatDueDate(assignment.dueDate)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 상세 표시 모드
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 제출 현황 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">제출 현황</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{assignment.submissionCount}</div>
          <p className="text-xs text-muted-foreground">
            {totalEnrollments > 0 ? `${totalEnrollments}명 중` : '총 제출'}
          </p>
          {totalEnrollments > 0 && (
            <div className="mt-2">
              <Progress value={progress.submissionRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                제출률 {progress.submissionRate}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 채점 현황 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">채점 현황</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{assignment.gradedCount}</div>
          <p className="text-xs text-muted-foreground">
            {assignment.submissionCount}개 중 채점 완료
          </p>
          {assignment.submissionCount > 0 && (
            <div className="mt-2">
              <Progress value={progress.gradingRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                채점률 {progress.gradingRate}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 평균 점수 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">평균 점수</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.averageScore ? Math.round(stats.averageScore) : '-'}
            {stats?.averageScore && <span className="text-sm font-normal">점</span>}
          </div>
          <p className="text-xs text-muted-foreground">
            {assignment.gradedCount > 0 ? `${assignment.gradedCount}개 기준` : '채점 대기 중'}
          </p>
          {stats?.averageScore && (
            <div className="mt-2">
              <Progress value={stats.averageScore} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 우선순위 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">우선순위</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge 
              variant={
                priority.priority === 'high' ? 'destructive' : 
                priority.priority === 'medium' ? 'default' : 
                'secondary'
              }
            >
              {priority.priority === 'high' ? '높음' : 
               priority.priority === 'medium' ? '보통' : 
               '낮음'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              ({priority.score}점)
            </span>
          </div>
          
          {priority.reasons.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">
                {priority.reasons.slice(0, 2).join(' • ')}
                {priority.reasons.length > 2 && ' 외'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 마감일 정보 (전체 너비) */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">마감일 정보</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-lg font-medium ${
                isOverdue ? 'text-destructive' : 
                dueSoon ? 'text-orange-600' : 
                'text-foreground'
              }`}>
                {formatDueDate(assignment.dueDate)}
              </div>
              <p className="text-sm text-muted-foreground">
                {isOverdue ? '마감일이 지났습니다' : 
                 dueSoon ? '마감일이 임박했습니다' : 
                 '마감일까지 여유가 있습니다'}
              </p>
            </div>
            
            <div className="flex gap-2">
              {isOverdue && (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  마감
                </Badge>
              )}
              {dueSoon && !isOverdue && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <Clock className="w-3 h-3 mr-1" />
                  임박
                </Badge>
              )}
              {assignment.allowLateSubmission && (
                <Badge variant="outline">
                  지각 제출 허용
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 지각 제출 현황 */}
      {stats && stats.lateSubmissions > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">지각 제출 현황</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-medium text-orange-600">
                  {stats.lateSubmissions}개
                </div>
                <p className="text-sm text-muted-foreground">
                  전체 제출물 중 {Math.round((stats.lateSubmissions / stats.totalSubmissions) * 100)}%
                </p>
              </div>
              
              <div className="w-32">
                <Progress 
                  value={(stats.lateSubmissions / stats.totalSubmissions) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
