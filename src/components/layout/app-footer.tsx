'use client';

import Link from 'next/link';
import { BookOpen, Mail, Phone, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

/**
 * 애플리케이션 공통 푸터 컴포넌트
 */
export const AppFooter = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: '코스', href: '/courses' },
      { label: '강사 지원', href: '/instructor/signup' },
      { label: '도움말', href: '/help' },
    ],
    company: [
      { label: '회사 소개', href: '/about' },
      { label: '채용', href: '/careers' },
      { label: '블로그', href: '/blog' },
    ],
    legal: [
      { label: '이용약관', href: '/terms' },
      { label: '개인정보처리방침', href: '/privacy' },
      { label: '쿠키 정책', href: '/cookies' },
    ],
  };

  const contactInfo = [
    { icon: <Mail className="h-4 w-4" />, label: 'support@eduplatform.com' },
    { icon: <Phone className="h-4 w-4" />, label: '1588-1234' },
    { icon: <MapPin className="h-4 w-4" />, label: '서울시 강남구 테헤란로 123' },
  ];

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* 브랜드 정보 */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">EduPlatform</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              누구나 쉽게 배우고 가르칠 수 있는 온라인 학습 플랫폼입니다.
              전문적인 코스와 체계적인 학습 관리를 통해 성장을 지원합니다.
            </p>
            <div className="space-y-2">
              {contactInfo.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 플랫폼 링크 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">플랫폼</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 회사 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">회사</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 법적 정보 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">법적 고지</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* 하단 정보 */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © {currentYear} EduPlatform. All rights reserved.
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>사업자등록번호: 123-45-67890</span>
            <span>통신판매업신고번호: 2024-서울강남-1234</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
