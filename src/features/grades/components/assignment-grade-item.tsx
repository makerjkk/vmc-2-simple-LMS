'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Calendar, Weight } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { AssignmentGrade } from '../lib/dto';
import {
  formatScore,
  formatWeight,
  getSubmissionStatusText,
  getSubmissionStatusColor,
  getGradeColor,
  calculateGrade,
} from '@/lib/utils/grade';

interface AssignmentGradeItemProps {
  assignment: AssignmentGrade;
  showFeedback?: boolean;
  onAssignmentClick?: (assignmentId: string) => void;
}

/**
 * 개별 과제 성적 항목 컴포넌트
 */
export const AssignmentGradeItem: React.FC<AssignmentGradeItemProps> = ({
  assignment,
  showFeedback = true,
  onAssignmentClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 마감일 포맷팅
  const formattedDueDate = format(new Date(assignment.dueDate), 'yyyy.MM.dd HH:mm', {
    locale: ko,
  });

  // 제출일 포맷팅
  const formattedSubmittedAt = assignment.submittedAt
    ? format(new Date(assignment.submittedAt), 'yyyy.MM.dd HH:mm', { locale: ko })
    : null;

  // 상태 텍스트 및 색상
  const statusText = getSubmissionStatusText(assignment.status, assignment.isLate);
  const statusColor = getSubmissionStatusColor(assignment.status, assignment.isLate);

  // 점수 관련
  const scoreText = formatScore(assignment.score);
  const gradeText = assignment.score !== null ? calculateGrade(assignment.score) : null;
  const gradeColor = assignment.score !== null ? getGradeColor(assignment.score) : '';

  // 피드백 존재 여부
  const hasFeedback = assignment.feedback && assignment.feedback.trim().length > 0;

  const handleCardClick = () => {
    if (onAssignmentClick) {
      onAssignmentClick(assignment.assignmentId);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${
        onAssignmentClick ? 'cursor-pointer' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
              {assignment.assignmentTitle}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>마감: {formattedDueDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Weight className="w-4 h-4" />
                <span>비중: {formatWeight(assignment.scoreWeight)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Badge className={statusColor}>
              {statusText}
            </Badge>
            {assignment.score !== null && (
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {scoreText}점
                </div>
                {gradeText && (
                  <div className={`text-sm font-medium ${gradeColor}`}>
                    {gradeText}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {(hasFeedback || formattedSubmittedAt) && showFeedback && (
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {formattedSubmittedAt && (
                <p className="text-sm text-gray-600">
                  제출일: {formattedSubmittedAt}
                  {assignment.isLate && (
                    <span className="ml-2 text-orange-600 font-medium">(지각)</span>
                  )}
                </p>
              )}
              {assignment.canResubmit && assignment.status === 'resubmission_required' && (
                <p className="text-sm text-purple-600 font-medium mt-1">
                  재제출이 가능합니다
                </p>
              )}
            </div>
            {hasFeedback && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExpandClick}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
              >
                피드백 {isExpanded ? '접기' : '보기'}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>

          {hasFeedback && isExpanded && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                강사 피드백
              </h4>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">
                {assignment.feedback}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
