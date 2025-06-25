"use client";

import { formatGenericCurrency } from "@/lib/utils/formatters";
import { convertCurrency } from "@/lib/utils/currency-converter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface CurrencyValueDisplayProps {
  value: number;
  originalCurrency: "BRL" | "USD";
  displayMode?: "BRL" | "USD" | "BOTH";
  exchangeRate?: number;
  showTooltip?: boolean;
}

export function CurrencyValueDisplay({
  value,
  originalCurrency,
  displayMode = "BRL",
  exchangeRate = 5.00,
  showTooltip = true,
}: CurrencyValueDisplayProps) {
  // Se o modo de exibição é o mesmo da moeda original, apenas formatar
  if (displayMode === originalCurrency) {
    return <span>{formatGenericCurrency(value, originalCurrency)}</span>;
  }

  // Se o modo é BOTH, mostrar ambos valores
  if (displayMode === "BOTH") {
    const brlValue = originalCurrency === "BRL" ? value : convertCurrency(value, "USD", "BRL", exchangeRate);
    const usdValue = originalCurrency === "USD" ? value : convertCurrency(value, "BRL", "USD", exchangeRate);
    
    return (
      <span className="space-x-1">
        <span className={originalCurrency === "BRL" ? "font-medium" : "text-muted-foreground"}>
          {formatGenericCurrency(brlValue, "BRL")}
        </span>
        <span className="text-muted-foreground">/</span>
        <span className={originalCurrency === "USD" ? "font-medium" : "text-muted-foreground"}>
          {formatGenericCurrency(usdValue, "USD")}
        </span>
      </span>
    );
  }

  // Conversão simples
  const convertedValue = convertCurrency(value, originalCurrency, displayMode, exchangeRate);
  const formattedOriginal = formatGenericCurrency(value, originalCurrency);
  const formattedConverted = formatGenericCurrency(convertedValue, displayMode);

  if (!showTooltip) {
    return <span>{formattedConverted}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1">
            {formattedConverted}
            <Info className="h-3 w-3 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            <p>Valor original: {formattedOriginal}</p>
            <p>Taxa de câmbio: US$ 1,00 = R$ {exchangeRate.toFixed(2)}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}