"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TrashIcon, PlusCircleIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyField } from "@/components/shared/currency-field";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { Harvest } from "@/schemas/production";

interface SafraCost {
  safra_id: string;
  valor: number;
  isFocused?: boolean;
}

interface SafraCostEditorProps {
  label: string;
  description?: string;
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  safras: Harvest[];
  disabled?: boolean;
}

export function SafraCostEditor({
  label,
  description,
  values = {},
  onChange,
  safras = [],
  disabled = false,
}: SafraCostEditorProps) {
  // Converte o objeto para um array
  const [safraCosts, setSafraCosts] = useState<SafraCost[]>(() => {
    return Object.entries(values || {}).map(([safraId, valor]) => ({
      safra_id: safraId,
      valor: Number(valor),
      isFocused: false
    }));
  });

  // Atualiza o array quando o objeto de valores mudar de fora
  useEffect(() => {
    if (values && typeof values === 'object') {
      const newSafraCosts = Object.entries(values).map(([safraId, valor]) => ({
        safra_id: safraId,
        valor: Number(valor),
        isFocused: false
      }));
      setSafraCosts(newSafraCosts);
    }
  }, [values]);

  // Função para converter array de volta para objeto e notificar mudança
  const updateParent = (newSafraCosts: SafraCost[]) => {
    const newValues = newSafraCosts.reduce((acc, item) => {
      if (item.safra_id && item.valor !== undefined) {
        acc[item.safra_id] = item.valor;
      }
      return acc;
    }, {} as Record<string, number>);
    
    onChange(newValues);
  };

  const addSafraCost = () => {
    const newSafraCosts = [...safraCosts, { safra_id: "", valor: 0, isFocused: false }];
    setSafraCosts(newSafraCosts);
  };

  const removeSafraCost = (index: number) => {
    const newSafraCosts = safraCosts.filter((_, i) => i !== index);
    setSafraCosts(newSafraCosts);
    updateParent(newSafraCosts);
  };

  const updateSafra = (index: number, safraId: string) => {
    const newSafraCosts = [...safraCosts];
    newSafraCosts[index] = { ...newSafraCosts[index], safra_id: safraId };
    setSafraCosts(newSafraCosts);
    updateParent(newSafraCosts);
  };

  const updateValue = (index: number, valor: number) => {
    const newSafraCosts = [...safraCosts];
    newSafraCosts[index] = { ...newSafraCosts[index], valor: valor };
    setSafraCosts(newSafraCosts);
    updateParent(newSafraCosts);
  };

  // Calcular total
  const total = safraCosts.reduce((sum, item) => sum + (item.valor || 0), 0);

  // Filtrar safras já selecionadas
  const getAvailableSafras = (currentIndex: number) => {
    const usedSafraIds = safraCosts
      .map((item, index) => index !== currentIndex ? item.safra_id : null)
      .filter(Boolean) as string[];
    
    return safras.filter(safra => {
      const safraId = safra.id || "";
      return usedSafraIds.indexOf(safraId) === -1;
    });
  };

  const getSafraName = (safraId: string) => {
    const safra = safras.find(s => s.id === safraId) || null;
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
              {formatGenericCurrency(total, "BRL")}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {safraCosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum custo definido ainda</p>
            <p className="text-sm">Clique em "Adicionar Safra" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {safraCosts.map((item, index) => {
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
                      <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                      <CurrencyField
                        defaultValue={item.valor}
                        onChange={(value: number) => updateValue(index, value)}
                        placeholder="R$ 0,00"
                        disabled={disabled}
                        className="h-9"
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSafraCost(index)}
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
          onClick={addSafraCost}
          disabled={disabled || safraCosts.length >= safras.length}
          className="w-full"
        >
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Adicionar Safra
          {safraCosts.length >= safras.length && " (Todas as safras foram adicionadas)"}
        </Button>
      </CardContent>
    </Card>
  );
}