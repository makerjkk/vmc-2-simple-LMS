"use client";

import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * 대시보드 로딩 상태를 표시하는 컴포넌트
 */
export function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* 통계 카드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-20" />
                  <div className="h-8 bg-slate-200 rounded animate-pulse w-16" />
                </div>
                <div className="h-12 w-12 bg-slate-200 rounded-full animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 코스 진행률 스켈레톤 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="h-6 bg-slate-200 rounded animate-pulse w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="h-5 bg-slate-200 rounded animate-pulse w-3/4" />
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
                      </div>
                      <div className="h-6 bg-slate-200 rounded animate-pulse w-16" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-12" />
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-12" />
                      </div>
                      <div className="h-2 bg-slate-200 rounded animate-pulse w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 마감 임박 과제 스켈레톤 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="h-6 bg-slate-200 rounded animate-pulse w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="space-y-2 flex-1">
                        <div className="h-5 bg-slate-200 rounded animate-pulse w-3/4" />
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
                      </div>
                      <div className="h-6 bg-slate-200 rounded animate-pulse w-16" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-1/3" />
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 최근 피드백 스켈레톤 */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-slate-200 rounded animate-pulse w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-slate-200 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-1/2" />
                  </div>
                  <div className="h-6 bg-slate-200 rounded animate-pulse w-16" />
                </div>
                <div className="space-y-2 mb-3">
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-full" />
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-20" />
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
