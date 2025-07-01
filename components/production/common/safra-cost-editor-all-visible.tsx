"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/utils/formatters";
import type { Harvest } from "@/schemas/production";

interface SafraCostEditorAllVisibleProps {
  label?: string;
  description?: string;
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  safras: Harvest[];
  disabled?: boolean;
}

export function SafraCostEditorAllVisible({
  label = "Custos por Safra",
  description,
  values,
  onChange,
  safras,
  disabled = false,
}: SafraCostEditorAllVisibleProps) {
  const [selectAll, setSelectAll] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Sort safras by year
  const sortedSafras = [...safras].sort((a, b) => a.ano_inicio - b.ano_inicio);

  // Filter to show only relevant years (2021-2029)
  const filteredSafras = sortedSafras.filter(
    (safra) => safra.ano_inicio >= 2021 && safra.ano_inicio <= 2029
  );

  // Initialize all safras with 0 if not present
  useEffect(() => {
    const initialValues = { ...values };
    let hasChanges = false;

    filteredSafras.forEach((safra) => {
      if (!(safra.id && safra.id in initialValues)) {
        initialValues[safra.id || ""] = 0;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      onChange(initialValues);
    }
  }, [safras]);

  const handleValueChange = (safraId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    onChange({
      ...values,
      [safraId]: numValue,
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      // Set all values to the same as the first non-zero value, or 1000 as default
      const firstValue = Object.values(values).find((v) => v > 0) || 1000;
      const newValues: Record<string, number> = {};
      filteredSafras.forEach((safra) => {
        newValues[safra.id || ""] = firstValue;
      });
      onChange(newValues);
    } else {
      // Reset all to 0
      const newValues: Record<string, number> = {};
      filteredSafras.forEach((safra) => {
        newValues[safra.id || ""] = 0;
      });
      onChange(newValues);
    }
  };

  const activeCount = Object.values(values).filter((v) => v > 0).length;
  const totalCost = Object.values(values).reduce((sum, val) => sum + val, 0);

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
              id="select-all-costs"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
              disabled={disabled}
            />
            <Label
              htmlFor="select-all-costs"
              className="text-sm font-medium cursor-pointer"
            >
              Aplicar mesmo custo para todas as safras
            </Label>
          </div>

          {/* Safras Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSafras.map((safra) => {
              const value = values[safra.id] || 0;
              const isActive = value > 0;

              return (
                <div
                  key={safra.id}
                  className={`p-4 rounded-lg border ${
                    isActive ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        {safra.nome}
                      </Label>
                      <Badge
                        variant={isActive ? "default" : "outline"}
                        className="text-xs"
                      >
                        {safra.ano_inicio}/{safra.ano_fim}
                      </Badge>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        R$
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        value={value || ""}
                        onChange={(e) =>
                          handleValueChange(safra.id, e.target.value)
                        }
                        placeholder="0,00"
                        disabled={disabled}
                        className={`pl-10 ${isActive ? "border-primary" : ""}`}
                      />
                    </div>

                    {isActive && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(value)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Safras com custos:</span>
              <span className="font-medium">
                {activeCount} de {filteredSafras.length}
              </span>
            </div>
            {activeCount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custo total:</span>
                  <span className="font-medium">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Custo médio por safra:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(totalCost / activeCount)}
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
