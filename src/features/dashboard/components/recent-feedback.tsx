"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Star } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/date';
import type { RecentFeedback } from '../lib/dto';

interface RecentFeedbackProps {
  feedback: RecentFeedback[];
}

/**
 * 최근 피드백 요약을 표시하는 컴포넌트
 */
export function RecentFeedback({ feedback }: RecentFeedbackProps) {
  if (feedback.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            최근 피드백
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-slate-400 mb-2">
              <MessageSquare className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-slate-600">최근 받은 피드백이 없습니다.</p>
            <p className="text-sm text-slate-500 mt-1">
              과제를 제출하고 강사의 피드백을 받아보세요.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * 점수에 따른 색상 클래스를 반환합니다
   */
  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  /**
   * 피드백 텍스트를 지정된 길이로 자릅니다
   */
  const truncateFeedback = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          최근 피드백
          <Badge variant="secondary" className="ml-auto">
            {feedback.length}개
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feedback.map((item) => {
            const scoreColor = getScoreColor(item.score);
            const truncatedFeedback = truncateFeedback(item.feedback);

            return (
              <div
                key={item.id}
                className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 line-clamp-1">
                      <Link
                        href={`/assignments/${item.assignmentId}/feedback`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {item.assignmentTitle}
                      </Link>
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {item.courseTitle}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <Badge className={scoreColor}>
                      {item.score}점
                    </Badge>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {truncatedFeedback}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    {formatRelativeTime(item.feedbackDate)}
                  </span>
                  
                  <Link
                    href={`/assignments/${item.assignmentId}/feedback`}
                    className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
                  >
                    전체 피드백 보기
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {feedback.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Link
              href="/dashboard/feedback"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              모든 피드백 보기
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
