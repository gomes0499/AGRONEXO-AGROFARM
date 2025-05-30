"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TrashIcon, PlusCircleIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatArea } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { Harvest } from "@/schemas/production";

interface SafraArea {
  safra_id: string;
  area: number;
  isFocused?: boolean;
}

interface SafraAreaEditorProps {
  label: string;
  description?: string;
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  safras: Harvest[];
  disabled?: boolean;
}


export function SafraAreaEditor({
  label,
  description,
  values = {},
  onChange,
  safras = [],
  disabled = false,
}: SafraAreaEditorProps) {
  // Converte o objeto para um array
  const [safraAreas, setSafraAreas] = useState<SafraArea[]>(() => {
    return Object.entries(values || {}).map(([safraId, area]) => ({
      safra_id: safraId,
      area: Number(area),
      isFocused: false
    }));
  });

  // Atualiza o array quando o objeto de valores mudar de fora
  useEffect(() => {
    if (values && typeof values === 'object') {
      const newSafraAreas = Object.entries(values).map(([safraId, area]) => ({
        safra_id: safraId,
        area: Number(area),
        isFocused: false
      }));
      setSafraAreas(newSafraAreas);
    }
  }, [values]);

  // Função para converter array de volta para objeto e notificar mudança
  const updateParent = (newSafraAreas: SafraArea[]) => {
    const newValues = newSafraAreas.reduce((acc, item) => {
      if (item.safra_id && item.area !== undefined) {
        acc[item.safra_id] = item.area;
      }
      return acc;
    }, {} as Record<string, number>);
    
    onChange(newValues);
  };

  const addSafraArea = () => {
    const newSafraAreas = [...safraAreas, { safra_id: "", area: 0, isFocused: false }];
    setSafraAreas(newSafraAreas);
  };

  const removeSafraArea = (index: number) => {
    const newSafraAreas = safraAreas.filter((_, i) => i !== index);
    setSafraAreas(newSafraAreas);
    updateParent(newSafraAreas);
  };

  const updateSafra = (index: number, safraId: string) => {
    const newSafraAreas = [...safraAreas];
    newSafraAreas[index] = { ...newSafraAreas[index], safra_id: safraId };
    setSafraAreas(newSafraAreas);
    updateParent(newSafraAreas);
  };

  const updateArea = (index: number, rawValue: string) => {
    const newSafraAreas = [...safraAreas];
    
    if (rawValue === "") {
      newSafraAreas[index] = { ...newSafraAreas[index], area: 0 };
    } else {
      const numericValue = parseFloat(rawValue.replace(",", "."));
      if (!isNaN(numericValue)) {
        newSafraAreas[index] = { ...newSafraAreas[index], area: numericValue };
      }
    }
    
    setSafraAreas(newSafraAreas);
    updateParent(newSafraAreas);
  };

  const handleFocus = (index: number) => {
    const newSafraAreas = [...safraAreas];
    newSafraAreas[index] = { ...newSafraAreas[index], isFocused: true };
    setSafraAreas(newSafraAreas);
  };

  const handleBlur = (index: number) => {
    const newSafraAreas = [...safraAreas];
    newSafraAreas[index] = { ...newSafraAreas[index], isFocused: false };
    setSafraAreas(newSafraAreas);
  };

  // Calcular total de área
  const totalArea = safraAreas.reduce((sum, item) => sum + (item.area || 0), 0);

  // Filtrar safras já selecionadas
  const getAvailableSafras = (currentIndex: number) => {
    const usedSafraIds = safraAreas
      .map((item, index) => index !== currentIndex ? item.safra_id : null)
      .filter(Boolean);
    
    return safras.filter(safra => !usedSafraIds.includes(safra.id || ""));
  };

  const getSafraName = (safraId: string) => {
    const safra = safras.find(s => s.id === safraId);
    return safra ? safra.nome : "Safra não encontrada";
  };


  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">{label}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">
              {formatArea(totalArea)}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {safraAreas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma área definida ainda</p>
            <p className="text-sm">Clique em "Adicionar Safra" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {safraAreas.map((item, index) => {
              const availableSafras = getAvailableSafras(index);
              
              return (
                <div key={index}>
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Safra</Label>
                      <Select
                        value={item.safra_id}
                        onValueChange={(value) => updateSafra(index, value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Selecione a safra" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Mostrar a safra atualmente selecionada mesmo se não estiver na lista de disponíveis */}
                          {item.safra_id && !availableSafras.find(s => s.id === item.safra_id) && (
                            <SelectItem value={item.safra_id}>
                              {getSafraName(item.safra_id)}
                            </SelectItem>
                          )}
                          {availableSafras.map((safra) => (
                            <SelectItem key={safra.id} value={safra.id || ""}>
                              {safra.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Área (hectares)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={
                          item.isFocused
                            ? item.area.toString()
                            : item.area.toFixed(2)
                        }
                        onChange={(e) => updateArea(index, e.target.value)}
                        onFocus={() => handleFocus(index)}
                        onBlur={() => handleBlur(index)}
                        disabled={disabled}
                        className="h-9"
                        placeholder="0,00"
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSafraArea(index)}
                      disabled={disabled}
                      className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
        
        <Separator />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSafraArea}
          disabled={disabled || safraAreas.length >= safras.length}
          className="w-full"
        >
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Adicionar Safra
          {safraAreas.length >= safras.length && " (Todas as safras foram adicionadas)"}
        </Button>
      </CardContent>
    </Card>
  );
}