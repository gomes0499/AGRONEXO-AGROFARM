"use client";

import { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface CardHeaderPrimaryProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  showSeparator?: boolean;
  className?: string;
}

export function CardHeaderPrimary({
  icon,
  title,
  description,
  action,
  showSeparator = true,
  className,
}: CardHeaderPrimaryProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <div className="text-primary">{icon}</div>}
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      
      {showSeparator && <Separator />}
    </div>
  );
}