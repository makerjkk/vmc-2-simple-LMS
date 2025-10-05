"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export interface RoleCardProps {
  value: string;
  label: string;
  description: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const RoleCard = React.forwardRef<HTMLDivElement, RoleCardProps>(
  ({ value, label, description, icon, selected = false, onClick, className }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md",
          "border-2",
          {
            "border-primary bg-primary/5": selected,
            "border-border hover:border-primary/50": !selected,
          },
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {icon && (
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-lg transition-colors duration-200",
                    {
                      "bg-primary text-primary-foreground": selected,
                      "bg-muted text-muted-foreground": !selected,
                    }
                  )}
                >
                  {icon}
                </div>
              )}
              
              <div className="flex-1">
                <h3
                  className={cn(
                    "text-lg font-semibold transition-colors duration-200",
                    {
                      "text-primary": selected,
                      "text-foreground": !selected,
                    }
                  )}
                >
                  {label}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
            
            {/* 선택 표시 */}
            <div
              className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200",
                {
                  "bg-primary border-primary text-primary-foreground": selected,
                  "border-muted-foreground": !selected,
                }
              )}
            >
              {selected && <Check className="w-4 h-4" />}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);
RoleCard.displayName = "RoleCard";

export { RoleCard };
