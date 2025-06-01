"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TrashIcon, PlusCircleIcon } from "lucide-react";
import {
  formatGenericCurrency,
  parseFormattedNumber,
  isNegativeValue,
} from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

interface YearValue {
  year: string;
  value: number;
  isFocused?: boolean;
}

interface YearValueEditorProps {
  label: string;
  description?: string;
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  startYear?: number;
  endYear?: number;
  currency?: "BRL" | "USD" | "EUR" | "SOJA";
  disabled?: boolean;
}

export function YearValueEditor({
  label,
  description,
  values = {},
  onChange,
  startYear = new Date().getFullYear(),
  endYear = new Date().getFullYear() + 10,
  currency = "BRL",
  disabled = false,
}: YearValueEditorProps) {
  // Converte o objeto para um array
  const [yearValues, setYearValues] = useState<YearValue[]>(() => {
    return Object.entries(values || {}).map(([year, value]) => ({
      year,
      value: Number(value),
      isFocused: false,
    }));
  });

  // Atualiza o array quando o objeto de valores mudar de fora
  useEffect(() => {
    if (values) {
      const newYearValues = Object.entries(values).map(([year, value]) => {
        // Preserva o estado de foco se o item existir, mas sem criar dependência circular
        const existingValues = [...yearValues];
        const existingItem = existingValues.find((item) => item.year === year);
        return {
          year,
          value: Number(value),
          isFocused: existingItem?.isFocused || false,
        };
      });
      setYearValues(newYearValues);
    }
    // Remover yearValues das dependências para evitar loop infinito
  }, [values]);

  // Adiciona um novo ano
  const addYear = () => {
    let nextYear: number;

    if (yearValues.length === 0) {
      // Se não houver anos, usar o ano inicial fornecido ou o ano atual
      nextYear = startYear || new Date().getFullYear();
    } else {
      // Se já existem anos, adicionar o próximo ano após o maior existente
      const existingYears = yearValues.map((y) => Number(y.year));
      nextYear = Math.max(...existingYears) + 1;
    }

    // Adiciona o novo ano
    const updatedYearValues = [
      ...yearValues,
      { year: String(nextYear), value: 0, isFocused: false },
    ];
    setYearValues(updatedYearValues);

    // Atualiza o objeto de valores imediatamente
    const newValues: Record<string, number> = {};
    updatedYearValues.forEach((item) => {
      newValues[item.year] = item.value;
    });

    // Chama o callback com os novos valores
    onChange(newValues);
  };

  // Remove um ano
  const removeYear = (index: number) => {
    const newYearValues = [...yearValues];
    newYearValues.splice(index, 1);
    setYearValues(newYearValues);

    // Criar valores para o onChange imediatamente
    const newValues: Record<string, number> = {};
    newYearValues.forEach((item) => {
      newValues[item.year] = item.value;
    });
    onChange(newValues);
  };

  // Atualiza o valor de um ano
  const updateValue = (index: number, value: number) => {
    const newYearValues = [...yearValues];
    newYearValues[index].value = value;
    setYearValues(newYearValues);

    // Criar valores para o onChange imediatamente
    const newValues: Record<string, number> = {};
    newYearValues.forEach((item) => {
      newValues[item.year] = item.value;
    });
    onChange(newValues);
  };

  // Atualiza o ano
  const updateYear = (index: number, year: string) => {
    const newYearValues = [...yearValues];
    newYearValues[index].year = year;
    setYearValues(newYearValues);

    // Criar valores para o onChange imediatamente
    const newValues: Record<string, number> = {};
    newYearValues.forEach((item) => {
      newValues[item.year] = item.value;
    });
    onChange(newValues);
  };

  // Altera o estado de foco de um campo
  const setFieldFocus = (index: number, focused: boolean) => {
    const newYearValues = [...yearValues];
    newYearValues[index].isFocused = focused;
    setYearValues(newYearValues);
  };

  // Ordena os anos
  const sortedYearValues = [...yearValues].sort(
    (a, b) => Number(a.year) - Number(b.year)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{label}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedYearValues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-sm text-muted-foreground mb-4">
              Nenhum valor anual definido
            </p>
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-1"
              onClick={addYear}
              disabled={disabled}
            >
              <PlusCircleIcon className="h-4 w-4" />
              Adicionar Ano
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-2 font-medium">
              <Label>Ano</Label>
              <Label>Valor</Label>
              <div></div>
            </div>
            <Separator />
            {sortedYearValues.map((item, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 items-center">
                <div>
                  <Input
                    type="number"
                    min={startYear}
                    max={endYear}
                    value={item.year}
                    onChange={(e) => updateYear(index, e.target.value)}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Input
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                      isNegativeValue(item.value) && "text-red-600"
                    )}
                    value={
                      item.isFocused
                        ? item.value !== undefined && item.value !== null
                          ? String(Math.abs(item.value))
                          : ""
                        : item.value !== undefined && item.value !== null
                        ? formatGenericCurrency(item.value, currency)
                        : ""
                    }
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^\d.,\-]/g, "");
                      const numericValue = parseFormattedNumber(rawValue);
                      updateValue(index, numericValue ?? 0); // Use 0 as fallback if parsing returns null
                    }}
                    onBlur={() => {
                      setFieldFocus(index, false);
                    }}
                    onFocus={() => {
                      setFieldFocus(index, true);
                    }}
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeYear(index)}
                    disabled={disabled}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-end mt-4">
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-1"
                onClick={addYear}
                disabled={disabled}
              >
                <PlusCircleIcon className="h-4 w-4" />
                Adicionar Ano
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
