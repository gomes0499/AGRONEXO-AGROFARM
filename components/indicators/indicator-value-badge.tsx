"use client";

import { Badge } from "@/components/ui/badge";
import { IndicatorThreshold } from "@/schemas/indicators";
import { getIndicatorLevelClient } from "@/lib/actions/indicator-actions";
import { useEffect, useState } from "react";

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
  const [threshold, setThreshold] = useState<IndicatorThreshold | null>(null);
  
  // Obter o nível do indicador com base no valor usando useEffect para lidar com a Promise
  useEffect(() => {
    const fetchThreshold = async () => {
      const result = await getIndicatorLevelClient(value, thresholds);
      setThreshold(result);
    };
    
    fetchThreshold();
  }, [value, thresholds]);
  
  if (!threshold) {
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
      variant="default"
      className={`font-normal transition-all ${sizeClasses[size]} ${className}`}
    >
      {showValue && (
        <span className="mr-2">
          {prefix}
          {value.toFixed(2)}
          {suffix}
        </span>
      )}
      {threshold.level === "THRESHOLD" ? "Limite Crítico" : threshold.level}
    </Badge>
  );
}