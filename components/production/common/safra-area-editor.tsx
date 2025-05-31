"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TrashIcon, PlusCircleIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatArea } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { Harvest } from "@/schemas/production";
import { Badge } from "@/components/ui/badge";

interface SafraArea {
  safra_id: string;
  area: number;
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
      area: Number(area)
    }));
  });

  // Atualiza o array quando o objeto de valores mudar de fora
  useEffect(() => {
    if (values && typeof values === 'object') {
      const newSafraAreas = Object.entries(values).map(([safraId, area]) => ({
        safra_id: safraId,
        area: Number(area)
      }));
      setSafraAreas(newSafraAreas);
    }
  }, [values]);

  // Função para converter array de volta para objeto e notificar mudança
  const updateParent = (newSafraAreas: SafraArea[]) => {
    // Primeiro, limpe o objeto de valores
    const newValues: Record<string, number> = {};
    
    // Agora, adicione apenas as entradas válidas
    newSafraAreas.forEach(item => {
      if (item.safra_id && item.area !== undefined) {
        newValues[item.safra_id] = Number(item.area);
      }
    });
    
    // Notifique o componente pai
    onChange(newValues);
  };

  const addSafraArea = () => {
    const newSafraAreas = [...safraAreas, { safra_id: "", area: 0 }];
    setSafraAreas(newSafraAreas);
  };

  const removeSafraArea = (index: number) => {
    // Remove apenas a área específica clicada
    const newSafraAreas = [...safraAreas];
    newSafraAreas.splice(index, 1);
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

  const getSafraPeriodo = (safraId: string) => {
    const safra = safras.find(s => s.id === safraId);
    if (!safra) return "";
    return `${safra.ano_inicio}/${safra.ano_fim}`;
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
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="font-medium w-[40%]">Safra</TableHead>
                  <TableHead className="font-medium w-[25%]">Período</TableHead>
                  <TableHead className="font-medium w-[25%]">Área (ha)</TableHead>
                  <TableHead className="font-medium w-[10%] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safraAreas.map((item, index) => {
                  const availableSafras = getAvailableSafras(index);
                  const safraName = item.safra_id ? getSafraName(item.safra_id) : "";
                  const periodo = item.safra_id ? getSafraPeriodo(item.safra_id) : "";
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>
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
                                {safraName}
                              </SelectItem>
                            )}
                            {availableSafras.map((safra) => (
                              <SelectItem key={safra.id} value={safra.id || ""}>
                                {safra.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {periodo ? (
                          <Badge variant="outline" className="bg-muted/30">
                            {periodo}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={item.area || ""}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d.,]/g, "").replace(/,/g, ".");
                            updateArea(index, value);
                          }}
                          disabled={disabled}
                          className="h-9"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            // Evitar propagação do evento
                            e.stopPropagation();
                            e.preventDefault();
                            
                            // Remover apenas esta área específica
                            removeSafraArea(index);
                          }}
                          disabled={disabled}
                          className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Total Row */}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={2} className="font-medium">
                    Total
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatArea(totalArea)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
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