"use client";

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Search } from 'lucide-react';

/**
 * 수강 중인 코스가 없을 때 표시하는 컴포넌트
 */
export function DashboardEmpty() {
  return (
    <Card>
      <CardContent className="p-12">
        <div className="text-center">
          <div className="text-slate-400 mb-6">
            <BookOpen className="h-20 w-20 mx-auto" />
          </div>
          
          <h3 className="text-xl font-semibold text-slate-900 mb-3">
            아직 수강 중인 코스가 없습니다
          </h3>
          
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            다양한 코스를 탐색하고 수강신청하여 학습을 시작해보세요.
            새로운 지식과 기술을 배울 수 있는 기회가 기다리고 있습니다.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/courses" className="inline-flex items-center gap-2">
                <Search className="h-4 w-4" />
                코스 탐색하기
              </Link>
            </Button>
            
            <Button variant="outline" asChild size="lg">
              <Link href="/courses?category=programming">
                인기 코스 보기
              </Link>
            </Button>
          </div>
          
          <div className="mt-8 pt-8 border-t">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-600">
              <div className="text-center">
                <div className="font-medium mb-1">다양한 분야</div>
                <div>프로그래밍, 디자인, 비즈니스 등</div>
              </div>
              <div className="text-center">
                <div className="font-medium mb-1">실습 중심</div>
                <div>과제와 프로젝트로 실력 향상</div>
              </div>
              <div className="text-center">
                <div className="font-medium mb-1">전문 강사</div>
                <div>경험 많은 강사진의 피드백</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
