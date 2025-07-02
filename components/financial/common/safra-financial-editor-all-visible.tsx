"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatGenericCurrency, CurrencyType } from "@/lib/utils/formatters";
import { CurrencyField } from "@/components/shared/currency-field";

interface Harvest {
  id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
  organizacao_id?: string;
}

interface SafraFinancialEditorAllVisibleProps {
  label?: string;
  description?: string;
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  safras: Harvest[];
  disabled?: boolean;
  currency?: CurrencyType;
}

export function SafraFinancialEditorAllVisible({
  label = "Valores por Safra",
  description,
  values,
  onChange,
  safras,
  disabled = false,
  currency = "BRL",
}: SafraFinancialEditorAllVisibleProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Sort safras by year (no filtering to show all available safras)
  const filteredSafras = (safras || [])
    .sort((a, b) => a.ano_inicio - b.ano_inicio);

  // Don't initialize values automatically - let user decide which safras to fill
  // This was causing all safras to be saved with 0 value
  // useEffect removed to prevent automatic initialization

  const handleValueChange = (safraId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...values,
      [safraId]: numValue,
    });
  };
  
  const handleCurrencyFieldChange = (safraId: string, value: number) => {
    const numValue = value ?? 0;
    
    if (numValue === 0) {
      // Remove the safra from values if it's 0
      const newValues = { ...values };
      delete newValues[safraId];
      onChange(newValues);
    } else {
      // Only add non-zero values
      onChange({
        ...values,
        [safraId]: numValue,
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      // Set all values to the same as the first non-zero value
      const firstValue = Object.values(values).find((v) => v > 0) || 0;
      if (firstValue > 0) {
        const newValues: Record<string, number> = {};
        filteredSafras.forEach((safra) => {
          newValues[safra.id || ""] = firstValue;
        });
        onChange(newValues);
      }
    } else {
      // Clear all values (don't set to 0, just remove)
      onChange({});
    }
  };

  const activeCount = Object.values(values).filter((v) => v > 0).length;
  const totalValue = Object.values(values).reduce((sum, val) => sum + val, 0);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{label}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={activeCount > 0 ? "default" : "secondary"}>
              {activeCount} de {filteredSafras.length} safras
            </Badge>
            <Button variant="ghost" size="sm" type="button">
              {collapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="space-y-4">
          {/* Select All Option */}
          <div className="flex items-center space-x-2 pb-2 border-b">
            <Checkbox
              id="select-all-values"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
              disabled={disabled}
            />
            <Label
              htmlFor="select-all-values"
              className="text-sm font-medium cursor-pointer"
            >
              Aplicar mesmo valor para todas as safras
            </Label>
          </div>

          {/* Safras Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSafras.map((safra) => {
              const value = values[safra.id || ""] || 0;
              const hasValue = value > 0;

              return (
                <div
                  key={safra.id}
                  className={`p-3 rounded-lg border ${
                    hasValue
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background"
                  }`}
                >
                  <Label
                    htmlFor={`value-${safra.id}`}
                    className="text-sm font-medium mb-1 block"
                  >
                    {safra.nome}
                  </Label>
                  <CurrencyField
                    id={`value-${safra.id}`}
                    defaultValue={value}
                    onChange={(newValue) => handleCurrencyFieldChange(safra.id || "", newValue)}
                    placeholder="0,00"
                    disabled={disabled}
                    currency={currency}
                    className={hasValue ? "font-medium" : ""}
                  />
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {activeCount > 0 && (
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Total ({activeCount} safra{activeCount !== 1 ? "s" : ""})
                </span>
                <span className="font-medium text-lg">
                  {formatGenericCurrency(totalValue, currency)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}