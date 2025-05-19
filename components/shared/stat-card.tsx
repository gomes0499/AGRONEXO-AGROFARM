"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    timeframe: string;
    isPositive?: boolean;
  };
  action?: {
    label: string;
    onClick?: () => void;
  };
  variant?: "light" | "dark";
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  action,
  variant = "light",
  className,
}: StatCardProps) {
  const isDark = variant === "dark";

  return (
    <Card
      className={cn(
        "overflow-hidden",
        isDark && "bg-black border-gray-800 text-white",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex items-center justify-center rounded-full",
                isDark ? "bg-opacity-20 bg-gray-800" : "bg-gray-50",
                isDark ? "w-10 h-10" : "w-14 h-14"
              )}
            >
              <Icon
                className={cn(
                  isDark ? "w-5 h-5 text-green-400" : "w-6 h-6 text-gray-500"
                )}
              />
            </div>

            <div className="flex flex-col">
              <span
                className={cn(
                  "text-sm",
                  isDark ? "text-gray-400 uppercase" : "text-gray-500"
                )}
              >
                {title}
              </span>

              <span
                className={cn("font-bold", isDark ? "text-2xl" : "text-3xl")}
              >
                {value}
              </span>

              {change && (
                <div className="flex items-center mt-1">
                  <span
                    className={cn(
                      "text-xs",
                      change.isPositive !== false
                        ? "text-green-500"
                        : "text-red-500"
                    )}
                  >
                    {change.isPositive !== false ? "+" : "-"}
                    {Math.abs(change.value)}% {change.timeframe}
                  </span>
                </div>
              )}
            </div>
          </div>

          {action && (
            <Button
              variant={isDark ? "outline" : "secondary"}
              size="sm"
              onClick={action.onClick}
              className={cn(
                isDark &&
                  "border-gray-800 bg-gray-800 hover:bg-gray-700 hover:border-gray-700"
              )}
            >
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
