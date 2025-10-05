"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';
import { getDeadlineColor, getDeadlineStatus, formatKoreanDateTime } from '@/lib/utils/date';
import type { UpcomingAssignment } from '../lib/dto';

interface UpcomingAssignmentsProps {
  assignments: UpcomingAssignment[];
}

/**
 * 마감 임박 과제 목록을 표시하는 컴포넌트
 */
export function UpcomingAssignments({ assignments }: UpcomingAssignmentsProps) {
  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            마감 임박 과제
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-slate-400 mb-2">
              <Clock className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-slate-600">마감 임박한 과제가 없습니다.</p>
            <p className="text-sm text-slate-500 mt-1">
              모든 과제를 완료했거나 마감일이 충분히 남아있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          마감 임박 과제
          <Badge variant="secondary" className="ml-auto">
            {assignments.length}개
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const deadlineColor = getDeadlineColor(assignment.dueDate);
            const deadlineStatus = getDeadlineStatus(assignment.dueDate);
            const isUrgent = assignment.daysLeft <= 1;

            return (
              <div
                key={assignment.id}
                className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 line-clamp-1">
                      <Link
                        href={`/courses/${assignment.courseId}/assignments/${assignment.id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {assignment.title}
                      </Link>
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {assignment.courseTitle}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {isUrgent && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <Badge className={deadlineColor}>
                      {deadlineStatus}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    마감일: {formatKoreanDateTime(assignment.dueDate)}
                  </span>
                  
                  <Link
                    href={`/courses/${assignment.courseId}/assignments/${assignment.id}`}
                    className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
                  >
                    과제 보기
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {assignments.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Link
              href="/dashboard/assignments"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              모든 과제 보기
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
        )}
      </CardContent>
    </Card>
  );
}
