"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HomeLayout } from "@/components/layout/home-layout";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Monitor, 
  Moon, 
  Sun, 
  Globe, 
  Shield, 
  Database,
  Download,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type SettingsPageProps = {
  params: Promise<Record<string, never>>;
};

/**
 * 설정 페이지
 * 사용자 환경설정 및 시스템 설정 관리
 */
export default function SettingsPage({ params }: SettingsPageProps) {
  void params;
  
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();
  const { toast } = useToast();
  
  // 설정 상태
  const [settings, setSettings] = useState({
    // 알림 설정
    emailNotifications: true,
    pushNotifications: false,
    assignmentReminders: true,
    gradeNotifications: true,
    courseUpdates: true,
    
    // 화면 설정
    theme: 'system', // 'light', 'dark', 'system'
    language: 'ko',
    fontSize: 'medium', // 'small', 'medium', 'large'
    
    // 개인정보 설정
    profileVisibility: 'public', // 'public', 'private'
    showEmail: false,
    showPhone: false,
    
    // 학습 설정
    autoSave: true,
    showProgress: true,
    compactView: false,
  });

  // 설정 업데이트 핸들러
  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // TODO: 실제 설정 저장 API 호출
    console.log(`설정 변경: ${key} = ${value}`);
    
    toast({
      title: "설정 저장됨",
      description: "설정이 자동으로 저장되었습니다.",
      duration: 2000,
    });
  };

  // 데이터 내보내기
  const handleExportData = () => {
    toast({
      title: "데이터 내보내기 시작",
      description: "데이터를 준비하고 있습니다. 완료되면 다운로드가 시작됩니다.",
      duration: 3000,
    });
    
    // TODO: 실제 데이터 내보내기 구현
    console.log('데이터 내보내기 요청');
  };

  // 계정 삭제
  const handleDeleteAccount = () => {
    if (confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      toast({
        title: "계정 삭제 요청",
        description: "계정 삭제 요청이 접수되었습니다. 처리까지 최대 7일이 소요됩니다.",
        variant: "destructive",
        duration: 5000,
      });
      
      // TODO: 실제 계정 삭제 API 호출
      console.log('계정 삭제 요청');
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <HomeLayout>
        <div className="container mx-auto py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="h-8 bg-slate-200 rounded animate-pulse w-32 mb-4" />
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="h-6 bg-slate-200 rounded animate-pulse w-24 mb-2" />
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-10 bg-slate-200 rounded animate-pulse" />
                    <div className="h-10 bg-slate-200 rounded animate-pulse" />
                    <div className="h-10 bg-slate-200 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            </div>
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
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
            <p className="text-muted-foreground mb-6">
              설정을 변경하려면 로그인해주세요.
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 페이지 헤더 */}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <SettingsIcon className="h-8 w-8" />
              설정
            </h1>
            <p className="text-muted-foreground mt-2">
              계정 및 애플리케이션 설정을 관리할 수 있습니다.
            </p>
          </div>

          {/* 설정 탭 */}
          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                알림
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                화면
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                개인정보
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                데이터
              </TabsTrigger>
            </TabsList>

            {/* 알림 설정 */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    알림 설정
                  </CardTitle>
                  <CardDescription>
                    받고 싶은 알림의 종류를 선택할 수 있습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>이메일 알림</Label>
                      <p className="text-sm text-muted-foreground">
                        중요한 업데이트를 이메일로 받습니다
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>푸시 알림</Label>
                      <p className="text-sm text-muted-foreground">
                        브라우저 푸시 알림을 받습니다
                      </p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>과제 알림</Label>
                      <p className="text-sm text-muted-foreground">
                        과제 마감일 알림을 받습니다
                      </p>
                    </div>
                    <Switch
                      checked={settings.assignmentReminders}
                      onCheckedChange={(checked) => handleSettingChange('assignmentReminders', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>성적 알림</Label>
                      <p className="text-sm text-muted-foreground">
                        성적이 등록되면 알림을 받습니다
                      </p>
                    </div>
                    <Switch
                      checked={settings.gradeNotifications}
                      onCheckedChange={(checked) => handleSettingChange('gradeNotifications', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>코스 업데이트</Label>
                      <p className="text-sm text-muted-foreground">
                        수강 중인 코스의 업데이트 알림을 받습니다
                      </p>
                    </div>
                    <Switch
                      checked={settings.courseUpdates}
                      onCheckedChange={(checked) => handleSettingChange('courseUpdates', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 화면 설정 */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    화면 설정
                  </CardTitle>
                  <CardDescription>
                    애플리케이션의 모양과 느낌을 사용자 정의할 수 있습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>테마</Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value) => handleSettingChange('theme', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            라이트 모드
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            다크 모드
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            시스템 설정 따르기
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>언어</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) => handleSettingChange('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ko">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            한국어
                          </div>
                        </SelectItem>
                        <SelectItem value="en">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            English
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>글자 크기</Label>
                    <Select
                      value={settings.fontSize}
                      onValueChange={(value) => handleSettingChange('fontSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">작게</SelectItem>
                        <SelectItem value="medium">보통</SelectItem>
                        <SelectItem value="large">크게</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>간단한 보기</Label>
                      <p className="text-sm text-muted-foreground">
                        더 간결한 인터페이스를 사용합니다
                      </p>
                    </div>
                    <Switch
                      checked={settings.compactView}
                      onCheckedChange={(checked) => handleSettingChange('compactView', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 개인정보 설정 */}
            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    개인정보 설정
                  </CardTitle>
                  <CardDescription>
                    다른 사용자에게 공개되는 정보를 관리할 수 있습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>프로필 공개 범위</Label>
                    <Select
                      value={settings.profileVisibility}
                      onValueChange={(value) => handleSettingChange('profileVisibility', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">전체 공개</SelectItem>
                        <SelectItem value="private">비공개</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>이메일 주소 공개</Label>
                      <p className="text-sm text-muted-foreground">
                        다른 사용자가 내 이메일 주소를 볼 수 있습니다
                      </p>
                    </div>
                    <Switch
                      checked={settings.showEmail}
                      onCheckedChange={(checked) => handleSettingChange('showEmail', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>전화번호 공개</Label>
                      <p className="text-sm text-muted-foreground">
                        다른 사용자가 내 전화번호를 볼 수 있습니다
                      </p>
                    </div>
                    <Switch
                      checked={settings.showPhone}
                      onCheckedChange={(checked) => handleSettingChange('showPhone', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 데이터 관리 */}
            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    데이터 관리
                  </CardTitle>
                  <CardDescription>
                    내 데이터를 관리하고 계정을 제어할 수 있습니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>자동 저장</Label>
                      <p className="text-sm text-muted-foreground">
                        작업 내용을 자동으로 저장합니다
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoSave}
                      onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>진행률 표시</Label>
                      <p className="text-sm text-muted-foreground">
                        코스 진행률을 다른 사용자에게 표시합니다
                      </p>
                    </div>
                    <Switch
                      checked={settings.showProgress}
                      onCheckedChange={(checked) => handleSettingChange('showProgress', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">데이터 내보내기</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        내 모든 데이터를 다운로드할 수 있습니다. (프로필, 코스 기록, 제출물 등)
                      </p>
                      <Button onClick={handleExportData} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        데이터 내보내기
                      </Button>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-2 text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        위험 구역
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                      </p>
                      <Button onClick={handleDeleteAccount} variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        계정 삭제
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </HomeLayout>
  );
}
