'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Users, Settings, Plus, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * 빠른 작업 컴포넌트
 */
export function QuickActions() {
  const router = useRouter();

  const quickActionItems = [
    {
      title: "새 코스 만들기",
      description: "새로운 코스를 개설하고 커리큘럼을 구성하세요",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
      action: () => {
        router.push('/instructor/courses/new');
      },
    },
    {
      title: "과제 관리",
      description: "과제를 생성하고 제출물을 관리하세요",
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50 hover:bg-green-100",
      action: () => {
        // 강사의 코스 목록에서 과제 관리 탭으로 이동
        router.push('/instructor/dashboard?tab=published');
      },
    },
    {
      title: "채점하기",
      description: "제출된 과제를 채점하고 피드백을 제공하세요",
      icon: GraduationCap,
      color: "text-orange-600",
      bgColor: "bg-orange-50 hover:bg-orange-100",
      action: () => {
        // 채점 페이지로 이동
        router.push('/grades');
      },
    },
    {
      title: "수강생 관리",
      description: "수강생 현황을 확인하고 관리하세요",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 hover:bg-purple-100",
      action: () => {
        // 강사 대시보드의 수강생 관리 섹션으로 스크롤
        const element = document.getElementById('student-management');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          // 수강생 관리 기능이 구현되면 해당 페이지로 이동
          router.push('/instructor/dashboard');
        }
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          빠른 작업
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActionItems.map((item) => (
            <QuickActionItem key={item.title} item={item} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 개별 빠른 작업 아이템 컴포넌트
 */
function QuickActionItem({
  item,
}: {
  item: {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    action: () => void;
  };
}) {
  const IconComponent = item.icon;

  return (
    <Button
      variant="ghost"
      className={`h-auto p-4 flex flex-col items-start text-left ${item.bgColor} border transition-colors`}
      onClick={item.action}
    >
      <div className="flex items-center gap-3 mb-2 w-full">
        <div className={`p-2 rounded-lg bg-white shadow-sm`}>
          <IconComponent className={`h-5 w-5 ${item.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate">
            {item.title}
          </h3>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {item.description}
      </p>
    </Button>
  );
}

/**
 * 대체 빠른 작업 컴포넌트 (간단한 버튼 스타일)
 */
export function QuickActionsSimple() {
  const router = useRouter();

  const actions = [
    {
      label: "새 코스 만들기",
      icon: Plus,
      variant: "default" as const,
      action: () => router.push('/instructor/courses/new'),
    },
    {
      label: "과제 관리",
      icon: FileText,
      variant: "outline" as const,
      action: () => router.push('/instructor/dashboard?tab=published'),
    },
    {
      label: "채점하기",
      icon: GraduationCap,
      variant: "outline" as const,
      action: () => router.push('/grades'),
    },
    {
      label: "수강생 관리",
      icon: Users,
      variant: "outline" as const,
      action: () => router.push('/instructor/dashboard'),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>빠른 작업</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              className="h-16 flex flex-col gap-2"
              onClick={action.action}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
