'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, TrendingUp, Target, Award } from 'lucide-react';
import type { CourseGrade } from '../lib/dto';
import { AssignmentGradeItem } from './assignment-grade-item';
import {
  formatScore,
  calculateGrade,
  getGradeColor,
  sortBySubmissionStatus,
} from '@/lib/utils/grade';
import { getProgressColor } from '@/lib/utils/progress';

interface CourseGradeCardProps {
  courseGrade: CourseGrade;
  onAssignmentClick?: (assignmentId: string) => void;
  showAssignments?: boolean;
}

/**
 * 코스별 성적 카드 컴포넌트
 */
export const CourseGradeCard: React.FC<CourseGradeCardProps> = ({
  courseGrade,
  onAssignmentClick,
  showAssignments = true,
}) => {
  // 정렬된 과제 목록 (상태 우선순위 기준)
  const sortedAssignments = sortBySubmissionStatus(courseGrade.assignments);

  // 성적 등급 및 색상
  const gradeText = courseGrade.averageScore > 0 ? calculateGrade(courseGrade.averageScore) : null;
  const gradeColor = courseGrade.averageScore > 0 ? getGradeColor(courseGrade.averageScore) : '';

  // 진행률 색상
  const progressColor = getProgressColor(courseGrade.progress);

  // 통계 정보
  const stats = [
    {
      icon: BookOpen,
      label: '전체 과제',
      value: courseGrade.totalAssignments,
      color: 'text-blue-600',
    },
    {
      icon: Target,
      label: '완료 과제',
      value: courseGrade.completedAssignments,
      color: 'text-green-600',
    },
    {
      icon: TrendingUp,
      label: '진행률',
      value: `${courseGrade.progress}%`,
      color: 'text-purple-600',
    },
    {
      icon: Award,
      label: '평균 점수',
      value: formatScore(courseGrade.averageScore),
      color: gradeColor || 'text-gray-600',
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-bold text-gray-900 mb-2">
              {courseGrade.courseTitle}
            </CardTitle>
            {courseGrade.courseDescription && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {courseGrade.courseDescription}
              </p>
            )}
          </div>
          {gradeText && (
            <div className="ml-4 text-center">
              <div className={`text-2xl font-bold ${gradeColor}`}>
                {gradeText}
              </div>
              <div className="text-sm text-gray-600">
                {formatScore(courseGrade.averageScore)}점
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 진행률 바 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">학습 진행률</span>
            <span className="text-gray-600">
              {courseGrade.completedAssignments}/{courseGrade.totalAssignments} 완료
            </span>
          </div>
          <Progress 
            value={courseGrade.progress} 
            className="h-2"
          />
          <div className="text-right">
            <span className={`text-sm font-medium ${progressColor.replace('bg-', 'text-')}`}>
              {courseGrade.progress}%
            </span>
          </div>
        </div>

        {/* 통계 정보 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                <IconComponent className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <div className="text-lg font-semibold text-gray-900">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* 과제 목록 */}
        {showAssignments && sortedAssignments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                과제 목록
              </h3>
              <Badge variant="outline" className="text-xs">
                {sortedAssignments.length}개
              </Badge>
            </div>
            <div className="space-y-3">
              {sortedAssignments.map((assignment) => (
                <AssignmentGradeItem
                  key={assignment.assignmentId}
                  assignment={assignment}
                  onAssignmentClick={onAssignmentClick}
                  showFeedback={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* 과제가 없는 경우 */}
        {showAssignments && sortedAssignments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">아직 등록된 과제가 없습니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
