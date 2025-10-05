import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { ReportDetailResponse } from '../lib/dto';

/**
 * 신고 상세 조회 훅
 */
export const useReportQuery = (reportId: string) => {
  return useQuery({
    queryKey: ['reports', reportId],
    queryFn: async (): Promise<ReportDetailResponse> => {
      try {
        const response = await apiClient.get(`/api/reports/${reportId}`);
        return response.data;
      } catch (error) {
        throw new Error('신고 상세 조회에 실패했습니다.');
      }
    },
    enabled: !!reportId,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
  });
};
