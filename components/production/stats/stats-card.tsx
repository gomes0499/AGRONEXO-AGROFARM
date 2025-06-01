import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export interface StatsCardProps {
  title: string;
  description?: string;
  value: string | number;
  trend?: {
    value: number;
    positive: boolean;
    label?: string;
  };
  icon?: ReactNode;
  className?: string;
  footer?: ReactNode;
}

export function StatsCard({
  title,
  description,
  value,
  trend,
  icon,
  className = "",
  footer,
}: StatsCardProps) {
  return (
    <Card
      className={`overflow-hidden border-border/40 transition-all hover:shadow-md dark:bg-gray-800 dark:border-gray-700 ${className}`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-300">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight dark:text-white">{value}</div>
        {trend && (
          <p className="mt-1 text-sm text-muted-foreground dark:text-gray-300">
            {trend.positive ? "+" : "-"}
            {Math.abs(trend.value)}%{" "}
            {trend.label || "em relação ao período anterior"}
          </p>
        )}
        {description && !trend && (
          <p className="mt-1 text-sm text-muted-foreground dark:text-gray-300">{description}</p>
        )}
        {footer && <div className="mt-2">{footer}</div>}
      </CardContent>
    </Card>
  );
}
