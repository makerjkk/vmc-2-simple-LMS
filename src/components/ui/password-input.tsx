"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validatePassword } from "@/lib/validation/onboarding";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showStrengthIndicator?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrengthIndicator = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [strength, setStrength] = React.useState<'weak' | 'medium' | 'strong'>('weak');

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const password = e.target.value;
      if (showStrengthIndicator && password) {
        const validation = validatePassword(password);
        setStrength(validation.strength);
      }
      props.onChange?.(e);
    };

    const getStrengthColor = () => {
      switch (strength) {
        case 'weak':
          return 'bg-red-500';
        case 'medium':
          return 'bg-yellow-500';
        case 'strong':
          return 'bg-green-500';
        default:
          return 'bg-gray-300';
      }
    };

    const getStrengthText = () => {
      switch (strength) {
        case 'weak':
          return '약함';
        case 'medium':
          return '보통';
        case 'strong':
          return '강함';
        default:
          return '';
      }
    };

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          ref={ref}
          {...props}
          onChange={handlePasswordChange}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="sr-only">
            {showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
          </span>
        </Button>
        
        {showStrengthIndicator && props.value && (
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    getStrengthColor()
                  )}
                  style={{
                    width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%'
                  }}
                />
              </div>
              <span className="text-sm text-muted-foreground min-w-[40px]">
                {getStrengthText()}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
