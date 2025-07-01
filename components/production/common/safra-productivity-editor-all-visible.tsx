"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Harvest } from "@/schemas/production";

const UNIT_OPTIONS = [
  { value: 'sc/ha', label: 'Sacas por hectare' },
  { value: '@/ha', label: 'Arrobas por hectare' },
  { value: 'kg/ha', label: 'Quilos por hectare' },
  { value: 'ton/ha', label: 'Toneladas por hectare' },
];

interface SafraProductivityEditorAllVisibleProps {
  label?: string;
  description?: string;
  values: Record<string, { produtividade: number; unidade: string }>;
  onChange: (values: Record<string, { produtividade: number; unidade: string }>) => void;
  safras: Harvest[];
  disabled?: boolean;
}

export function SafraProductivityEditorAllVisible({
  label = "Produtividades por Safra",
  description,
  values,
  onChange,
  safras,
  disabled = false
}: SafraProductivityEditorAllVisibleProps) {
  const [selectAll, setSelectAll] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [defaultUnit, setDefaultUnit] = useState('sc/ha');
  
  // Sort safras by year
  const sortedSafras = [...safras].sort((a, b) => a.ano_inicio - b.ano_inicio);
  
  // Filter to show only relevant years (2021-2029)
  const filteredSafras = sortedSafras.filter(safra => 
    safra.ano_inicio >= 2021 && safra.ano_inicio <= 2029
  );

  // Initialize all safras with default values if not present
  useEffect(() => {
    const initialValues = { ...values };
    let hasChanges = false;
    
    filteredSafras.forEach(safra => {
      if (safra.id && !(safra.id in initialValues)) {
        initialValues[safra.id] = { produtividade: 0, unidade: defaultUnit };
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      onChange(initialValues);
    }
  }, [safras, defaultUnit]);

  const handleProductivityChange = (safraId: string, produtividade: string) => {
    const numValue = parseFloat(produtividade) || 0;
    onChange({
      ...values,
      [safraId]: {
        ...values[safraId],
        produtividade: numValue
      }
    });
  };

  const handleUnitChange = (safraId: string, unidade: string) => {
    onChange({
      ...values,
      [safraId]: {
        ...values[safraId],
        unidade
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      // Set all values to the same as the first non-zero value, or 60 as default
      const firstValue = Object.values(values).find(v => v.produtividade > 0);
      const defaultProdutividade = firstValue?.produtividade || 60;
      const defaultUnidade = firstValue?.unidade || defaultUnit;
      
      const newValues: Record<string, { produtividade: number; unidade: string }> = {};
      filteredSafras.forEach(safra => {
        if (safra.id) {
          newValues[safra.id] = {
            produtividade: defaultProdutividade,
            unidade: defaultUnidade
          };
        }
      });
      onChange(newValues);
    } else {
      // Reset all to 0
      const newValues: Record<string, { produtividade: number; unidade: string }> = {};
      filteredSafras.forEach(safra => {
        if (safra.id) {
          newValues[safra.id] = {
            produtividade: 0,
            unidade: values[safra.id]?.unidade || defaultUnit
          };
        }
      });
      onChange(newValues);
    }
  };

  const handleApplyUnitToAll = () => {
    const newValues = { ...values };
    Object.keys(newValues).forEach(safraId => {
      newValues[safraId] = {
        ...newValues[safraId],
        unidade: defaultUnit
      };
    });
    onChange(newValues);
  };

  const activeCount = Object.values(values).filter(v => v.produtividade > 0).length;

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
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={activeCount > 0 ? "default" : "secondary"}>
              {activeCount} de {filteredSafras.length} safras
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              type="button"
            >
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {!collapsed && (
        <CardContent className="space-y-4">
          {/* Select All and Default Unit Options */}
          <div className="space-y-3 pb-3 border-b">
            <div className="flex items-center space-x-2">
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
                Aplicar mesma produtividade para todas as safras
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-sm">Unidade padrão:</Label>
              <Select
                value={defaultUnit}
                onValueChange={setDefaultUnit}
                disabled={disabled}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplyUnitToAll}
                disabled={disabled}
              >
                Aplicar a todas
              </Button>
            </div>
          </div>

          {/* Safras Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSafras.map((safra) => {
              const value = safra.id ? values[safra.id] || { produtividade: 0, unidade: defaultUnit } : { produtividade: 0, unidade: defaultUnit };
              const isActive = value.produtividade > 0;
              
              return (
                <div 
                  key={safra.id}
                  className={`p-4 rounded-lg border ${
                    isActive ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="space-y-3">
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
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Produtividade
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={value.produtividade || ""}
                          onChange={(e) => safra.id && handleProductivityChange(safra.id, e.target.value)}
                          placeholder="0.00"
                          disabled={disabled}
                          className={`${isActive ? 'border-primary' : ''}`}
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Unidade
                        </Label>
                        <Select
                          value={value.unidade}
                          onValueChange={(unit) => safra.id && handleUnitChange(safra.id, unit)}
                          disabled={disabled}
                        >
                          <SelectTrigger className={`${isActive ? 'border-primary' : ''}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Safras com produtividade:</span>
              <span className="font-medium">{activeCount} de {filteredSafras.length}</span>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}