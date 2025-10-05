"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { StepIndicator, type Step } from "@/components/ui/step-indicator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { RoleSelector } from "./role-selector";
import { ProfileForm } from "./profile-form";
import { useOnboarding } from "../hooks/useOnboarding";
import { validateEmail } from "@/lib/validation/onboarding";
import { SignupRequestSchema, type SignupRequest, type UserRole, type Profile } from "../lib/dto";
import { z } from "zod";

// 온보딩 단계 정의
const ONBOARDING_STEPS: Step[] = [
  {
    id: "account",
    title: "계정 정보",
    description: "이메일과 비밀번호"
  },
  {
    id: "role",
    title: "역할 선택",
    description: "학습자 또는 강사"
  },
  {
    id: "profile",
    title: "프로필 정보",
    description: "이름과 연락처"
  }
];

// 계정 정보 폼 스키마
const AccountFormSchema = z.object({
  email: z.string().email('올바른 이메일 형식을 입력해주세요.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
  confirmPassword: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
});

type AccountFormData = z.infer<typeof AccountFormSchema>;

export interface OnboardingFormProps {
  className?: string;
}

/**
 * 다단계 온보딩 폼 컴포넌트
 * 계정 정보 → 역할 선택 → 프로필 정보 순서로 진행
 */
export const OnboardingForm = React.forwardRef<HTMLDivElement, OnboardingFormProps>(
  ({ className }, ref) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<Partial<SignupRequest>>({});
    const { toast } = useToast();
    
    const {
      checkEmail,
      isCheckingEmail,
      emailCheckError,
      signup,
      isSigningUp,
      signupError,
      roles,
      isLoadingRoles,
    } = useOnboarding();

    // 계정 정보 폼
    const accountForm = useForm<AccountFormData>({
      resolver: zodResolver(AccountFormSchema),
      defaultValues: {
        email: "",
        password: "",
        confirmPassword: "",
      },
    });

    // 이메일 중복 체크
    const handleEmailCheck = useCallback(async (email: string) => {
      const validation = validateEmail(email);
      if (!validation.isValid) {
        return;
      }

      try {
        const result = await checkEmail(email);
        if (result.exists) {
          accountForm.setError("email", {
            type: "manual",
            message: result.message
          });
        } else {
          toast({
            title: "사용 가능한 이메일",
            description: result.message,
          });
        }
      } catch (error) {
        toast({
          title: "오류 발생",
          description: emailCheckError || "이메일 확인 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    }, [checkEmail, emailCheckError, accountForm, toast]);

    // 1단계: 계정 정보 제출
    const handleAccountSubmit = (data: AccountFormData) => {
      if (data.password !== data.confirmPassword) {
        accountForm.setError("confirmPassword", {
          type: "manual",
          message: "비밀번호가 일치하지 않습니다."
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        email: data.email,
        password: data.password,
      }));
      setCurrentStep(2);
    };

    // 2단계: 역할 선택
    const handleRoleSelect = (role: UserRole) => {
      setFormData(prev => ({
        ...prev,
        role,
      }));
      setCurrentStep(3);
    };

    // 3단계: 프로필 정보 제출 및 최종 회원가입
    const handleProfileSubmit = async (profile: Profile) => {
      const completeData: SignupRequest = {
        email: formData.email!,
        password: formData.password!,
        role: formData.role!,
        profile,
      };

      try {
        await signup(completeData);
        toast({
          title: "회원가입 완료",
          description: "환영합니다! 잠시 후 페이지가 이동됩니다.",
        });
      } catch (error) {
        toast({
          title: "회원가입 실패",
          description: signupError || "회원가입 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    };

    // 이전 단계로 이동
    const handlePrevStep = () => {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
      }
    };

    return (
      <div ref={ref} className={className}>
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">회원가입</CardTitle>
            <div className="mt-6">
              <StepIndicator
                steps={ONBOARDING_STEPS}
                currentStep={currentStep}
              />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 1단계: 계정 정보 */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">계정 정보를 입력해주세요</h3>
                  <p className="text-sm text-muted-foreground">
                    로그인에 사용할 이메일과 비밀번호를 설정해주세요.
                  </p>
                </div>

                <Form {...accountForm}>
                  <form onSubmit={accountForm.handleSubmit(handleAccountSubmit)} className="space-y-4">
                    {/* 이메일 입력 */}
                    <FormField
                      control={accountForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>이메일 *</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="example@email.com"
                                {...field}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => handleEmailCheck(field.value)}
                              disabled={isCheckingEmail || !field.value}
                            >
                              {isCheckingEmail ? "확인 중..." : "중복 확인"}
                            </Button>
                          </div>
                          <FormDescription>
                            이메일 주소는 로그인 ID로 사용됩니다.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 비밀번호 입력 */}
                    <FormField
                      control={accountForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>비밀번호 *</FormLabel>
                          <FormControl>
                            <PasswordInput
                              placeholder="비밀번호를 입력하세요"
                              showStrengthIndicator
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            최소 8자 이상, 영문/숫자/특수문자 조합을 권장합니다.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 비밀번호 확인 */}
                    <FormField
                      control={accountForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>비밀번호 확인 *</FormLabel>
                          <FormControl>
                            <PasswordInput
                              placeholder="비밀번호를 다시 입력하세요"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      다음 단계
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {/* 2단계: 역할 선택 */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <RoleSelector
                  value={formData.role}
                  onChange={handleRoleSelect}
                  roles={roles}
                  disabled={isLoadingRoles}
                />
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="flex-1"
                  >
                    이전
                  </Button>
                  <Button
                    type="button"
                    onClick={() => formData.role && setCurrentStep(3)}
                    disabled={!formData.role}
                    className="flex-1"
                  >
                    다음 단계
                  </Button>
                </div>
              </div>
            )}

            {/* 3단계: 프로필 정보 */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <ProfileForm
                  onSubmit={handleProfileSubmit}
                  isLoading={isSigningUp}
                />
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={isSigningUp}
                  className="w-full"
                >
                  이전
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
);
OnboardingForm.displayName = "OnboardingForm";
