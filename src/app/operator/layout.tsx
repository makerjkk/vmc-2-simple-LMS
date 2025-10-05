'use client';

import { ReactNode } from 'react';
import { RoleGuard } from '@/components/auth/role-guard';

interface OperatorLayoutProps {
  children: ReactNode;
}

/**
 * 운영자 페이지 레이아웃
 * 운영자 권한이 있는 사용자만 접근 가능
 */
export default function OperatorLayout({ children }: OperatorLayoutProps) {
  return (
    <RoleGuard allowedRoles={['operator']}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </div>
    </RoleGuard>
  );
}
