import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { ReportsQueryParams, ReportsListResponse } from '../lib/dto';

/**
 * 신고 목록 조회 훅
 */
export const useReportsQuery = (params: ReportsQueryParams) => {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: async (): Promise<ReportsListResponse> => {
      const searchParams = new URLSearchParams();
      
      // 쿼리 파라미터 구성
      searchParams.append('page', params.page.toString());
      searchParams.append('limit', params.limit.toString());
      searchParams.append('sortBy', params.sortBy);
      searchParams.append('sortOrder', params.sortOrder);
      
      if (params.status) {
        searchParams.append('status', params.status);
      }
      if (params.reportedType) {
        searchParams.append('reportedType', params.reportedType);
      }

      try {
        const response = await apiClient.get(`/api/reports?${searchParams.toString()}`);
        return response.data;
      } catch (error) {
        throw new Error('신고 목록 조회에 실패했습니다.');
      }
    },
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
  });
};
