"use client";

import { useState, useEffect } from "react";
import { useProjectionFiltersRead } from "@/hooks/use-projection-filters-read";
import { getCashFlowData, type CashFlowData } from "@/lib/actions/projections-actions/cash-flow-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface CashFlowTableProps {
  organizationId: string;
}

export function CashFlowTable({
  organizationId,
}: CashFlowTableProps) {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const filters = useProjectionFiltersRead();

  useEffect(() => {
    async function loadCashFlowData() {
      try {
        setLoading(true);
        setError(null);
        
        const filtersData = {
          propertyIds: filters.propertyIds.length > 0 ? filters.propertyIds : undefined,
          cultureIds: filters.cultureIds.length > 0 ? filters.cultureIds : undefined,
          systemIds: filters.systemIds.length > 0 ? filters.systemIds : undefined,
          cycleIds: filters.cycleIds.length > 0 ? filters.cycleIds : undefined,
          safraIds: filters.safraIds.length > 0 ? filters.safraIds : undefined,
        };

        const result = await getCashFlowData(organizationId, filtersData);
        setCashFlowData(result);
      } catch (err) {
        console.error('Error loading cash flow data:', err);
        setError('Erro ao carregar dados do fluxo de caixa');
      } finally {
        setLoading(false);
      }
    }

    loadCashFlowData();
  }, [organizationId, filters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMillions = (value: number) => {
    return `${(value / 1000000).toFixed(1)}M`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>Fluxo de Caixa Projetado</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!cashFlowData || !cashFlowData.years || cashFlowData.years.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>Fluxo de Caixa Projetado</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum dado encontrado para os filtros selecionados. 
              Verifique se há dados financeiros e projeções cadastradas.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-[calc(100vw-280px)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <CardTitle>Fluxo de Caixa Projetado - {cashFlowData.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <div className="overflow-x-auto overflow-y-hidden border rounded-md" style={{ maxWidth: '100%' }}>
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary dark:bg-primary/90">
                  <TableHead className="font-semibold text-primary-foreground text-center min-w-[250px] w-[250px] sticky left-0 bg-primary dark:bg-primary/90 z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Componente
                  </TableHead>
                  {cashFlowData.years.map((year) => (
                    <TableHead 
                      key={year.safraId} 
                      className="font-semibold text-primary-foreground text-center min-w-[120px] w-[120px] whitespace-nowrap"
                    >
                      {year.safraName}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* RECEITAS AGRÍCOLAS */}
                <TableRow className="bg-primary dark:bg-primary/90">
                  <TableCell colSpan={1 + cashFlowData.years.length} className="font-bold text-center text-primary-foreground">
                    RECEITAS AGRÍCOLAS
                  </TableCell>
                </TableRow>

                {/* Soja Sequeiro */}
                <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30">
                  <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background dark:bg-gray-900 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Soja Sequeiro
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatMillions(year.receitasAgricolas.sojaSequeiro)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Soja Irrigado */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Soja Irrigado
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatMillions(year.receitasAgricolas.sojaIrrigado)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Algodão */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Algodão - 2ª Safra
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatMillions(year.receitasAgricolas.algodao)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Outras culturas resumidas */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Outras Culturas
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatMillions(
                        year.receitasAgricolas.milhoSequeiro + 
                        year.receitasAgricolas.milhoIrrigado +
                        year.receitasAgricolas.arroz +
                        year.receitasAgricolas.sorgo +
                        year.receitasAgricolas.feijao +
                        year.receitasAgricolas.sementeSoja +
                        year.receitasAgricolas.outras
                      )}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Total Receitas */}
                <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30 bg-gray-50 dark:bg-gray-800">
                  <TableCell className="font-bold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Total Receitas Agrícolas
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono font-bold min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800"
                    >
                      {formatMillions(year.receitasAgricolas.total)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* DESPESAS AGRÍCOLAS */}
                <TableRow className="bg-primary dark:bg-primary/90">
                  <TableCell colSpan={1 + cashFlowData.years.length} className="font-bold text-center text-primary-foreground">
                    DESPESAS AGRÍCOLAS
                  </TableCell>
                </TableRow>

                {/* Total Despesas Agrícolas */}
                <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30 bg-gray-50 dark:bg-gray-800">
                  <TableCell className="font-bold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Total Despesas Agrícolas
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono font-bold min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800"
                    >
                      {formatMillions(-year.despesasAgricolas.total)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* OUTRAS DESPESAS */}
                <TableRow className="bg-primary dark:bg-primary/90">
                  <TableCell colSpan={1 + cashFlowData.years.length} className="font-bold text-center text-primary-foreground">
                    OUTRAS DESPESAS
                  </TableCell>
                </TableRow>

                {/* Arrendamento */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Arrendamento
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatMillions(-year.outrasDispesas.arrendamento)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Pró-labore */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Pró-labore
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatMillions(-year.outrasDispesas.proLabore)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Outras */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Outras
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatMillions(-year.outrasDispesas.outras)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* FLUXO DA ATIVIDADE */}
                <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30 bg-gray-50 dark:bg-gray-800">
                  <TableCell className="font-bold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    FLUXO DE CAIXA DA ATIVIDADE
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className={cn(
                        "text-center font-mono font-bold min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800",
                        year.fluxoAtividade < 0 ? "text-destructive dark:text-red-400" : "dark:text-green-400"
                      )}
                    >
                      {formatMillions(year.fluxoAtividade)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* INVESTIMENTOS */}
                <TableRow className="bg-primary dark:bg-primary/90">
                  <TableCell colSpan={1 + cashFlowData.years.length} className="font-bold text-center text-primary-foreground">
                    INVESTIMENTOS
                  </TableCell>
                </TableRow>

                {/* Maquinários */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Maquinários
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatMillions(-year.investimentos.maquinarios)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Terras */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Terras
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatMillions(0)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Outros Investimentos */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Outros
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatMillions(-year.investimentos.outros)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* FINANCEIRAS */}
                <TableRow className="bg-primary dark:bg-primary/90">
                  <TableCell colSpan={1 + cashFlowData.years.length} className="font-bold text-center text-primary-foreground">
                    FINANCEIRAS
                  </TableCell>
                </TableRow>

                {/* Serviço da Dívida */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Serviço da Dívida
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatMillions(year.financeiras.servicoDivida)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Pagamentos Bancos */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Pagamentos - Bancos/Adto. Clientes
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatMillions(year.financeiras.pagamentosBancos)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* Novas Linhas de Crédito */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Novas Linhas de Crédito
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono min-w-[120px] w-[120px]"
                    >
                      {formatMillions(year.financeiras.novasLinhasCredito)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* FLUXO LÍQUIDO */}
                <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30 bg-gray-50 dark:bg-gray-800">
                  <TableCell className="font-bold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    FLUXO DE CAIXA LÍQUIDO
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className={cn(
                        "text-center font-mono font-bold min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800",
                        year.fluxoLiquido < 0 ? "text-destructive dark:text-red-400" : "dark:text-green-400"
                      )}
                    >
                      {formatMillions(year.fluxoLiquido)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* FLUXO ACUMULADO */}
                <TableRow className="hover:bg-muted/30 dark:hover:bg-gray-700/30 bg-gray-50 dark:bg-gray-800">
                  <TableCell className="font-bold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    FLUXO DE CAIXA ACUMULADO
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className={cn(
                        "text-center font-mono font-bold min-w-[120px] w-[120px] bg-gray-50 dark:bg-gray-800",
                        year.fluxoAcumulado < 0 ? "text-destructive dark:text-red-400" : "dark:text-green-400"
                      )}
                    >
                      {formatMillions(year.fluxoAcumulado)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}