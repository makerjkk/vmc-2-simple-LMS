'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Users, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import type { CourseResponse } from '../lib/dto';

interface CourseCardProps {
  course: CourseResponse;
  showEnrollButton?: boolean;
  onEnrollClick?: (courseId: string) => void;
  isEnrolling?: boolean;
}

/**
 * 코스 카드 컴포넌트
 * 코스 목록에서 개별 코스 정보를 표시하는 카드
 */
export const CourseCard = ({
  course,
  showEnrollButton = false,
  onEnrollClick,
  isEnrolling = false,
}: CourseCardProps) => {
  const {
    id,
    title,
    description,
    difficulty,
    enrollmentCount,
    averageRating,
    createdAt,
    instructor,
    category,
  } = course;

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
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // 플레이스홀더 이미지 URL 생성
  const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(id)}/400/200`;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="relative aspect-[2/1] overflow-hidden rounded-t-lg">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-3 left-3">
            <Badge className={getDifficultyColor(difficulty)}>
              {getDifficultyLabel(difficulty)}
            </Badge>
          </div>
          {category && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-white/90 text-gray-700">
                {category.name}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-3">
          {/* 제목 */}
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* 설명 */}
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}

          {/* 강사 정보 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{instructor.fullName}</span>
          </div>

          {/* 통계 정보 */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              {/* 수강생 수 */}
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{enrollmentCount.toLocaleString()}명</span>
              </div>

              {/* 평점 */}
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{averageRating.toFixed(1)}</span>
              </div>
            </div>

            {/* 생성일 */}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(createdAt), 'yyyy.MM.dd', { locale: ko })}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        {/* 상세보기 버튼 */}
        <Button asChild variant="outline" className="flex-1">
          <Link href={`/courses/${id}`}>
            상세보기
          </Link>
        </Button>

        {/* 수강신청 버튼 */}
        {showEnrollButton && onEnrollClick && (
          <Button
            onClick={() => onEnrollClick(id)}
            disabled={isEnrolling}
            className="flex-1"
          >
            {isEnrolling ? '처리중...' : '수강신청'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
