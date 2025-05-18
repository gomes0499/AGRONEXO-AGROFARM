"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PriceUnitSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export const PRICE_UNITS = {
  CABECA: "Por cabeça (R$/cabeça)",
  KG: "Por quilograma (R$/kg)",
  ARROBA: "Por arroba (R$/@)",
  LOTE: "Por lote (R$/lote)",
};

export const QUANTIDADE_LABELS = {
  CABECA: {
    label: "Número de Animais",
    description: "Quantidade total de animais",
    placeholder: "Número de cabeças"
  },
  KG: {
    label: "Peso Total (kg)",
    description: "Peso total em quilogramas",
    placeholder: "Quantidade em kg"
  },
  ARROBA: {
    label: "Peso Total (@)",
    description: "Peso total em arrobas (1@ = 15kg)",
    placeholder: "Quantidade em arrobas"
  },
  LOTE: {
    label: "Número de Lotes",
    description: "Quantidade de lotes completos",
    placeholder: "Quantidade de lotes"
  }
};

export function PriceUnitSelector({
  value,
  onChange,
  disabled = false,
  className,
}: PriceUnitSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Selecione a unidade" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PRICE_UNITS).map(([key, label]) => (
          <SelectItem key={key} value={key}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
