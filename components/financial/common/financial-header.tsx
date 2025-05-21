"use client";

import { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";

interface FinancialHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  showSeparator?: boolean;
}

export function FinancialHeader({
  title,
  description,
  action,
  showSeparator = true,
}: FinancialHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      
      {showSeparator && <Separator />}
    </div>
  );
}