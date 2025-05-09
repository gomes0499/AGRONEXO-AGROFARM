"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowDown,
  ArrowUp,
  BarChart,
  Building2,
  LineChart,
  Map,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  iconName?: string;
  iconColor?: string;
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  iconName,
  iconColor,
}: StatsCardProps) {
  // Função para renderizar o ícone baseado no nome
  const renderIcon = () => {
    switch (iconName) {
      case "Map":
        return <Map className={cn("h-5 w-5", iconColor)} />;
      case "Building2":
        return <Building2 className={cn("h-5 w-5", iconColor)} />;
      case "LineChart":
        return <LineChart className={cn("h-5 w-5", iconColor)} />;
      case "BarChart":
        return <BarChart className={cn("h-5 w-5", iconColor)} />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {iconName && (
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
            {renderIcon()}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between">
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div
              className={cn(
                "flex items-center text-xs",
                trend.positive ? "text-green-500" : "text-red-500"
              )}
            >
              {trend.positive ? (
                <ArrowUp className="mr-1 h-3 w-3" />
              ) : (
                <ArrowDown className="mr-1 h-3 w-3" />
              )}
              <span>{trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
