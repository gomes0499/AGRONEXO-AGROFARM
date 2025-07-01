"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IndicatorThreshold } from "@/schemas/indicators";
import { cn } from "@/lib/utils";

type IndicatorThresholdCardProps = {
  value: number;
  thresholds: IndicatorThreshold[];
  title: string;
  description?: string;
  prefix?: string;
  suffix?: string;
  reverse?: boolean;
  className?: string;
};

export function IndicatorThresholdCard({
  value,
  thresholds,
  title,
  description,
  prefix = "",
  suffix = "",
  reverse = false,
  className,
}: IndicatorThresholdCardProps) {
  // Determinar o nível atual com base no valor
  const currentThreshold = thresholds.find((threshold) => {
    const min = threshold.min;
    const max = threshold.max;

    if (max === undefined) {
      return value >= min;
    } else {
      return value >= min && value <= max;
    }
  });

  // Se não encontrar threshold, usar o primeiro
  const thresholdColor = currentThreshold?.color || "#CBD5E0";
  const thresholdLevel = currentThreshold?.level || "N/A";

  return (
    <Card
      className={cn("border-l-4 transition-all hover:shadow-md", className)}
      style={{ borderLeftColor: thresholdColor }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <div className="text-2xl font-bold">
            {prefix}
            {typeof value === "number" ? value.toFixed(2) : value}
            {suffix}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          <Badge
            variant="default"
            className="mt-2 font-normal"
            style={{
              backgroundColor: `${thresholdColor}20`,
              color: thresholdColor,
            }}
          >
            {thresholdLevel === "THRESHOLD" ? "LIMITE CRÍTICO" : 
              thresholdLevel === "MUITO_BOM" ? "MUITO BOM" : 
              thresholdLevel === "ATENCAO" ? "ATENÇÃO" : 
              thresholdLevel === "CONFORTAVEL" ? "CONFORTÁVEL" : 
              thresholdLevel}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
