"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
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
import { ProfileSchema, type Profile } from "../lib/dto";

export interface ProfileFormProps {
  onSubmit: (data: Profile) => void;
  isLoading?: boolean;
  className?: string;
}

/**
 * 프로필 정보 입력 폼 컴포넌트
 * 이름, 휴대폰 번호, 약관 동의를 입력받는 폼
 */
export const ProfileForm = React.forwardRef<HTMLDivElement, ProfileFormProps>(
  ({ onSubmit, isLoading = false, className }, ref) => {
    const form = useForm<Profile>({
      resolver: zodResolver(ProfileSchema),
      defaultValues: {
        fullName: "",
        phone: "",
        termsAgreed: false,
      },
    });

    const handleSubmit = (data: Profile) => {
      onSubmit(data);
    };

    return (
      <div ref={ref} className={className}>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">프로필 정보를 입력해주세요</h2>
            <p className="text-sm text-muted-foreground">
              서비스 이용을 위한 기본 정보를 입력해주세요.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* 이름 입력 */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이름 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="홍길동"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      실명을 입력해주세요. (2-50자, 한글/영문)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 휴대폰 번호 입력 */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>휴대폰 번호 *</FormLabel>
                    <FormControl>
                      <PhoneInput
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      휴대폰 번호를 입력하면 자동으로 형식이 맞춰집니다.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 약관 동의 */}
              <FormField
                control={form.control}
                name="termsAgreed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        이용약관 및 개인정보처리방침에 동의합니다 *
                      </FormLabel>
                      <FormDescription>
                        서비스 이용을 위해 약관 동의가 필요합니다.{" "}
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 text-xs underline"
                          onClick={() => {
                            // TODO: 약관 내용 팝업 표시
                            alert("약관 내용을 표시하는 팝업이 여기에 나타납니다.");
                          }}
                        >
                          약관 보기
                        </Button>
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {/* 제출 버튼 */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "처리 중..." : "다음 단계"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    );
  }
);
ProfileForm.displayName = "ProfileForm";
