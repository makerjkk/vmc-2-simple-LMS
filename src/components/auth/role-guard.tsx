'use client';

import { type ReactNode } from 'react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: ('learner' | 'instructor' | 'operator')[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAuth?: boolean;
}

/**
 * 역할 기반 접근 제어 컴포넌트
 * 지정된 역할을 가진 사용자만 자식 컴포넌트에 접근할 수 있도록 제한
 */
export const RoleGuard = ({
  allowedRoles,
  children,
  fallback,
  requireAuth = true,
}: RoleGuardProps) => {
  const { user, isAuthenticated, isLoading } = useCurrentUser();

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 인증되지 않은 사용자
  if (!isAuthenticated) {
    if (!requireAuth) {
      return <>{children}</>;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-center">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">로그인이 필요합니다</h3>
              <p className="text-sm text-muted-foreground mt-1">
                이 페이지에 접근하려면 로그인해주세요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 프로필이 없는 경우 (온보딩 미완료)
  if (!user?.profile) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-center">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">프로필 설정이 필요합니다</h3>
              <p className="text-sm text-muted-foreground mt-1">
                온보딩을 완료해주세요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 역할 확인
  const userRole = user.profile.role;
  const hasPermission = allowedRoles.includes(userRole);

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-center">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">접근 권한이 없습니다</h3>
              <p className="text-sm text-muted-foreground mt-1">
                이 페이지에 접근할 권한이 없습니다.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                현재 역할: {getRoleDisplayName(userRole)} | 
                필요 역할: {allowedRoles.map(getRoleDisplayName).join(', ')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 권한이 있는 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
};

/**
 * 역할 표시명 변환 함수
 */
const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case 'learner':
      return '학습자';
    case 'instructor':
      return '강사';
    case 'operator':
      return '운영자';
    default:
      return role;
  }
};
