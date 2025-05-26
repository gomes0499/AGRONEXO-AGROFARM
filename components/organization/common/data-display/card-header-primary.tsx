import React from "react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface CardHeaderPrimaryProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeaderPrimary({
  icon,
  title,
  description,
  action,
  className = "",
}: CardHeaderPrimaryProps) {
  return (
    <CardHeader
      className={`bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-full p-2 bg-white/20">
          {icon}
        </div>
        <div>
          <CardTitle className="text-white">{title}</CardTitle>
          {description && (
            <CardDescription className="text-white/80">
              {description}
            </CardDescription>
          )}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </CardHeader>
  );
}
