'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  User, 
  Users, 
  Star, 
  Calendar, 
  BookOpen, 
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import { useCourseQuery } from '../hooks/useCourseQuery';
import { EnrollButton } from '@/features/enrollments/components/enroll-button';

interface CourseDetailProps {
  courseId: string;
}

/**
 * 코스 상세 컴포넌트
 * 코스의 상세 정보와 수강신청 기능을 제공
 */
export const CourseDetail = ({ courseId }: CourseDetailProps) => {
  const {
    data: course,
    isLoading,
    isError,
    error,
    refetch,
  } = useCourseQuery(courseId);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 뒤로가기 버튼 */}
        <Button variant="ghost" asChild>
          <Link href="/courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            코스 목록으로
          </Link>
        </Button>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">코스 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (isError || !course) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 뒤로가기 버튼 */}
        <Button variant="ghost" asChild>
          <Link href="/courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            코스 목록으로
          </Link>
        </Button>

        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="font-semibold text-lg">코스를 찾을 수 없습니다</h3>
                <p className="text-muted-foreground mt-2">
                  {error instanceof Error ? error.message : '요청하신 코스가 존재하지 않거나 접근할 수 없습니다.'}
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => refetch()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  다시 시도
                </Button>
                <Button asChild>
                  <Link href="/courses">코스 목록으로</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 난이도 표시명 변환
  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner':
        return '초급';
      case 'intermediate':
        return '중급';
      case 'advanced':
        return '고급';
      default:
        return level;
    }
  };

  // 난이도별 색상 변환
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 플레이스홀더 이미지 URL 생성
  const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(course.id)}/800/400`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 뒤로가기 버튼 */}
      <Button variant="ghost" asChild>
        <Link href="/courses">
          <ArrowLeft className="h-4 w-4 mr-2" />
          코스 목록으로
        </Link>
      </Button>

      {/* 코스 헤더 */}
      <Card>
        <CardContent className="p-0">
          {/* 코스 이미지 */}
          <div className="relative aspect-[2/1] overflow-hidden rounded-t-lg">
            <Image
              src={imageUrl}
              alt={course.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getDifficultyColor(course.difficulty)}>
                  {getDifficultyLabel(course.difficulty)}
                </Badge>
                {course.category && (
                  <Badge variant="secondary" className="bg-white/90 text-gray-700">
                    {course.category.name}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
            </div>
          </div>

          {/* 코스 정보 */}
          <div className="p-6 space-y-6">
            {/* 통계 정보 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">강사</p>
                  <p className="font-medium">{course.instructor.fullName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">수강생</p>
                  <p className="font-medium">{course.enrollmentCount.toLocaleString()}명</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">평점</p>
                  <p className="font-medium">{course.averageRating.toFixed(1)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">개설일</p>
                  <p className="font-medium">
                    {format(new Date(course.createdAt), 'yyyy.MM.dd', { locale: ko })}
                  </p>
                </div>
              </div>
            </div>

            {/* 수강신청 버튼 */}
            <div className="flex justify-center">
              <EnrollButton
                courseId={course.id}
                courseTitle={course.title}
                isEnrolled={course.isEnrolled || false}
                size="lg"
                className="min-w-[200px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 코스 설명 */}
      {course.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              코스 소개
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{course.description}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 커리큘럼 */}
      {course.curriculum && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              커리큘럼
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap">{course.curriculum}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 강사 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            강사 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{course.instructor.fullName}</h3>
              <p className="text-muted-foreground">강사</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
