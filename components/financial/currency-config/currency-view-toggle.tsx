"use client";

import { Button } from "@/components/ui/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DollarSign } from "lucide-react";

interface CurrencyViewToggleProps {
  currentView: "BRL" | "USD" | "BOTH";
  onViewChange: (view: "BRL" | "USD" | "BOTH") => void;
  showBothOption?: boolean;
}

export function CurrencyViewToggle({
  currentView,
  onViewChange,
  showBothOption = true,
}: CurrencyViewToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Visualizar em:</span>
      <ToggleGroup 
        type="single" 
        value={currentView}
        onValueChange={(value) => {
          if (value) onViewChange(value as "BRL" | "USD" | "BOTH");
        }}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="BRL" aria-label="Visualizar em Reais">
                R$
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visualizar valores em Reais (BRL)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem value="USD" aria-label="Visualizar em Dólares">
                US$
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visualizar valores em Dólares (USD)</p>
            </TooltipContent>
          </Tooltip>

          {showBothOption && (
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem value="BOTH" aria-label="Visualizar ambas moedas">
                  R$/US$
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                <p>Visualizar valores em ambas as moedas</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </ToggleGroup>
    </div>
  );
}