'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ReportStatusBadgeProps {
  status: 'received' | 'investigating' | 'resolved';
  className?: string;
}

/**
 * 신고 상태 배지 컴포넌트
 */
export const ReportStatusBadge = ({ status, className }: ReportStatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'received':
        return {
          label: '접수됨',
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
        };
      case 'investigating':
        return {
          label: '조사중',
          variant: 'default' as const,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
        };
      case 'resolved':
        return {
          label: '해결됨',
          variant: 'secondary' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-200',
        };
      default:
        return {
          label: '알 수 없음',
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
};
