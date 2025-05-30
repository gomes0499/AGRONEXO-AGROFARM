"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectionFiltersRead } from "@/hooks/use-projection-filters-read";
import { getCashFlowData, type CashFlowData } from "@/lib/actions/projections-actions/cash-flow-data";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, TrendingUp, ChartPie } from "lucide-react";
import { cn } from "@/lib/utils";

interface CashFlowListingProps {
  organizationId: string;
}

export function CashFlowListing({
  organizationId,
}: CashFlowListingProps) {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usar filtros globais de projeção
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
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<TrendingUp className="h-4 w-4" />}
          title="Fluxo de Caixa Projetado"
          description="Análise detalhada do fluxo de caixa operacional e financeiro"
        />
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<TrendingUp className="h-4 w-4" />}
          title="Fluxo de Caixa Projetado"
          description="Análise detalhada do fluxo de caixa operacional e financeiro"
        />
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!cashFlowData || !cashFlowData.years || cashFlowData.years.length === 0) {
    return (
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<TrendingUp className="h-4 w-4" />}
          title="Fluxo de Caixa Projetado"
          description="Análise detalhada do fluxo de caixa operacional e financeiro"
        />
        <CardContent className="p-6">
          <EmptyState
            icon={<ChartPie className="h-10 w-10 text-muted-foreground" />}
            title="Nenhum dado disponível"
            description="Nenhum dado encontrado para os filtros selecionados. Verifique se há dados financeiros e projeções cadastradas."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<TrendingUp className="h-4 w-4" />}
        title="Fluxo de Caixa Projetado"
        description="Análise detalhada do fluxo de caixa operacional e financeiro"
      />

      <CardContent className="p-6 space-y-6">
        <div className="overflow-x-auto overflow-y-hidden border rounded-md">
          <div className="min-w-max">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="font-semibold text-primary-foreground min-w-[250px] w-[250px] sticky left-0 bg-primary z-20 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] rounded-tl-md">
                    Componente
                  </TableHead>
                  {cashFlowData.years.map((year, index) => (
                    <TableHead 
                      key={year.safraId} 
                      className={cn(
                        "font-semibold text-primary-foreground text-center min-w-[120px] w-[120px] whitespace-nowrap",
                        index === cashFlowData.years.length - 1 && "rounded-tr-md"
                      )}
                    >
                      {year.safraName}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* RECEITAS AGRÍCOLAS */}
                <TableRow className="bg-primary">
                  <TableCell colSpan={1 + cashFlowData.years.length} className="font-bold text-center text-primary-foreground">
                    RECEITAS AGRÍCOLAS
                  </TableCell>
                </TableRow>

                {/* Soja Sequeiro */}
                <TableRow className="hover:bg-muted/30">
                  <TableCell className="font-medium min-w-[250px] w-[250px] sticky left-0 bg-background z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
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
                <TableRow className="hover:bg-muted/30 bg-gray-50">
                  <TableCell className="font-bold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Total Receitas Agrícolas
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono font-bold min-w-[120px] w-[120px] bg-gray-50"
                    >
                      {formatMillions(year.receitasAgricolas.total)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* DESPESAS AGRÍCOLAS */}
                <TableRow className="bg-primary">
                  <TableCell colSpan={1 + cashFlowData.years.length} className="font-bold text-center text-primary-foreground">
                    DESPESAS AGRÍCOLAS
                  </TableCell>
                </TableRow>

                {/* Total Despesas Agrícolas */}
                <TableRow className="hover:bg-muted/30 bg-gray-50">
                  <TableCell className="font-bold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    Total Despesas Agrícolas
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className="text-center font-mono font-bold min-w-[120px] w-[120px] bg-gray-50"
                    >
                      {formatMillions(-year.despesasAgricolas.total)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* OUTRAS DESPESAS */}
                <TableRow className="bg-primary">
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
                <TableRow className="hover:bg-muted/30 bg-gray-50">
                  <TableCell className="font-bold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    FLUXO DE CAIXA DA ATIVIDADE
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className={cn(
                        "text-center font-mono font-bold min-w-[120px] w-[120px] bg-gray-50",
                        year.fluxoAtividade < 0 ? "text-destructive" : ""
                      )}
                    >
                      {formatMillions(year.fluxoAtividade)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* INVESTIMENTOS */}
                <TableRow className="bg-primary">
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
                <TableRow className="bg-primary">
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

                {/* RESULTADO FINAL */}
                <TableRow className="bg-primary">
                  <TableCell colSpan={1 + cashFlowData.years.length} className="font-bold text-center text-primary-foreground">
                    RESULTADO FINAL
                  </TableCell>
                </TableRow>

                {/* FLUXO LÍQUIDO */}
                <TableRow className="hover:bg-muted/30 bg-gray-50">
                  <TableCell className="font-bold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    FLUXO DE CAIXA LÍQUIDO
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className={cn(
                        "text-center font-mono font-bold min-w-[120px] w-[120px] bg-gray-50",
                        year.fluxoLiquido < 0 ? "text-destructive" : ""
                      )}
                    >
                      {formatMillions(year.fluxoLiquido)}
                    </TableCell>
                  ))}
                </TableRow>

                {/* FLUXO ACUMULADO */}
                <TableRow className="hover:bg-muted/30 bg-gray-50">
                  <TableCell className="font-bold min-w-[250px] w-[250px] sticky left-0 bg-gray-50 z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    FLUXO DE CAIXA ACUMULADO
                  </TableCell>
                  {cashFlowData.years.map((year) => (
                    <TableCell 
                      key={year.safraId} 
                      className={cn(
                        "text-center font-mono font-bold min-w-[120px] w-[120px] bg-gray-50",
                        year.fluxoAcumulado < 0 ? "text-destructive" : ""
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