"use client";

import { Badge } from "@/components/ui/badge";
import { formatGenericCurrency } from "@/lib/utils/formatters";

interface CurrencyBadgeProps {
  value: number;
  currency?: "BRL" | "USD";
  withSign?: boolean;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function CurrencyBadge({
  value,
  currency = "BRL",
  withSign = false,
  variant = "default",
}: CurrencyBadgeProps) {
  // Determina a cor com base no sinal
  const getVariant = () => {
    if (!withSign) return variant;
    
    if (value > 0) return "default";
    if (value < 0) return "destructive";
    return "secondary";
  };

  // Formata o valor monetário com sinal
  const displayValue = formatGenericCurrency(value, currency);
  const formattedValue = withSign && value > 0 ? `+${displayValue}` : displayValue;

  return (
    <Badge variant={getVariant()} className="font-mono">
      {formattedValue}
    </Badge>
  );
}