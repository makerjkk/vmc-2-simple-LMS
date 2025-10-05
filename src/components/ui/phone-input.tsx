"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { formatPhoneNumber } from "@/lib/validation/onboarding";

export interface PhoneInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, ...props }, ref) => {
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      
      // 새로운 이벤트 객체 생성
      const newEvent = {
        ...e,
        target: {
          ...e.target,
          value: formatted,
        },
      };
      
      onChange?.(newEvent as React.ChangeEvent<HTMLInputElement>);
    };

    return (
      <Input
        type="tel"
        placeholder="010-0000-0000"
        maxLength={13}
        className={cn(className)}
        ref={ref}
        {...props}
        onChange={handlePhoneChange}
      />
    );
  }
);
PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
