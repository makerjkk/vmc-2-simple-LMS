'use client';

import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle,
  FileText 
} from 'lucide-react';
import { 
  getSubmissionStatusLabel, 
  getSubmissionStatusColor,
  type SubmissionStatus as SubmissionStatusType 
} from '@/lib/utils/assignment';
import { formatKoreanDateTime } from '@/lib/utils/date';

interface SubmissionStatusProps {
  status: 'not-submitted' | SubmissionStatusType;
  isLate?: boolean;
  score?: number | null;
  dueDate?: string;
  submittedAt?: string;
  className?: string;
}

/**
 * 제출 상태 표시 컴포넌트
 * 제출 상태에 따른 아이콘, 색상, 텍스트를 표시
 */
export const SubmissionStatus = ({ 
  status, 
  isLate = false, 
  score, 
  dueDate, 
  submittedAt,
  className = '' 
}: SubmissionStatusProps) => {
  // 아이콘 선택
  const getIcon = () => {
    switch (status) {
      case 'not-submitted':
        return <XCircle className="h-4 w-4" />;
      case 'submitted':
        return isLate ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
      case 'graded':
        return <CheckCircle className="h-4 w-4" />;
      case 'resubmission_required':
        return <FileText className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  // 표시 텍스트 생성
  const getDisplayText = () => {
    switch (status) {
      case 'not-submitted':
        return '미제출';
      case 'submitted':
        return isLate ? '지각 제출' : '제출 완료';
      case 'graded':
        return score !== null ? `채점 완료 (${score}점)` : '채점 완료';
      case 'resubmission_required':
        return '재제출 요청';
      default:
        return '알 수 없음';
    }
  };

  // 색상 클래스 선택
  const getColorClass = () => {
    switch (status) {
      case 'not-submitted':
        return 'bg-gray-100 text-gray-800';
      case 'submitted':
        return isLate ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'resubmission_required':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <Badge className={`${getColorClass()} flex items-center gap-1 w-fit`}>
        {getIcon()}
        {getDisplayText()}
      </Badge>
      
      {/* 제출 시간 정보 */}
      {submittedAt && (
        <p className="text-xs text-muted-foreground">
          제출일: {formatKoreanDateTime(submittedAt)}
        </p>
      )}
      
      {/* 마감일 정보 (미제출인 경우) */}
      {status === 'not-submitted' && dueDate && (
        <p className="text-xs text-muted-foreground">
          마감일: {formatKoreanDateTime(dueDate)}
        </p>
      )}
    </div>
  );
};
