"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Harvest } from "@/schemas/production";

interface SafraEditorAllVisibleProps {
  label?: string;
  description?: string;
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  safras: Harvest[];
  disabled?: boolean;
  unitLabel?: string;
  placeholder?: string;
}

export function SafraEditorAllVisible({
  label = "Valores por Safra",
  description,
  values,
  onChange,
  safras,
  disabled = false,
  unitLabel = "Área (ha)",
  placeholder = "0",
}: SafraEditorAllVisibleProps) {
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
      // Set all values to the same as the first non-zero value, or 100 as default
      const firstValue = Object.values(values).find((v) => v > 0) || 100;
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
              id="select-all"
              checked={selectAll}
              onCheckedChange={handleSelectAll}
              disabled={disabled}
            />
            <Label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer"
            >
              Aplicar mesmo valor para todas as safras
            </Label>
          </div>

          {/* Safras Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSafras.map((safra) => {
              const value = values[safra.id || ""] || 0;
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

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={value || ""}
                        onChange={(e) =>
                          handleValueChange(safra.id || "", e.target.value)
                        }
                        placeholder={placeholder}
                        disabled={disabled}
                        className={`${isActive ? "border-primary" : ""}`}
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {unitLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Total de safras ativas:
              </span>
              <span className="font-medium">{activeCount}</span>
            </div>
            {activeCount > 0 && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">
                  Total {unitLabel}:
                </span>
                <span className="font-medium">
                  {Object.values(values)
                    .reduce((sum, val) => sum + val, 0)
                    .toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
