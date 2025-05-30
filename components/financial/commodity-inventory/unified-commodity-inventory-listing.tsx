"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Save, Wheat, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatters";

// Tipos baseados no novo schema (CSV)
type CommodityInventoryType = {
  id: string;
  organizacao_id: string;
  safra_id: string;
  commodity: string;
  valores_totais_por_ano: Record<string, number>; // safra_id -> valor
  unidade: string;
  data_avaliacao: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
};

type UnifiedCommodityInventoryListingProps = {
  commodityInventories: CommodityInventoryType[] | undefined;
  safras: Array<{ id: string; nome: string; ano_inicio: number }>;
};

export function UnifiedCommodityInventoryListing({ 
  commodityInventories = [],
  safras = []
}: UnifiedCommodityInventoryListingProps) {
  
  // Se não há estoques de commodities, mostrar estado vazio
  if (commodityInventories.length === 0) {
    return (
      <Card className="w-full shadow-sm border-muted/80">
        <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <Wheat className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Estoques de Commodities</CardTitle>
              <CardDescription className="text-white/80">
                Gerencie estoques de grãos e produtos agrícolas por safra
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="mt-4">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
            <p className="text-amber-700 mb-4">
              Não encontramos estoques de commodities configurados. Se você acabou de criar as tabelas, tente recarregar a página para inicializar os valores padrão.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Recarregar Página
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const [editingState, setEditingState] = useState<
    Record<string, Record<string, string>>
  >({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  // Criar mapeamento de safra_id para ano
  const safraMap: Record<string, { nome: string; ano: number }> = {};
  safras.forEach(safra => {
    safraMap[safra.id] = { nome: safra.nome, ano: safra.ano_inicio };
  });

  // Anos que queremos mostrar (2021-2029, sem 2020 e 2030)
  const yearsToShow = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029];

  // Inicializar estado de edição
  const initEditState = (commodity: CommodityInventoryType) => {
    if (!editingState[commodity.id]) {
      const editValues: Record<string, string> = {};
      
      yearsToShow.forEach(year => {
        const safra = safras.find(s => s.ano_inicio === year);
        if (safra && commodity.valores_totais_por_ano[safra.id]) {
          editValues[`value${year}`] = commodity.valores_totais_por_ano[safra.id].toString();
        } else {
          editValues[`value${year}`] = "0";
        }
      });

      setEditingState(prev => ({
        ...prev,
        [commodity.id]: editValues,
      }));
    }

    if (isLoading[commodity.id] === undefined) {
      setIsLoading(prev => ({
        ...prev,
        [commodity.id]: false,
      }));
    }
  };

  // Manipular mudança de input
  const handleInputChange = (id: string, field: string, value: string) => {
    setEditingState(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  };

  // Salvar mudanças
  const handleSave = async (commodity: CommodityInventoryType) => {
    try {
      setIsLoading(prev => ({
        ...prev,
        [commodity.id]: true,
      }));

      const editValues = editingState[commodity.id];
      if (!editValues) return;

      // Preparar novos valores por ano
      const newValoresPorAno: Record<string, number> = {};
      
      yearsToShow.forEach(year => {
        const safra = safras.find(s => s.ano_inicio === year);
        if (safra) {
          const value = parseFloat(editValues[`value${year}`] || "0");
          if (!isNaN(value) && value > 0) {
            newValoresPorAno[safra.id] = value;
          }
        }
      });

      // Atualizar localmente (aqui seria a chamada para API)
      commodity.valores_totais_por_ano = newValoresPorAno;

      toast.success("Estoque de commodity atualizado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsLoading(prev => ({
        ...prev,
        [commodity.id]: false,
      }));
    }
  };

  // Obter valor para um ano específico
  const getValueForYear = (commodity: CommodityInventoryType, year: number): number => {
    const safra = safras.find(s => s.ano_inicio === year);
    if (safra && commodity.valores_totais_por_ano[safra.id]) {
      return commodity.valores_totais_por_ano[safra.id];
    }
    return 0;
  };

  // Obter badge da commodity
  const getCommodityBadge = (commodityType: string) => {
    const commodityLabels: Record<string, string> = {
      "SOJA": "Soja",
      "ALGODAO": "Algodão",
      "MILHO": "Milho",
      "ARROZ": "Arroz",
      "SORGO": "Sorgo",
      "CAFE": "Café",
      "CACAU": "Cacau",
      "TRIGO": "Trigo",
      "FEIJAO": "Feijão",
      "GIRASSOL": "Girassol",
      "AMENDOIM": "Amendoim",
    };

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Wheat className="h-3 w-3" />
        {commodityLabels[commodityType] || commodityType}
      </Badge>
    );
  };

  const renderTable = () => {
    return (
      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="bg-primary hover:bg-primary">
            <TableHead className="font-semibold text-primary-foreground rounded-tl-md w-[160px] bg-primary">
              Commodity
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground w-[80px] bg-primary">
              Unidade
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2021/22
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2022/23
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2023/24
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2024/25
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2025/26
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2026/27
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2027/28
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2028/29
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2029/30
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[60px] bg-primary">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {commodityInventories.map((commodity) => {
            initEditState(commodity);

            return (
              <TableRow key={commodity.id}>
                <TableCell className="font-medium">
                  {getCommodityBadge(commodity.commodity)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {commodity.unidade}
                </TableCell>
                {yearsToShow.map(year => (
                  <TableCell key={year}>
                    {formatCurrencyCompact(getValueForYear(commodity, year))}
                  </TableCell>
                ))}
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-auto p-4">
                      <div className="grid gap-4 w-[800px] max-h-[500px] overflow-y-auto">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">
                            Editar Valores - {commodity.commodity}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Atualize os valores por safra em R$ (reais).
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {yearsToShow.map((year) => (
                            <div key={year} className="space-y-2">
                              <Label htmlFor={`${commodity.id}-value${year}`}>
                                {year}/{String(year + 1).slice(-2)} (R$)
                              </Label>
                              <Input
                                id={`${commodity.id}-value${year}`}
                                type="number"
                                value={
                                  editingState[commodity.id]?.[`value${year}`] ||
                                  getValueForYear(commodity, year).toString()
                                }
                                onChange={(e) =>
                                  handleInputChange(
                                    commodity.id,
                                    `value${year}`,
                                    e.target.value
                                  )
                                }
                                step="0.01"
                              />
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => handleSave(commodity)}
                          disabled={isLoading[commodity.id]}
                          className="w-full"
                        >
                          {isLoading[commodity.id] ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Salvar Alterações
                            </>
                          )}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card className="w-full shadow-sm border-muted/80">
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <Wheat className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Estoques de Commodities</CardTitle>
            <CardDescription className="text-white/80">
              Gerencie estoques de grãos e produtos agrícolas por safra
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="mt-4">
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
            <div className="min-w-[1200px]">
              {renderTable()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}