"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Edit, 
  Users, 
  Star, 
  Calendar,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CourseStatusManager } from './course-status-manager';
import { type InstructorCourseResponse } from '../lib/dto';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface InstructorCourseCardProps {
  course: InstructorCourseResponse;
}

/**
 * 강사용 코스 카드 컴포넌트
 * 코스 정보, 상태, 통계를 표시하고 관리 액션을 제공
 */
export function InstructorCourseCard({ course }: InstructorCourseCardProps) {
  // 난이도 라벨
  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '초급';
      case 'intermediate':
        return '중급';
      case 'advanced':
        return '고급';
      default:
        return difficulty;
    }
  };

  // 난이도별 색상
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
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

  // 상대적 시간 표시
  const getRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: ko,
      });
    } catch {
      return '알 수 없음';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight mb-2 line-clamp-2">
              {course.title}
            </h3>
            
            <div className="flex items-center gap-2 mb-2">
              {course.category && (
                <Badge variant="outline" className="text-xs">
                  {course.category.name}
                </Badge>
              )}
              <Badge 
                variant="secondary" 
                className={`text-xs ${getDifficultyColor(course.difficulty)}`}
              >
                {getDifficultyLabel(course.difficulty)}
              </Badge>
            </div>

            {course.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {course.description}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/instructor/courses/${course.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  편집
                </Link>
              </DropdownMenuItem>
              {course.status === 'published' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/courses/${course.id}`}>
                      <Users className="h-4 w-4 mr-2" />
                      공개 페이지 보기
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 통계 정보 */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <Users className="h-3 w-3" />
              <span>수강생</span>
            </div>
            <div className="font-semibold">{course.enrollmentCount}</div>
          </div>
          
          <div>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <Star className="h-3 w-3" />
              <span>평점</span>
            </div>
            <div className="font-semibold">
              {course.averageRating > 0 ? course.averageRating.toFixed(1) : '-'}
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
              <Calendar className="h-3 w-3" />
              <span>수정일</span>
            </div>
            <div className="font-semibold text-xs">
              {getRelativeTime(course.updatedAt)}
            </div>
          </div>
        </div>

        {/* 상태 관리 */}
        <CourseStatusManager course={course} />

        {/* 액션 버튼 */}
        <div className="flex gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href={`/instructor/courses/${course.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              편집
            </Link>
          </Button>
          
          {course.status === 'published' && (
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/courses/${course.id}`}>
                <Users className="h-4 w-4 mr-2" />
                공개 페이지
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
