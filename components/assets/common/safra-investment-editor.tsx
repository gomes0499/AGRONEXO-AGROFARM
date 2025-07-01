"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TrashIcon, PlusCircleIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils/formatters";

interface SafraInvestment {
  safra_id: string;
  quantidade: number;
  valor_unitario: number;
  isFocused?: boolean;
}

interface SafraInvestmentEditorProps {
  label: string;
  description?: string;
  values: Record<string, { quantidade: number; valor_unitario: number }>;
  onChange: (values: Record<string, { quantidade: number; valor_unitario: number }>) => void;
  safras: Array<{ id: string; nome: string; ano_inicio?: number; ano_fim?: number }>;
  disabled?: boolean;
}

export function SafraInvestmentEditor({
  label,
  description,
  values = {},
  onChange,
  safras = [],
  disabled = false,
}: SafraInvestmentEditorProps) {
  // Converte o objeto para um array
  const [safraInvestments, setSafraInvestments] = useState<SafraInvestment[]>(() => {
    return Object.entries(values || {}).map(([safraId, data]) => ({
      safra_id: safraId,
      quantidade: Number(data.quantidade),
      valor_unitario: Number(data.valor_unitario),
      isFocused: false
    }));
  });

  // Atualiza o array quando o objeto de valores mudar de fora
  useEffect(() => {
    if (values && typeof values === 'object') {
      const newSafraInvestments = Object.entries(values).map(([safraId, data]) => ({
        safra_id: safraId,
        quantidade: Number(data.quantidade),
        valor_unitario: Number(data.valor_unitario),
        isFocused: false
      }));
      setSafraInvestments(newSafraInvestments);
    }
  }, [values]);

  // Função para converter array de volta para objeto e notificar mudança
  const updateParent = (newSafraInvestments: SafraInvestment[]) => {
    // Só envia para o pai os investimentos que têm uma safra selecionada
    const newValues = newSafraInvestments.reduce((acc, item) => {
      if (item.safra_id && (item.quantidade > 0 || item.valor_unitario > 0)) {
        acc[item.safra_id] = { 
          quantidade: item.quantidade, 
          valor_unitario: item.valor_unitario 
        };
      }
      return acc;
    }, {} as Record<string, { quantidade: number; valor_unitario: number }>);
    
    onChange(newValues);
  };

  const addSafraInvestment = () => {
    const newSafraInvestments = [...safraInvestments, { 
      safra_id: "", 
      quantidade: 1, 
      valor_unitario: 0,
      isFocused: false 
    }];
    setSafraInvestments(newSafraInvestments);
  };

  const removeSafraInvestment = (index: number) => {
    const newSafraInvestments = safraInvestments.filter((_, i) => i !== index);
    setSafraInvestments(newSafraInvestments);
    updateParent(newSafraInvestments);
  };

  const updateSafra = (index: number, safraId: string) => {
    const newSafraInvestments = [...safraInvestments];
    newSafraInvestments[index] = { ...newSafraInvestments[index], safra_id: safraId };
    setSafraInvestments(newSafraInvestments);
    updateParent(newSafraInvestments);
  };

  const updateQuantidade = (index: number, rawValue: string) => {
    const newSafraInvestments = [...safraInvestments];
    
    if (rawValue === "") {
      newSafraInvestments[index] = { ...newSafraInvestments[index], quantidade: 0 };
    } else {
      const numericValue = parseInt(rawValue);
      if (!isNaN(numericValue) && numericValue >= 0) {
        newSafraInvestments[index] = { ...newSafraInvestments[index], quantidade: numericValue };
      }
    }
    
    setSafraInvestments(newSafraInvestments);
    updateParent(newSafraInvestments);
  };

  const updateValorUnitario = (index: number, rawValue: string) => {
    const newSafraInvestments = [...safraInvestments];
    
    if (rawValue === "") {
      newSafraInvestments[index] = { ...newSafraInvestments[index], valor_unitario: 0 };
    } else {
      const numericValue = parseFloat(rawValue);
      if (!isNaN(numericValue) && numericValue >= 0) {
        newSafraInvestments[index] = { ...newSafraInvestments[index], valor_unitario: numericValue };
      }
    }
    
    setSafraInvestments(newSafraInvestments);
    updateParent(newSafraInvestments);
  };

  // Filtrar safras já selecionadas
  const getAvailableSafras = (currentIndex: number) => {
    const usedSafraIds = safraInvestments
      .map((item, index) => index !== currentIndex ? item.safra_id : null)
      .filter(Boolean);
    
    return safras.filter(safra => !usedSafraIds.includes(safra.id || ""));
  };

  const getSafraName = (safraId: string) => {
    const safra = safras.find(s => s.id === safraId);
    return safra ? safra.nome : "Safra não encontrada";
  };

  // Calcular totais
  const totalQuantidade = safraInvestments.reduce((sum, item) => sum + item.quantidade, 0);
  const totalValor = safraInvestments.reduce((sum, item) => sum + (item.quantidade * item.valor_unitario), 0);

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
            <p className="text-sm text-muted-foreground">Total investido</p>
            <p className="text-lg font-semibold">
              {formatCurrency(totalValor)}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {safraInvestments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum investimento definido ainda</p>
            <p className="text-sm">Clique em "Adicionar Safra" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {safraInvestments.map((item, index) => {
              const availableSafras = getAvailableSafras(index);
              const valorTotal = item.quantidade * item.valor_unitario;
              
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
                      <Label className="text-xs text-muted-foreground">Quantidade</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantidade}
                        onChange={(e) => updateQuantidade(index, e.target.value)}
                        disabled={disabled}
                        className="h-9"
                        placeholder="0"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Valor Unitário</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.valor_unitario}
                        onChange={(e) => updateValorUnitario(index, e.target.value)}
                        disabled={disabled}
                        className="h-9"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Total</Label>
                      <div className="h-9 px-3 py-2 bg-muted rounded-md flex items-center text-sm">
                        {formatCurrency(valorTotal)}
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSafraInvestment(index)}
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
        
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSafraInvestment}
            disabled={disabled || safraInvestments.length >= safras.length}
            className="flex-1 mr-2"
          >
            <PlusCircleIcon className="h-4 w-4 mr-2" />
            Adicionar Safra
            {safraInvestments.length >= safras.length && " (Todas as safras foram adicionadas)"}
          </Button>
          
          {safraInvestments.length > 0 && (
            <div className="text-right text-sm text-muted-foreground">
              <div>Total: {totalQuantidade} unidades</div>
              <div className="font-medium text-foreground">{formatCurrency(totalValor)}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}