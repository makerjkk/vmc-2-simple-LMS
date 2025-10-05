"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { HomeLayout } from "@/components/layout/home-layout";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  GraduationCap, 
  BookOpen,
  Edit,
  Save,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ProfilePageProps = {
  params: Promise<Record<string, never>>;
};

/**
 * 사용자 프로필 페이지
 * 사용자 정보 조회 및 수정 기능 제공
 */
export default function ProfilePage({ params }: ProfilePageProps) {
  void params;
  
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phoneNumber: "",
  });

  // 사용자 정보가 로드되면 폼 초기화
  React.useEffect(() => {
    if (user?.profile) {
      setEditForm({
        fullName: user.profile.fullName || "",
        phoneNumber: user.profile.phone || "",
      });
    }
  }, [user]);

  // 사용자 이니셜 생성
  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  // 역할 표시명 반환
  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'instructor':
        return '강사';
      case 'operator':
        return '운영자';
      case 'learner':
      default:
        return '학습자';
    }
  };

  // 역할 아이콘 반환
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'instructor':
        return <GraduationCap className="h-4 w-4" />;
      case 'operator':
        return <Shield className="h-4 w-4" />;
      case 'learner':
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  // 역할 색상 반환
  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'instructor':
        return 'bg-blue-100 text-blue-800';
      case 'operator':
        return 'bg-purple-100 text-purple-800';
      case 'learner':
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  // 편집 모드 시작
  const handleStartEdit = () => {
    setIsEditing(true);
  };

  // 편집 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (user?.profile) {
      setEditForm({
        fullName: user.profile.fullName || "",
        phoneNumber: user.profile.phone || "",
      });
    }
  };

  // 프로필 저장
  const handleSaveProfile = async () => {
    try {
      // TODO: 실제 프로필 업데이트 API 호출
      console.log('프로필 업데이트:', editForm);
      
      toast({
        title: "✅ 프로필 업데이트 성공",
        description: "프로필 정보가 성공적으로 업데이트되었습니다.",
        duration: 3000,
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      toast({
        title: "❌ 프로필 업데이트 실패",
        description: "프로필 정보 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <HomeLayout>
        <div className="container mx-auto py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="h-8 bg-slate-200 rounded animate-pulse w-32 mb-4" />
            <Card>
              <CardHeader>
                <div className="h-6 bg-slate-200 rounded animate-pulse w-24 mb-2" />
                <div className="h-4 bg-slate-200 rounded animate-pulse w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-20 bg-slate-200 rounded animate-pulse" />
                <div className="h-10 bg-slate-200 rounded animate-pulse" />
                <div className="h-10 bg-slate-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          </div>
        </div>
      </HomeLayout>
    );
  }

  // 인증되지 않은 경우
  if (!user) {
    return (
      <HomeLayout>
        <div className="container mx-auto py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
            <p className="text-muted-foreground mb-6">
              프로필을 확인하려면 로그인해주세요.
            </p>
            <Button onClick={() => router.push('/login')}>
              로그인하기
            </Button>
          </div>
        </div>
      </HomeLayout>
    );
  }

  return (
    <HomeLayout>
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 페이지 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">프로필</h1>
              <p className="text-muted-foreground mt-2">
                계정 정보를 확인하고 수정할 수 있습니다.
              </p>
            </div>
            {!isEditing ? (
              <Button onClick={handleStartEdit} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                편집
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  저장
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  취소
                </Button>
              </div>
            )}
          </div>

          {/* 기본 정보 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                기본 정보
              </CardTitle>
              <CardDescription>
                계정의 기본 정보를 확인할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 프로필 이미지 및 기본 정보 */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" alt={user.profile?.fullName} />
                  <AvatarFallback className="text-lg">
                    {getUserInitials(user.profile?.fullName, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">
                      {user.profile?.fullName || user.email}
                    </h3>
                    <Badge className={`${getRoleColor(user.profile?.role)} flex items-center gap-1`}>
                      {getRoleIcon(user.profile?.role)}
                      {getRoleDisplayName(user.profile?.role)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                  {user.profile?.termsAgreedAt && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      가입일: {new Date(user.profile.termsAgreedAt).toLocaleDateString('ko-KR')}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* 편집 가능한 필드들 */}
              <div className="grid gap-4">
                {/* 이름 */}
                <div className="grid gap-2">
                  <Label htmlFor="fullName">이름</Label>
                  {isEditing ? (
                    <Input
                      id="fullName"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="이름을 입력하세요"
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-md">
                      {user.profile?.fullName || '이름이 설정되지 않았습니다'}
                    </div>
                  )}
                </div>

                {/* 전화번호 */}
                <div className="grid gap-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    전화번호
                  </Label>
                  {isEditing ? (
                    <Input
                      id="phoneNumber"
                      value={editForm.phoneNumber}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="전화번호를 입력하세요"
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-md">
                      {user.profile?.phone || '전화번호가 설정되지 않았습니다'}
                    </div>
                  )}
                </div>

                {/* 이메일 (읽기 전용) */}
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    이메일
                  </Label>
                  <div className="p-3 bg-muted rounded-md text-muted-foreground">
                    {user.email} (변경 불가)
                  </div>
                </div>

                {/* 역할 (읽기 전용) */}
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2">
                    {getRoleIcon(user.profile?.role)}
                    역할
                  </Label>
                  <div className="p-3 bg-muted rounded-md text-muted-foreground">
                    {getRoleDisplayName(user.profile?.role)} (변경 불가)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 계정 보안 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                계정 보안
              </CardTitle>
              <CardDescription>
                계정 보안 설정을 관리할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  비밀번호 변경
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  2단계 인증 설정
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  계정 탈퇴
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </HomeLayout>
  );
}
