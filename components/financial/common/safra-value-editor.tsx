"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TrashIcon, PlusCircleIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatGenericCurrency, parseFormattedNumber, CurrencyType } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

interface SafraValue {
  safra_id: string;
  valor: number;
  isFocused?: boolean;
}

interface SafraValueEditorProps {
  values: Record<string, number> | undefined | null;
  onChange: (values: Record<string, number>) => void;
  organizacaoId?: string;
  label?: string;
  description?: string;
  safras?: Array<{ id: string | undefined; nome: string }>;
  currency?: CurrencyType;
  disabled?: boolean;
}

export function SafraValueEditor({
  values = {},
  onChange,
  organizacaoId,
  label = "Valores por safra",
  description,
  safras: providedSafras,
  currency = "BRL",
  disabled = false,
}: SafraValueEditorProps) {
  const [safras, setSafras] = useState<Array<{ id: string | undefined; nome: string }>>([]);
  const [isLoadingSafras, setIsLoadingSafras] = useState(!providedSafras);
  
  // Converte o objeto para um array
  const [safraValues, setSafraValues] = useState<SafraValue[]>(() => {
    return Object.entries(values || {}).map(([safraId, valor]) => ({
      safra_id: safraId,
      valor: Number(valor),
      isFocused: false
    }));
  });

  // Carregar as safras disponíveis
  useEffect(() => {
    // Se temos safras fornecidas, usá-las diretamente
    if (providedSafras && providedSafras.length > 0) {
      setSafras(providedSafras);
      setIsLoadingSafras(false);
      return;
    }
    
    const fetchSafras = async () => {
      try {
        // Simulando dados de safra para o exemplo - em produção usaria a API
        const mockSafras = [
          { id: "2023-2024", nome: "Safra 2023/2024" },
          { id: "2024-2025", nome: "Safra 2024/2025" },
          { id: "2025-2026", nome: "Safra 2025/2026" },
          { id: "2026-2027", nome: "Safra 2026/2027" },
          { id: "2027-2028", nome: "Safra 2027/2028" },
        ];
        setSafras(mockSafras);
      } catch (error) {
        console.error("Erro ao carregar safras:", error);
      } finally {
        setIsLoadingSafras(false);
      }
    };

    fetchSafras();
  }, [organizacaoId, providedSafras]);

  // Atualiza o array quando o objeto de valores mudar de fora
  useEffect(() => {
    if (values && typeof values === 'object') {
      const newSafraValues = Object.entries(values).map(([safraId, valor]) => ({
        safra_id: safraId,
        valor: Number(valor),
        isFocused: false
      }));
      setSafraValues(newSafraValues);
    }
  }, [values]);

  // Função para converter array de volta para objeto e notificar mudança
  const updateParent = (newSafraValues: SafraValue[]) => {
    const newValues = newSafraValues.reduce((acc: Record<string, number>, item) => {
      if (item.safra_id && item.valor !== undefined) {
        acc[item.safra_id] = item.valor;
      }
      return acc;
    }, {} as Record<string, number>);
    
    onChange(newValues);
  };

  const addSafraValue = () => {
    const newSafraValues = [...safraValues, { safra_id: "", valor: 0, isFocused: false }];
    setSafraValues(newSafraValues);
  };

  const removeSafraValue = (index: number) => {
    const newSafraValues = safraValues.filter((_, i) => i !== index);
    setSafraValues(newSafraValues);
    updateParent(newSafraValues);
  };

  const updateSafra = (index: number, safraId: string) => {
    const newSafraValues = [...safraValues];
    newSafraValues[index] = { ...newSafraValues[index], safra_id: safraId };
    setSafraValues(newSafraValues);
    updateParent(newSafraValues);
  };

  const updateValue = (index: number, rawValue: string) => {
    const newSafraValues = [...safraValues];
    
    if (rawValue === "") {
      newSafraValues[index] = { ...newSafraValues[index], valor: 0 };
    } else {
      const numericValue = parseFormattedNumber(rawValue);
      if (numericValue !== null && !isNaN(numericValue)) {
        newSafraValues[index] = { ...newSafraValues[index], valor: numericValue };
      }
    }
    
    setSafraValues(newSafraValues);
    updateParent(newSafraValues);
  };

  const handleFocus = (index: number) => {
    const newSafraValues = [...safraValues];
    newSafraValues[index] = { ...newSafraValues[index], isFocused: true };
    setSafraValues(newSafraValues);
  };

  const handleBlur = (index: number) => {
    const newSafraValues = [...safraValues];
    newSafraValues[index] = { ...newSafraValues[index], isFocused: false };
    setSafraValues(newSafraValues);
  };

  // Calcular total
  const total = safraValues.reduce((sum: number, item) => sum + (item.valor || 0), 0);

  // Filtrar safras já selecionadas
  const getAvailableSafras = (currentIndex: number) => {
    const usedSafraIds = safraValues
      .map((item, index) => index !== currentIndex ? item.safra_id : null)
      .filter(Boolean) as string[];
    
    return safras.filter(safra => {
      const safraId = safra.id || "";
      return !usedSafraIds.some(id => id === safraId);
    });
  };

  const getSafraName = (safraId: string) => {
    const safra = safras.find(s => s.id === safraId);
    return safra ? safra.nome : "Safra não encontrada";
  };

  if (isLoadingSafras) {
    return <div className="text-sm text-muted-foreground">Carregando safras...</div>;
  }

  return (
    <Card className="w-full">
      <CardContent className="space-y-3 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm">
            Total: <strong>{formatGenericCurrency(total, currency)}</strong>
          </span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        
        {safraValues.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Clique em "Adicionar Safra" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {safraValues.map((item, index) => {
              const availableSafras = getAvailableSafras(index);
              
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
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
                    <Label className="text-xs text-muted-foreground">Valor</Label>
                    <Input
                      type="text"
                      value={
                        item.isFocused
                          ? item.valor.toString()
                          : formatGenericCurrency(item.valor, currency)
                      }
                      onChange={(e) => updateValue(index, e.target.value)}
                      onFocus={() => handleFocus(index)}
                      onBlur={() => handleBlur(index)}
                      className={cn(
                        "h-9",
                        item.valor < 0 && "text-red-600 border-red-300"
                      )}
                      placeholder="0,00"
                      disabled={disabled}
                    />
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSafraValue(index)}
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                    disabled={disabled}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
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
          onClick={addSafraValue}
          disabled={disabled || safraValues.length >= safras.length}
          className="w-full"
        >
          <PlusCircleIcon className="h-4 w-4 mr-2" />
          Adicionar Safra
          {safraValues.length >= safras.length && " (Todas as safras já adicionadas)"}
        </Button>
      </CardContent>
    </Card>
  );
}