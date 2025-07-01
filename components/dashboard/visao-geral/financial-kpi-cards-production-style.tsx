"use client";

import React, { useState, useCallback, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FinancialKpiCardsData } from "@/lib/actions/financial-kpi-cards-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Building2Icon,
  FileTextIcon,
  TrendingDownIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Loader2,
  DollarSign,
  Info,
  TrendingUpIcon,
} from "lucide-react";
import { FinancialMetricHistoryChartModal } from "./financial-metric-history-chart-modal";
import type { FinancialMetricType } from "@/lib/actions/financial-historical-metrics-actions";
import { prefetchMetricData, getFinancialKpiCardsData } from "@/lib/actions/financial-kpi-cards-actions";
import { cn } from "@/lib/utils";

interface FinancialKpiCardsRefactoredProps {
  organizationId: string;
  initialData: FinancialKpiCardsData;
  onYearChange?: (year: number | null) => void;
  onSafraChange?: (safraId: string) => void;
}

interface KpiItemProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  loading?: boolean;
  changeIcon?: React.ReactNode;
  tooltip?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  clickable?: boolean;
}

// Memoizar o componente KpiItem para evitar re-renderizações desnecessárias
const KpiItem = React.memo(function KpiItem({
  title,
  value,
  change,
  isPositive,
  icon,
  loading,
  changeIcon,
  tooltip,
  onClick,
  onMouseEnter,
  clickable = false,
}: KpiItemProps) {
  if (loading) {
    return (
      <div className="flex items-start p-5">
        <div className="rounded-full p-2 mr-3 bg-primary opacity-50">
          <Loader2 className="h-5 w-5 text-white animate-spin" />
        </div>
        <div className="flex-1">
          <div className="h-4 bg-muted rounded w-32 mb-2 animate-pulse" />
          <div className="h-6 bg-muted rounded w-20 mb-2 animate-pulse" />
          <div className="h-4 bg-muted rounded w-24 animate-pulse" />
        </div>
      </div>
    );
  }

  // Função para gerar o badge baseado no status - apenas para indicadores
  const getStatusBadge = () => {
    // Renomear a variável 'value' do componente para 'cardValue' para evitar conflito
    const cardValue = value;

    // Verificar se é um indicador - só mostrar badges para esses
    if (title.includes("DÍVIDA/EBITDA")) {
      try {
        const numValue = parseFloat(String(cardValue).replace("x", ""));
        // Corrigido conforme os limiares definidos
        if (numValue > 3.0) {
          return (
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                backgroundColor: "#FF4D4F20",
                color: "#FF4D4F",
                borderColor: "#FF4D4F",
              }}
            >
              Crítico
            </Badge>
          );
        } else if (numValue > 1.2) {
          return (
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                backgroundColor: "#FAAD1420",
                color: "#FAAD14",
                borderColor: "#FAAD14",
              }}
            >
              Atenção
            </Badge>
          );
        } else {
          return (
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                backgroundColor: "#52C41A20",
                color: "#52C41A",
                borderColor: "#52C41A",
              }}
            >
              Bom
            </Badge>
          );
        }
      } catch (e) {
        return null;
      }
    }

    if (
      title.includes("DÍVIDA/RECEITA") ||
      title.includes("DÍV. LÍQUIDA/RECEITA")
    ) {
      try {
        const numValue = parseFloat(String(cardValue).replace("x", ""));
        // Corrigido conforme os limiares definidos
        if (numValue > 0.8) {
          return (
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                backgroundColor: "#FF4D4F20",
                color: "#FF4D4F",
                borderColor: "#FF4D4F",
              }}
            >
              Crítico
            </Badge>
          );
        } else if (numValue > 0.5) {
          return (
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                backgroundColor: "#FAAD1420",
                color: "#FAAD14",
                borderColor: "#FAAD14",
              }}
            >
              Atenção
            </Badge>
          );
        } else {
          return (
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                backgroundColor: "#52C41A20",
                color: "#52C41A",
                borderColor: "#52C41A",
              }}
            >
              Bom
            </Badge>
          );
        }
      } catch (e) {
        return null;
      }
    }

    if (title.includes("DÍV. LÍQUIDA/EBITDA")) {
      try {
        const numValue = parseFloat(String(cardValue).replace("x", ""));
        // Corrigido conforme os limiares definidos
        if (numValue > 3.0) {
          return (
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                backgroundColor: "#FF4D4F20",
                color: "#FF4D4F",
                borderColor: "#FF4D4F",
              }}
            >
              Crítico
            </Badge>
          );
        } else if (numValue > 2.5) {
          return (
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                backgroundColor: "#FAAD1420",
                color: "#FAAD14",
                borderColor: "#FAAD14",
              }}
            >
              Atenção
            </Badge>
          );
        } else {
          return (
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                backgroundColor: "#52C41A20",
                color: "#52C41A",
                borderColor: "#52C41A",
              }}
            >
              Bom
            </Badge>
          );
        }
      } catch (e) {
        return null;
      }
    }

    // Não mostrar badges para outros itens
    return null;
  };

  return (
    <div
      className={cn(
        "flex items-start p-5 transition-colors",
        clickable && "cursor-pointer hover:bg-muted/50 active:bg-muted"
      )}
      onClick={clickable ? onClick : undefined}
      onMouseEnter={onMouseEnter}
    >
      <div className="rounded-full p-2 mr-3 bg-primary">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-center gap-1">
            {clickable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <TrendingUpIcon className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Clique para ver evolução histórica</p>
                </TooltipContent>
              </Tooltip>
            )}
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        <h3 className="text-2xl font-bold mt-1 dark:text-gray-100">{value}</h3>
        <div className="flex items-center justify-between mt-1">
          <p
            className={cn(
              "flex items-center text-xs font-medium",
              isPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            )}
          >
            {changeIcon ||
              (isPositive ? (
                <ArrowUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 mr-1" />
              ))}
            {change}
          </p>
          {getStatusBadge()}
        </div>
      </div>
    </div>
  );
});

export function FinancialKpiCardsProductionStyleRefactored({
  organizationId,
  initialData,
  onYearChange,
  onSafraChange,
}: FinancialKpiCardsRefactoredProps) {
  const [data, setData] = useState<FinancialKpiCardsData>(initialData);
  const [selectedSafraId, setSelectedSafraId] = useState<string>(() => {
    // Definir safra inicial
    if (initialData.safras.length > 0) {
      const currentYear = new Date().getFullYear();
      const currentSafra = initialData.safras.find((s) => s.ano_inicio === currentYear) || initialData.safras[0];
      return currentSafra.id;
    }
    return "";
  });
  const [selectedYear, setSelectedYear] = useState<number | null>(() => {
    // Definir ano inicial baseado na safra selecionada
    const safra = initialData.safras.find((s) => s.id === selectedSafraId);
    return safra?.ano_inicio || initialData.currentYear;
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<FinancialMetricType>("dividaReceita");
  const [isPending, startTransition] = useTransition();
  
  // Cache de métricas para prefetching
  const [prefetchedMetrics, setPrefetchedMetrics] = useState<Record<string, boolean>>({});

  // Usar useCallback para memoizar as funções e evitar re-renderizações desnecessárias
  const handleMetricClick = useCallback((metricType: FinancialMetricType) => {
    setSelectedMetric(metricType);
    setModalOpen(true);
  }, []);

  // Função para prefetching dos dados quando o usuário passar o mouse sobre o KPI
  const handleMetricHover = useCallback(
    async (metricType: FinancialMetricType) => {
      // Verificar se já foi feito prefetch desta métrica
      if (prefetchedMetrics[metricType]) {
        return;
      }

      try {
        // Marcar como prefetched para não repetir
        setPrefetchedMetrics((prev) => ({ ...prev, [metricType]: true }));

        // Fazer prefetch dos dados silenciosamente
        await prefetchMetricData(organizationId, metricType, undefined);
      } catch (err) {
        // Erro no prefetch não é crítico, ignoramos silenciosamente
      }
    },
    [organizationId, prefetchedMetrics]
  );

  const handleSafraChange = (value: string) => {
    setSelectedSafraId(value);
    if (onSafraChange) {
      onSafraChange(value);
    }

    // Também atualizar o ano selecionado baseado na safra
    const safra = data.safras.find((s) => s.id === value);
    if (safra) {
      setSelectedYear(safra.ano_inicio);
      if (onYearChange) {
        onYearChange(safra.ano_inicio);
      }
    }

    // Atualizar dados quando safra mudar
    startTransition(async () => {
      try {
        const newData = await getFinancialKpiCardsData(
          organizationId,
          safra?.ano_inicio,
          undefined
        );
        setData(newData);
      } catch (error) {
        console.error("Erro ao atualizar métricas:", error);
      }
    });
  };

  const formatMilhoes = (valor: number) => {
    return `R$ ${(Math.abs(valor) / 1000000).toFixed(1)}M`;
  };

  const formatAnos = (valor: number) => {
    return `${valor.toFixed(1)} anos`;
  };

  // Para métricas de dívida, redução (negativo) é positiva
  const getDividaChangeType = (percentual: number): boolean => {
    if (Math.abs(percentual) < 0.1) return true; // neutro = positivo
    return percentual < 0; // redução = positivo
  };

  const getChangeIcon = (isDebt: boolean, percentual: number) => {
    if (!isDebt) return null;
    if (Math.abs(percentual) < 0.1) {
      return <ClockIcon className="h-3 w-3 mr-1" />;
    }
    return null;
  };

  const metrics = data.metrics;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* KPI Cards */}
        <Card>
          <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-white/20">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">
                    Resumo Financeiro
                    {isPending && " (Atualizando...)"}
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    Indicadores consolidados de endividamento e liquidez
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={selectedSafraId}
                  onValueChange={handleSafraChange}
                >
                  <SelectTrigger className="w-48 h-9 bg-white/10 border-white/20 text-white focus:ring-white/30 placeholder:text-white/60">
                    <SelectValue placeholder="Selecionar safra" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.safras.map((safra) => (
                      <SelectItem key={safra.id} value={safra.id}>
                        {safra.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Indicadores consolidados de endividamento e liquidez.
                      Valores são atualizados conforme a safra selecionada.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 py-0 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {/* Dívida Bancária */}
              <div className="relative">
                <KpiItem
                  title="DÍVIDA BANCÁRIA"
                  value={
                    metrics
                      ? formatMilhoes(metrics.dividaBancaria.valorAtual)
                      : "R$ 0.0M"
                  }
                  change={
                    metrics
                      ? `${
                          metrics.dividaBancaria.percentualMudanca > 0
                            ? "+"
                            : ""
                        }${metrics.dividaBancaria.percentualMudanca.toFixed(
                          1
                        )}% YoY`
                      : "+0.0% YoY"
                  }
                  isPositive={
                    metrics
                      ? getDividaChangeType(
                          metrics.dividaBancaria.percentualMudanca
                        )
                      : true
                  }
                  icon={<Building2Icon className="h-5 w-5 text-white" />}
                  loading={isPending}
                />
                <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
              </div>

              {/* Outros Passivos */}
              <div className="relative">
                <KpiItem
                  title="OUTROS PASSIVOS"
                  value={
                    metrics
                      ? formatMilhoes(metrics.outrosPassivos.valorAtual)
                      : "R$ 0.0M"
                  }
                  change={
                    metrics
                      ? `${
                          metrics.outrosPassivos.percentualMudanca > 0
                            ? "+"
                            : ""
                        }${metrics.outrosPassivos.percentualMudanca.toFixed(
                          1
                        )}% YoY`
                      : "+0.0% YoY"
                  }
                  isPositive={
                    metrics
                      ? getDividaChangeType(
                          metrics.outrosPassivos.percentualMudanca
                        )
                      : true
                  }
                  icon={<FileTextIcon className="h-5 w-5 text-white" />}
                  loading={isPending}
                />
                <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
              </div>

              {/* Dívida Líquida */}
              <div className="relative">
                <KpiItem
                  title="DÍVIDA LÍQUIDA"
                  value={
                    metrics
                      ? formatMilhoes(metrics.dividaLiquida.valorAtual)
                      : "R$ 0.0M"
                  }
                  change={
                    metrics
                      ? `${
                          metrics.dividaLiquida.percentualMudanca > 0 ? "+" : ""
                        }${metrics.dividaLiquida.percentualMudanca.toFixed(
                          1
                        )}% YoY`
                      : "+0.0% YoY"
                  }
                  isPositive={
                    metrics
                      ? getDividaChangeType(
                          metrics.dividaLiquida.percentualMudanca
                        )
                      : true
                  }
                  icon={<TrendingDownIcon className="h-5 w-5 text-white" />}
                  loading={isPending}
                />
                <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
              </div>

              {/* Prazo Médio */}
              <div>
                <KpiItem
                  title="PRAZO MÉDIO"
                  value={
                    metrics ? formatAnos(metrics.prazoMedio.valorAtual) : "0.0 anos"
                  }
                  change={
                    metrics
                      ? `vs ${formatAnos(
                          metrics.prazoMedio.valorAnterior
                        )} ant.`
                      : "vs 0.0 anos ant."
                  }
                  isPositive={true}
                  icon={<ClockIcon className="h-5 w-5 text-white" />}
                  loading={isPending}
                  changeIcon={<ClockIcon className="h-3 w-3 mr-1" />}
                />
              </div>
            </div>

            {/* Indicadores de Endividamento */}
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {/* DÍVIDA/RECEITA */}
              <div className="relative">
                <KpiItem
                  title="DÍVIDA/RECEITA"
                  value={
                    metrics
                      ? `${metrics.indicadores.dividaReceita.toFixed(1)}x`
                      : "0.0x"
                  }
                  change="Ideal: até 2,0x"
                  isPositive={
                    metrics ? metrics.indicadores.dividaReceita <= 2.0 : true
                  }
                  icon={<TrendingDownIcon className="h-5 w-5 text-white" />}
                  loading={isPending}
                  clickable={!isPending}
                  onClick={() => handleMetricClick("dividaReceita")}
                  onMouseEnter={() => handleMetricHover("dividaReceita")}
                  tooltip="Relação entre a dívida total e a receita operacional. Quanto menor, melhor."
                />
                <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
              </div>

              {/* DÍVIDA/EBITDA */}
              <div className="relative">
                <KpiItem
                  title="DÍVIDA/EBITDA"
                  value={
                    metrics
                      ? `${metrics.indicadores.dividaEbitda.toFixed(1)}x`
                      : "0.0x"
                  }
                  change="Ideal: até 3,0x"
                  isPositive={
                    metrics ? metrics.indicadores.dividaEbitda <= 3.0 : true
                  }
                  icon={<TrendingDownIcon className="h-5 w-5 text-white" />}
                  loading={isPending}
                  clickable={!isPending}
                  onClick={() => handleMetricClick("dividaEbitda")}
                  onMouseEnter={() => handleMetricHover("dividaEbitda")}
                  tooltip="Relação entre a dívida total e o EBITDA (lucro operacional). Quanto menor, melhor."
                />
                <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
              </div>

              {/* DÍV. LÍQUIDA/RECEITA */}
              <div className="relative">
                <KpiItem
                  title="DÍV. LÍQUIDA/RECEITA"
                  value={
                    metrics
                      ? `${metrics.indicadores.dividaLiquidaReceita.toFixed(
                          1
                        )}x`
                      : "0.0x"
                  }
                  change="Ideal: até 1,5x"
                  isPositive={
                    metrics
                      ? metrics.indicadores.dividaLiquidaReceita <= 1.5
                      : true
                  }
                  icon={<TrendingDownIcon className="h-5 w-5 text-white" />}
                  loading={isPending}
                  clickable={!isPending}
                  onClick={() => handleMetricClick("dividaLiquidaReceita")}
                  onMouseEnter={() => handleMetricHover("dividaLiquidaReceita")}
                  tooltip="Relação entre a dívida líquida (descontando caixa) e a receita. Quanto menor, melhor."
                />
                <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
              </div>

              {/* DÍV. LÍQUIDA/EBITDA */}
              <div>
                <KpiItem
                  title="DÍV. LÍQUIDA/EBITDA"
                  value={
                    metrics
                      ? `${metrics.indicadores.dividaLiquidaEbitda.toFixed(1)}x`
                      : "0.0x"
                  }
                  change="Ideal: até 2,5x"
                  isPositive={
                    metrics
                      ? metrics.indicadores.dividaLiquidaEbitda <= 2.5
                      : true
                  }
                  icon={<TrendingDownIcon className="h-5 w-5 text-white" />}
                  loading={isPending}
                  clickable={!isPending}
                  onClick={() => handleMetricClick("dividaLiquidaEbitda")}
                  onMouseEnter={() => handleMetricHover("dividaLiquidaEbitda")}
                  tooltip="Relação entre a dívida líquida e o EBITDA. É o principal indicador de capacidade de pagamento. Quanto menor, melhor."
                />
              </div>
            </div>
          </CardContent>
          {/* Footer com insights */}
          <div className="px-6 py-4 border-t">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {metrics?.indicadores.dividaLiquidaEbitda
                  ? metrics.indicadores.dividaLiquidaEbitda > 3.0
                    ? "⚠️ Indicadores de endividamento acima do recomendado. Considere estratégias de redução de dívida."
                    : metrics.indicadores.dividaLiquidaEbitda > 1.2
                    ? "📊 Indicadores de endividamento em níveis moderados. Continue monitorando."
                    : "✅ Indicadores de endividamento saudáveis. Boa capacidade de pagamento."
                  : "Configure os dados financeiros para análise de indicadores."}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal de evolução histórica do indicador */}
      <FinancialMetricHistoryChartModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        metricType={selectedMetric}
        organizationId={organizationId}
        projectionId={undefined}
      />
    </TooltipProvider>
  );
}