'use client';

import { ReactNode } from 'react';
import { AppHeader } from './app-header';
import { AppFooter } from './app-footer';

interface HomeLayoutProps {
  children: ReactNode;
}

/**
 * 홈페이지 전용 레이아웃 컴포넌트
 */
export const HomeLayout = ({ children }: HomeLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">
        {children}
      </main>
      <AppFooter />
    </div>
  );
};
