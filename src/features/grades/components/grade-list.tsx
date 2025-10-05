'use client';

import React from 'react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, AlertCircle, BookOpen, GraduationCap } from 'lucide-react';
import type { GradesResponse } from '../lib/dto';
import { CourseGradeCard } from './course-grade-card';
import { GradesSummary } from './grades-summary';

interface GradeListProps {
  grades?: GradesResponse;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onAssignmentClick?: (assignmentId: string) => void;
}

/**
 * 전체 성적 목록 표시 컴포넌트
 */
export const GradeList: React.FC<GradeListProps> = ({
  grades,
  isLoading = false,
  error = null,
  onRetry,
  onAssignmentClick,
}) => {
  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* 요약 정보 스켈레톤 */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-32" />
        </div>

        {/* 코스 목록 스켈레톤 */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>성적 정보를 불러오는 중 오류가 발생했습니다.</span>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="ml-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // 데이터가 없는 경우
  if (!grades) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          성적 정보를 불러올 수 없습니다
        </h3>
        <p className="text-gray-600 mb-4">
          잠시 후 다시 시도해 주세요.
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        )}
      </div>
    );
  }

  // 수강 중인 코스가 없는 경우
  if (grades.courses.length === 0) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          수강 중인 코스가 없습니다
        </h3>
        <p className="text-gray-600 mb-4">
          코스를 수강신청하고 과제를 완료하여 성적을 확인해보세요.
        </p>
        <Button asChild>
          <Link href="/courses">
            코스 탐색하기
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 전체 성적 요약 */}
      <GradesSummary summary={grades.summary} />

      {/* 코스별 성적 목록 */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            코스별 성적
          </h2>
          <div className="text-sm text-gray-600">
            총 {grades.courses.length}개 코스
          </div>
        </div>

        <div className="space-y-6">
          {grades.courses.map((courseGrade) => (
            <CourseGradeCard
              key={courseGrade.courseId}
              courseGrade={courseGrade}
              onAssignmentClick={onAssignmentClick}
              showAssignments={true}
            />
          ))}
        </div>
      </div>

      {/* 추가 정보 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">성적 안내</p>
            <ul className="space-y-1 text-blue-700">
              <li>• 성적은 과제 점수와 비중을 기준으로 계산됩니다.</li>
              <li>• 재제출 요청된 과제는 기존 점수가 유지되며, 재제출 후 새로운 점수로 업데이트됩니다.</li>
              <li>• 지각 제출된 과제는 별도로 표시되며, 강사의 정책에 따라 감점될 수 있습니다.</li>
              <li>• 성적 정보는 실시간으로 업데이트되며, 강사가 채점을 완료하면 즉시 반영됩니다.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
