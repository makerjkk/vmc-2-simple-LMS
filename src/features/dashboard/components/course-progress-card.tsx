"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getProgressColor, getProgressTextColor, getProgressStatus } from '@/lib/utils/progress';
import type { CourseProgress } from '../lib/dto';

interface CourseProgressCardProps {
  course: CourseProgress;
}

/**
 * 코스별 진행률을 표시하는 카드 컴포넌트
 */
export function CourseProgressCard({ course }: CourseProgressCardProps) {
  const progressColor = getProgressColor(course.progress);
  const progressTextColor = getProgressTextColor(course.progress);
  const progressStatus = getProgressStatus(course.progress);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            <Link 
              href={`/courses/${course.id}`}
              className="hover:text-blue-600 transition-colors"
            >
              {course.title}
            </Link>
          </CardTitle>
          <Badge variant="secondary" className={progressTextColor}>
            {progressStatus}
          </Badge>
        </div>
        {course.description && (
          <p className="text-sm text-slate-600 line-clamp-2 mt-2">
            {course.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* 진행률 바 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">진행률</span>
              <span className={`font-medium ${progressTextColor}`}>
                {course.progress}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>

          {/* 과제 완료 정보 */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-600">완료한 과제</span>
            <span className="font-medium">
              {course.completedAssignments} / {course.totalAssignments}
            </span>
          </div>

          {/* 코스 상세 링크 */}
          <div className="pt-2">
            <Link
              href={`/courses/${course.id}`}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              코스 상세 보기
              <svg
                className="ml-1 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
