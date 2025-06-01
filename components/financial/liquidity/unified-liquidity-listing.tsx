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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Save, Droplets, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatters";

// Tipos baseados no novo schema (CSV)
type LiquidityFactorType = {
  id: string;
  organizacao_id: string;
  safra_id: string;
  tipo: string;
  banco?: string;
  descricao: string;
  valores_por_ano: Record<string, number>; // safra_id -> valor
  moeda: "BRL" | "USD";
  data_referencia: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
};

type UnifiedLiquidityListingProps = {
  liquidityFactors: LiquidityFactorType[] | undefined;
  safras: Array<{ id: string; nome: string; ano_inicio: number }>;
};

export function UnifiedLiquidityListing({
  liquidityFactors = [],
  safras = [],
}: UnifiedLiquidityListingProps) {
  if (!liquidityFactors || liquidityFactors.length === 0) {
    return (
      <Card className="w-full shadow-sm border-muted/80">
        <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <Droplets className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Fatores de Liquidez</CardTitle>
              <CardDescription className="text-white/80">
                Gerencie caixa, bancos e investimentos por safra
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="mt-4">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
            <p className="text-amber-700 mb-4">
              Não encontramos fatores de liquidez configurados. Se você acabou
              de criar as tabelas, tente recarregar a página para inicializar os
              valores padrão.
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
  safras.forEach((safra) => {
    safraMap[safra.id] = { nome: safra.nome, ano: safra.ano_inicio };
  });

  // Anos que queremos mostrar (2021-2029, sem 2020 e 2030)
  const yearsToShow = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029];

  // Inicializar estado de edição para um fator de liquidez
  const initEditState = (factor: LiquidityFactorType) => {
    if (!editingState[factor.id]) {
      const editValues: Record<string, string> = {};

      // Inicializar valores para cada ano baseado nos dados do fator
      yearsToShow.forEach((year) => {
        // Encontrar a safra correspondente ao ano
        const safra = safras.find((s) => s.ano_inicio === year);
        if (safra && factor.valores_por_ano[safra.id]) {
          editValues[`value${year}`] =
            factor.valores_por_ano[safra.id].toString();
        } else {
          editValues[`value${year}`] = "0";
        }
      });

      setEditingState((prev) => ({
        ...prev,
        [factor.id]: editValues,
      }));
    }

    if (isLoading[factor.id] === undefined) {
      setIsLoading((prev) => ({
        ...prev,
        [factor.id]: false,
      }));
    }
  };

  // Manipular mudança de input
  const handleInputChange = (id: string, field: string, value: string) => {
    setEditingState((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  };

  // Salvar mudanças
  const handleSave = async (factor: LiquidityFactorType) => {
    try {
      setIsLoading((prev) => ({
        ...prev,
        [factor.id]: true,
      }));

      const editValues = editingState[factor.id];
      if (!editValues) return;

      // Preparar novos valores por ano
      const newValoresPorAno: Record<string, number> = {};

      yearsToShow.forEach((year) => {
        const safra = safras.find((s) => s.ano_inicio === year);
        if (safra) {
          const value = parseFloat(editValues[`value${year}`] || "0");
          if (!isNaN(value) && value > 0) {
            newValoresPorAno[safra.id] = value;
          }
        }
      });

      // Aqui você faria a chamada para a API para atualizar
      // Por enquanto, vamos apenas atualizar localmente
      factor.valores_por_ano = newValoresPorAno;

      toast.success("Fator de liquidez atualizado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsLoading((prev) => ({
        ...prev,
        [factor.id]: false,
      }));
    }
  };

  // Formatar número para exibição
  const formatNumber = (value: number) => {
    return formatCurrencyCompact(value);
  };

  // Obter valor para um ano específico
  const getValueForYear = (
    factor: LiquidityFactorType,
    year: number
  ): number => {
    const safra = safras.find((s) => s.ano_inicio === year);
    if (safra && factor.valores_por_ano[safra.id]) {
      return factor.valores_por_ano[safra.id];
    }
    return 0;
  };

  // Obter badge do tipo
  const getTypeBadge = (tipo: string) => {
    const typeLabels: Record<string, string> = {
      CAIXA: "Caixa",
      BANCO: "Banco",
      INVESTIMENTO: "Investimento",
      APLICACAO: "Aplicação",
    };

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        {typeLabels[tipo] || tipo}
      </Badge>
    );
  };

  const renderTable = () => {
    return (
      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="bg-primary hover:bg-primary">
            <TableHead className="font-semibold text-primary-foreground rounded-tl-md w-[200px] bg-primary">
              Descrição
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground w-[100px] bg-primary">
              Tipo
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground w-[120px] bg-primary">
              Banco
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
          {liquidityFactors.map((factor) => {
            initEditState(factor);

            return (
              <TableRow key={factor.id}>
                <TableCell className="font-medium">
                  {factor.descricao}
                </TableCell>
                <TableCell>{getTypeBadge(factor.tipo)}</TableCell>
                <TableCell>{factor.banco || "-"}</TableCell>
                {yearsToShow.map((year) => (
                  <TableCell key={year}>
                    {formatNumber(getValueForYear(factor, year))}
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
                            Editar Valores - {factor.descricao}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Atualize os valores por safra.
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {yearsToShow.map((year) => (
                            <div key={year} className="space-y-2">
                              <Label htmlFor={`${factor.id}-value${year}`}>
                                {year}/{String(year + 1).slice(-2)}
                              </Label>
                              <Input
                                id={`${factor.id}-value${year}`}
                                type="number"
                                value={
                                  editingState[factor.id]?.[`value${year}`] ||
                                  getValueForYear(factor, year).toString()
                                }
                                onChange={(e) =>
                                  handleInputChange(
                                    factor.id,
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
                          onClick={() => handleSave(factor)}
                          disabled={isLoading[factor.id]}
                          className="w-full"
                        >
                          {isLoading[factor.id] ? (
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
            <Droplets className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Fatores de Liquidez</CardTitle>
            <CardDescription className="text-white/80">
              Gerencie caixa, bancos e investimentos por safra
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="mt-4">
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
            <div className="min-w-[1200px]">{renderTable()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
