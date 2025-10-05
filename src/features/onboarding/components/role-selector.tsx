"use client";

import * as React from "react";
import { GraduationCap, Users } from "lucide-react";
import { RoleCard } from "@/components/ui/role-card";
import type { UserRole, RolesResponse } from "../lib/dto";

export interface RoleSelectorProps {
  value?: UserRole;
  onChange: (role: UserRole) => void;
  roles?: RolesResponse;
  disabled?: boolean;
  className?: string;
}

/**
 * 역할 선택 컴포넌트
 * 학습자와 강사 역할을 선택할 수 있는 카드 형태의 UI
 */
export const RoleSelector = React.forwardRef<HTMLDivElement, RoleSelectorProps>(
  ({ value, onChange, roles = [], disabled = false, className }, ref) => {
    // 기본 역할 아이콘 매핑
    const getRoleIcon = (roleValue: string) => {
      switch (roleValue) {
        case 'learner':
          return <GraduationCap className="w-6 h-6" />;
        case 'instructor':
          return <Users className="w-6 h-6" />;
        default:
          return <GraduationCap className="w-6 h-6" />;
      }
    };

    return (
      <div ref={ref} className={className}>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">역할을 선택해주세요</h2>
            <p className="text-sm text-muted-foreground">
              선택한 역할에 따라 사용할 수 있는 기능이 달라집니다.
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((role) => (
              <RoleCard
                key={role.value}
                value={role.value}
                label={role.label}
                description={role.description}
                icon={getRoleIcon(role.value)}
                selected={value === role.value}
                onClick={() => !disabled && onChange(role.value)}
                className={disabled ? "opacity-50 cursor-not-allowed" : ""}
              />
            ))}
          </div>
          
          {value && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">선택된 역할:</span>{" "}
                {roles.find(role => role.value === value)?.label}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
);
RoleSelector.displayName = "RoleSelector";
