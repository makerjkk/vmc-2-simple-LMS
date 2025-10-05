'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Award,
  GraduationCap,
  BarChart3 
} from 'lucide-react';
import type { GradeSummary } from '../lib/dto';
import {
  formatScore,
  calculateGrade,
  getGradeColor,
} from '@/lib/utils/grade';
import { getProgressColor } from '@/lib/utils/progress';

interface GradesSummaryProps {
  summary: GradeSummary;
}

/**
 * 성적 요약 정보 표시 컴포넌트
 */
export const GradesSummary: React.FC<GradesSummaryProps> = ({ summary }) => {
  // 전체 평균 등급 및 색상
  const overallGrade = summary.averageScore > 0 ? calculateGrade(summary.averageScore) : null;
  const gradeColor = summary.averageScore > 0 ? getGradeColor(summary.averageScore) : '';

  // 진행률 색상
  const progressColor = getProgressColor(summary.overallProgress);

  // 주요 통계 정보
  const mainStats = [
    {
      icon: GraduationCap,
      label: '수강 코스',
      value: summary.totalCourses,
      unit: '개',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: BookOpen,
      label: '전체 과제',
      value: summary.totalAssignments,
      unit: '개',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: Target,
      label: '완료 과제',
      value: summary.completedAssignments,
      unit: '개',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Award,
      label: '평균 점수',
      value: formatScore(summary.averageScore),
      unit: '점',
      color: gradeColor || 'text-gray-600',
      bgColor: 'bg-orange-50',
    },
  ];

  // 성과 지표
  const performanceMetrics = [
    {
      label: '학습 진행률',
      value: summary.overallProgress,
      max: 100,
      unit: '%',
      color: progressColor,
      description: '전체 과제 대비 완료율',
    },
    {
      label: '완료율',
      value: summary.totalAssignments > 0 
        ? Math.round((summary.completedAssignments / summary.totalAssignments) * 100 * 10) / 10
        : 0,
      max: 100,
      unit: '%',
      color: 'bg-green-500',
      description: '제출한 과제의 완료율',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 전체 성적 개요 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            전체 성적 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                학습 현황
              </h3>
              <p className="text-gray-600">
                {summary.totalCourses}개 코스, {summary.totalAssignments}개 과제 중 {summary.completedAssignments}개 완료
              </p>
            </div>
            {overallGrade && (
              <div className="text-center">
                <div className={`text-4xl font-bold ${gradeColor} mb-1`}>
                  {overallGrade}
                </div>
                <div className="text-sm text-gray-600">
                  평균 {formatScore(summary.averageScore)}점
                </div>
              </div>
            )}
          </div>

          {/* 주요 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {mainStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className={`p-4 rounded-lg ${stat.bgColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <IconComponent className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="space-y-1">
                    <div className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                      <span className="text-sm font-normal ml-1">{stat.unit}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 성과 지표 */}
          <div className="space-y-4">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-700">{metric.label}</span>
                    <span className="text-gray-500 ml-2">({metric.description})</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {metric.value}{metric.unit}
                  </span>
                </div>
                <Progress 
                  value={metric.value} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 학습 성과 분석 */}
      {summary.totalAssignments > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              학습 성과 분석
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 진행 상황 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">진행 상황</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>완료된 과제</span>
                    <span className="font-medium">{summary.completedAssignments}개</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>진행 중인 과제</span>
                    <span className="font-medium">
                      {summary.totalAssignments - summary.completedAssignments}개
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>전체 진행률</span>
                    <span className="font-medium text-blue-600">
                      {summary.overallProgress}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 성적 현황 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">성적 현황</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>전체 평균</span>
                    <span className={`font-medium ${gradeColor}`}>
                      {formatScore(summary.averageScore)}점
                    </span>
                  </div>
                  {overallGrade && (
                    <div className="flex justify-between text-sm">
                      <span>평균 등급</span>
                      <span className={`font-medium ${gradeColor}`}>
                        {overallGrade}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>총 획득 점수</span>
                    <span className="font-medium">
                      {formatScore(summary.totalScore)}점
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
