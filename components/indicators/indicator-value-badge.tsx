"use client";

import { Badge } from "@/components/ui/badge";
import { IndicatorThreshold } from "@/schemas/indicators";
import { getIndicatorLevelClient } from "@/lib/actions/indicator-actions";

type IndicatorValueBadgeProps = {
  value: number;
  thresholds: IndicatorThreshold[];
  showValue?: boolean;
  prefix?: string;
  suffix?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function IndicatorValueBadge({
  value,
  thresholds,
  showValue = true,
  prefix = "",
  suffix = "",
  size = "md",
  className,
}: IndicatorValueBadgeProps) {
  // Obter o nível do indicador com base no valor
  const currentThreshold = getIndicatorLevelClient(value, thresholds);
  
  if (!currentThreshold) {
    return null;
  }
  
  // Definir classes com base no tamanho
  const sizeClasses = {
    sm: "text-xs py-0.5 px-2",
    md: "text-sm py-1 px-2.5",
    lg: "text-base py-1.5 px-3",
  };
  
  return (
    <Badge
      variant="outline"
      className={`font-medium transition-all ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: `${currentThreshold.color}20`,
        color: currentThreshold.color,
        borderColor: currentThreshold.color,
      }}
    >
      {showValue && (
        <span className="mr-2">
          {prefix}
          {value.toFixed(2)}
          {suffix}
        </span>
      )}
      {currentThreshold.level === "THRESHOLD" ? "LIMITE CRÍTICO" : currentThreshold.level}
    </Badge>
  );
}