'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, ArrowLeft, Database, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoriesManager } from '@/features/metadata/components/categories-manager';
import { useDifficultyMetadataQuery } from '@/features/metadata/hooks/useMetadataQuery';

/**
 * 운영자 메타데이터 관리 페이지
 */
export default function OperatorMetadataPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('categories');
  
  const { data: difficultyData } = useDifficultyMetadataQuery();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/operator/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            대시보드로 돌아가기
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">메타데이터 관리</h1>
              <p className="text-muted-foreground">
                시스템에서 사용되는 카테고리와 난이도를 관리할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            카테고리 관리
          </TabsTrigger>
          <TabsTrigger value="difficulties" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            난이도 현황
          </TabsTrigger>
        </TabsList>

        {/* 카테고리 관리 탭 */}
        <TabsContent value="categories" className="space-y-6">
          <CategoriesManager />
        </TabsContent>

        {/* 난이도 현황 탭 */}
        <TabsContent value="difficulties" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                난이도별 코스 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              {difficultyData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {difficultyData.difficulties.map((difficulty) => (
                    <div
                      key={difficulty.value}
                      className="p-4 border rounded-lg text-center"
                    >
                      <div className="text-2xl font-bold mb-2">
                        {difficulty.courseCount}
                      </div>
                      <div className="font-medium mb-1">
                        {difficulty.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {difficulty.description}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  난이도 데이터를 불러오는 중...
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>난이도 관리 안내</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  현재 시스템에서는 세 가지 난이도 레벨을 지원합니다:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>초급 (Beginner):</strong> 프로그래밍 경험이 없거나 기초를 배우고 싶은 분들을 위한 과정</li>
                  <li><strong>중급 (Intermediate):</strong> 기본적인 프로그래밍 지식이 있고 실력을 향상시키고 싶은 분들을 위한 과정</li>
                  <li><strong>고급 (Advanced):</strong> 전문적인 지식과 고급 기술을 익히고 싶은 분들을 위한 과정</li>
                </ul>
                <p>
                  난이도는 시스템에서 고정된 값으로 관리되며, 별도의 수정이나 추가는 개발자를 통해서만 가능합니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
