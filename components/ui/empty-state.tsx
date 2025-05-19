import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ 
  title, 
  description, 
  icon, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50",
      className
    )}>
      {icon && (
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          {icon}
        </div>
      )}
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && 
        <div className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{description}</div>
      }
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}