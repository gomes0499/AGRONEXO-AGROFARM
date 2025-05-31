"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TrashIcon, PlusCircleIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Harvest } from "@/schemas/production";

interface SafraProductivity {
  safra_id: string;
  produtividade: number;
  unidade: string;
  isFocused?: boolean;
}

interface SafraProductivityEditorProps {
  label: string;
  description?: string;
  values: Record<string, { produtividade: number; unidade: string }>;
  onChange: (values: Record<string, { produtividade: number; unidade: string }>) => void;
  safras: Harvest[];
  disabled?: boolean;
}

const UNIT_LABELS = {
  'sc/ha': 'Sacas por hectare',
  '@/ha': 'Arrobas por hectare', 
  'kg/ha': 'Quilos por hectare',
  'ton/ha': 'Toneladas por hectare',
};

export function SafraProductivityEditor({
  label,
  description,
  values = {},
  onChange,
  safras = [],
  disabled = false,
}: SafraProductivityEditorProps) {
  // Converte o objeto para um array
  const [safraProductivities, setSafraProductivities] = useState<SafraProductivity[]>(() => {
    return Object.entries(values || {}).map(([safraId, data]) => ({
      safra_id: safraId,
      produtividade: Number(data.produtividade),
      unidade: data.unidade,
      isFocused: false
    }));
  });

  // Atualiza o array quando o objeto de valores mudar de fora
  useEffect(() => {
    if (values && typeof values === 'object') {
      const newSafraProductivities = Object.entries(values).map(([safraId, data]) => ({
        safra_id: safraId,
        produtividade: Number(data.produtividade),
        unidade: data.unidade,
        isFocused: false
      }));
      setSafraProductivities(newSafraProductivities);
    }
  }, [values]);

  // Função para converter array de volta para objeto e notificar mudança
  const updateParent = (newSafraProductivities: SafraProductivity[]) => {
    // Só envia para o pai as produtividades que têm uma safra selecionada
    const newValues = newSafraProductivities.reduce((acc, item) => {
      if (item.safra_id && item.unidade) {
        acc[item.safra_id] = { 
          produtividade: item.produtividade, 
          unidade: item.unidade 
        };
      }
      return acc;
    }, {} as Record<string, { produtividade: number; unidade: string }>);
    
    onChange(newValues);
  };

  const addSafraProductivity = () => {
    const newSafraProductivities = [...safraProductivities, { 
      safra_id: "", 
      produtividade: 0, 
      unidade: "sc/ha",
      isFocused: false 
    }];
    setSafraProductivities(newSafraProductivities);
  };

  const removeSafraProductivity = (index: number) => {
    const newSafraProductivities = safraProductivities.filter((_, i) => i !== index);
    setSafraProductivities(newSafraProductivities);
    updateParent(newSafraProductivities);
  };

  const updateSafra = (index: number, safraId: string) => {
    const newSafraProductivities = [...safraProductivities];
    newSafraProductivities[index] = { ...newSafraProductivities[index], safra_id: safraId };
    setSafraProductivities(newSafraProductivities);
    updateParent(newSafraProductivities);
  };

  const updateProductivity = (index: number, rawValue: string) => {
    const newSafraProductivities = [...safraProductivities];
    
    if (rawValue === "") {
      newSafraProductivities[index] = { ...newSafraProductivities[index], produtividade: 0 };
    } else {
      const numericValue = parseFloat(rawValue);
      if (!isNaN(numericValue)) {
        newSafraProductivities[index] = { ...newSafraProductivities[index], produtividade: numericValue };
      }
    }
    
    setSafraProductivities(newSafraProductivities);
    updateParent(newSafraProductivities);
  };

  const updateUnit = (index: number, unit: string) => {
    const newSafraProductivities = [...safraProductivities];
    newSafraProductivities[index] = { ...newSafraProductivities[index], unidade: unit };
    setSafraProductivities(newSafraProductivities);
    updateParent(newSafraProductivities);
  };

  const handleFocus = (index: number) => {
    const newSafraProductivities = [...safraProductivities];
    newSafraProductivities[index] = { ...newSafraProductivities[index], isFocused: true };
    setSafraProductivities(newSafraProductivities);
  };

  const handleBlur = (index: number) => {
    const newSafraProductivities = [...safraProductivities];
    newSafraProductivities[index] = { ...newSafraProductivities[index], isFocused: false };
    setSafraProductivities(newSafraProductivities);
  };

  // Filtrar safras já selecionadas
  const getAvailableSafras = (currentIndex: number) => {
    const usedSafraIds = safraProductivities
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
            <p className="text-sm text-muted-foreground">Total de safras</p>
            <p className="text-lg font-semibold">
              {safraProductivities.filter(p => p.produtividade > 0).length}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {safraProductivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma produtividade definida ainda</p>
            <p className="text-sm">Clique em "Adicionar Safra" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {safraProductivities.map((item, index) => {
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
                      <Label className="text-xs text-muted-foreground">Unidade</Label>
                      <Select
                        value={item.unidade}
                        onValueChange={(value) => updateUnit(index, value)}
                        disabled={disabled}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(UNIT_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Produtividade</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.produtividade}
                        onChange={(e) => updateProductivity(index, e.target.value)}
                        disabled={disabled}
                        className="h-9"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSafraProductivity(index)}
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
          onClick={addSafraProductivity}
          disabled={disabled || safraProductivities.length >= safras.length}
          className="w-full"
        >
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Adicionar Safra
          {safraProductivities.length >= safras.length && " (Todas as safras foram adicionadas)"}
        </Button>
      </CardContent>
    </Card>
  );
}