"use client";

import { useState, useTransition, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Building2Icon,
  FileTextIcon,
  TrendingDownIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DollarSign,
  Info,
  Loader2,
  Calculator,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import { defaultIndicatorConfigs } from "@/schemas/indicators";
import { IndicatorValueBadge } from "@/components/indicators/indicator-value-badge";
import {
  getFinancialKpiDataV2 as getFinancialKpiData,
  type FinancialKpiData,
} from "@/lib/actions/financial-kpi-data-actions-v2";
import {
  getChangeType,
  getDividaChangeType,
  getIndicatorChangeType,
} from "@/lib/utils/financial-indicators";
import { getFinancialMetrics } from "@/lib/actions/financial-metrics-actions";
import type { FinancialMetrics } from "@/lib/actions/financial-metrics-actions";
import { FinancialIndicatorHistoricalModalV2 } from "@/components/financial/indicators/financial-indicator-historical-modal-v2";

interface FinancialKpiCardsProps {
  organizationId: string;
  initialData: FinancialKpiData;
  selectedSafraId?: string;
  onSafraChange?: (safraId: string) => void;
}

interface KpiItemProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  tooltip?: string;
  loading?: boolean;
  onClick?: () => void;
  isClickable?: boolean;
}

function KpiItem({ title, value, change, changeType, icon, tooltip, loading, onClick, isClickable }: KpiItemProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-emerald-600 dark:text-emerald-400";
      case "negative":
        return "text-rose-600 dark:text-rose-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case "positive":
        return <ArrowUpIcon className="h-3 w-3 mr-1" />;
      case "negative":
        return <ArrowDownIcon className="h-3 w-3 mr-1" />;
      default:
        return <Info className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <div 
      className={cn(
        "flex items-start p-5 transition-colors",
        isClickable && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
      )}
      onClick={onClick}
    >
      <div className="rounded-full p-2 mr-3 bg-primary">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-center gap-1">
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-background dark:bg-gray-800 border dark:border-gray-700 dark:text-white">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        {loading ? (
          <div className="flex items-center mt-1">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-bold mt-1 dark:text-gray-100">
              {value}
            </h3>
            <p className={cn("flex items-center text-xs font-medium mt-1", getChangeColor())}>
              {getChangeIcon()}
              {change}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function FinancialKpiCards({
  organizationId,
  initialData,
  selectedSafraId: externalSelectedSafraId,
  onSafraChange,
}: FinancialKpiCardsProps) {
  const [data, setData] = useState(initialData);
  
  // Use external safra if provided, otherwise use default
  const defaultSafraId = initialData.safras?.find(s => s.nome === "2025/26")?.id || initialData.currentSafra?.id || "";
  const [internalSelectedSafraId, setInternalSelectedSafraId] = useState(defaultSafraId);
  const selectedSafraId = externalSelectedSafraId !== undefined ? externalSelectedSafraId : internalSelectedSafraId;
  
  const [isPending, startTransition] = useTransition();
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<{
    type: "divida_receita" | "divida_ebitda" | "divida_liquida_receita" | "divida_liquida_ebitda";
    title: string;
  } | null>(null);

  // Handle safra change
  const handleSafraChange = (newSafraId: string) => {
    if (onSafraChange) {
      onSafraChange(newSafraId);
    } else {
      setInternalSelectedSafraId(newSafraId);
    }
    
    startTransition(async () => {
      try {
        const newData = await getFinancialKpiData(organizationId, newSafraId);
        setData(newData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    });
  };

  // Format helpers
  const formatMilhoes = (valor: number) => {
    return `R$ ${(valor / 1000000).toFixed(1)}M`;
  };

  const formatAnos = (valor: number) => {
    return `${valor.toFixed(1)} anos`;
  };

  const formatRatio = (value: number) => {
    return value.toFixed(1) + "x";
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!data?.metrics || typeof data.metrics !== 'object') {
      return {
        dividaBancaria: { value: "R$ 0", change: "0%", changeType: "neutral" as const },
        outrosPassivos: { value: "R$ 0", change: "0%", changeType: "neutral" as const },
        dividaLiquida: { value: "R$ 0", change: "0%", changeType: "neutral" as const },
        prazoMedio: { value: "0 anos", change: "0 anos", changeType: "neutral" as const },
        dividaLiquidaEbitda: { value: "0.0x", change: "--", changeType: "neutral" as const },
        dividaEbitda: { value: "0.0x", change: "--", changeType: "neutral" as const },
        dividaReceita: { value: "0.0x", change: "--", changeType: "neutral" as const },
        dividaLiquidaReceita: { value: "0.0x", change: "--", changeType: "neutral" as const },
        indicadores: {
          dividaReceita: 0,
          dividaEbitda: 0,
          dividaLiquidaReceita: 0,
          dividaLiquidaEbitda: 0
        }
      };
    }

    const m = data.metrics;
    
    // Helper function to safely get variation value
    const safeVariation = (value: number | null | undefined, defaultValue = 0): number => {
      return value != null && !isNaN(value) ? value : defaultValue;
    };

    // Helper function to safely get metric value from nested object
    const safeMetric = (metric: any, property: string, defaultValue = 0): number => {
      return metric && metric[property] != null && !isNaN(metric[property]) ? metric[property] : defaultValue;
    };

    // Helper function to get threshold values from indicator configs
    const getThresholds = (indicatorType: string) => {
      if (!defaultIndicatorConfigs || typeof defaultIndicatorConfigs !== 'object') {
        return { limiar1: 0, limiar2: 0 };
      }
      
      const configs = defaultIndicatorConfigs[indicatorType as keyof typeof defaultIndicatorConfigs];
      if (!configs || !Array.isArray(configs)) {
        return { limiar1: 0, limiar2: 0 };
      }
      
      // Get the first two threshold values as limiar1 and limiar2
      const limiar1 = configs[0]?.max || configs[0]?.min || 0;
      const limiar2 = configs[1]?.max || configs[1]?.min || 0;
      
      return { limiar1, limiar2 };
    };
    
    return {
      dividaBancaria: {
        value: formatMilhoes(safeMetric(m.dividaBancaria, 'valorAtual')),
        change: `${safeMetric(m.dividaBancaria, 'percentualMudanca').toFixed(1)}%`,
        changeType: getDividaChangeType(safeMetric(m.dividaBancaria, 'percentualMudanca')),
      },
      outrosPassivos: {
        value: formatMilhoes(safeMetric(m.outrosPassivos, 'valorAtual')),
        change: `${safeMetric(m.outrosPassivos, 'percentualMudanca').toFixed(1)}%`,
        changeType: getDividaChangeType(safeMetric(m.outrosPassivos, 'percentualMudanca')),
      },
      dividaLiquida: {
        value: formatMilhoes(safeMetric(m.dividaLiquida, 'valorAtual')),
        change: `${safeMetric(m.dividaLiquida, 'percentualMudanca').toFixed(1)}%`,
        changeType: getDividaChangeType(safeMetric(m.dividaLiquida, 'percentualMudanca')),
      },
      prazoMedio: {
        value: formatAnos(safeMetric(m.prazoMedio, 'valorAtual')),
        change: `${safeMetric(m.prazoMedio, 'diferenca').toFixed(1)} anos`,
        changeType: getDividaChangeType(safeMetric(m.prazoMedio, 'diferenca')),
      },
      dividaEbitda: {
        value: m.indicadores.dividaEbitda === 0 ? "N/A" : formatRatio(m.indicadores.dividaEbitda),
        change: "--",
        changeType: getIndicatorChangeType(
          m.indicadores.dividaEbitda,
          getThresholds('DIVIDA_EBITDA').limiar1,
          getThresholds('DIVIDA_EBITDA').limiar2
        ),
      },
      dividaReceita: {
        value: formatRatio(m.indicadores.dividaReceita),
        change: "--",
        changeType: getIndicatorChangeType(
          m.indicadores.dividaReceita,
          getThresholds('DIVIDA_FATURAMENTO').limiar1,
          getThresholds('DIVIDA_FATURAMENTO').limiar2
        ),
      },
      dividaLiquidaEbitda: {
        value: m.indicadores.dividaLiquidaEbitda === 0 ? "N/A" : formatRatio(m.indicadores.dividaLiquidaEbitda),
        change: "--",
        changeType: getIndicatorChangeType(
          m.indicadores.dividaLiquidaEbitda,
          getThresholds('DIVIDA_EBITDA').limiar1,
          getThresholds('DIVIDA_EBITDA').limiar2
        ),
      },
      dividaLiquidaReceita: {
        value: formatRatio(m.indicadores.dividaLiquidaReceita),
        change: "--",
        changeType: getIndicatorChangeType(
          m.indicadores.dividaLiquidaReceita,
          getThresholds('DIVIDA_FATURAMENTO').limiar1,
          getThresholds('DIVIDA_FATURAMENTO').limiar2
        ),
      },
      indicadores: m.indicadores
    };
  }, [data.metrics]);

  if (!data.metrics && isPending) {
    return (
      <TooltipProvider>
        <Card>
          <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-white/20">
                  <Calculator className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">
                    Indicadores Financeiros
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    Carregando métricas financeiras...
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-48 bg-white/10 rounded animate-pulse" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-background dark:bg-gray-800 border dark:border-gray-700 dark:text-white">
                    <p>
                      Indicadores de liquidez, endividamento e capacidade de pagamento
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* Loading state for all 8 KPIs */}
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="relative">
                <KpiItem
                  title="Carregando..."
                  value="R$ 0"
                  change="0%"
                  changeType="neutral"
                  loading={true}
                  icon={<Loader2 className="h-5 w-5 text-white animate-spin" />}
                />
                {index < 7 && (
                  <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <Calculator className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Indicadores Financeiros
                </CardTitle>
                <CardDescription className="text-white/80">
                  Métricas de liquidez, endividamento e capacidade de pagamento
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={selectedSafraId}
                onValueChange={handleSafraChange}
                disabled={isPending}
              >
                <SelectTrigger className="w-48 h-9 bg-white/10 border-white/20 text-white focus:ring-white/30 placeholder:text-white/60">
                  <SelectValue placeholder="Selecionar safra" />
                </SelectTrigger>
                <SelectContent className="bg-background dark:bg-gray-800 border dark:border-gray-700">
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
                <TooltipContent className="bg-background dark:bg-gray-800 border dark:border-gray-700 dark:text-white">
                  <p>
                    Indicadores de liquidez, endividamento e capacidade de pagamento baseados nos dados financeiros da organização
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Dívida Bancária */}
          <div className="relative">
            <KpiItem
              title="Dívida Bancária"
              value={metrics.dividaBancaria.value}
              change={metrics.dividaBancaria.change}
              changeType={metrics.dividaBancaria.changeType}
              icon={<Building2Icon className="h-5 w-5 text-white" />}
              tooltip="Total de empréstimos e financiamentos bancários"
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Outros Passivos */}
          <div className="relative">
            <KpiItem
              title="Outros Passivos"
              value={metrics.outrosPassivos.value}
              change={metrics.outrosPassivos.change}
              changeType={metrics.outrosPassivos.changeType}
              icon={<FileTextIcon className="h-5 w-5 text-white" />}
              tooltip="Trading, imóveis, fornecedores e adiantamentos"
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Dívida Líquida */}
          <div className="relative">
            <KpiItem
              title="Dívida Líquida"
              value={metrics.dividaLiquida.value}
              change={metrics.dividaLiquida.change}
              changeType={metrics.dividaLiquida.changeType}
              icon={<TrendingDownIcon className="h-5 w-5 text-white" />}
              tooltip="Dívida total menos caixa e equivalentes"
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Prazo Médio */}
          <div className="relative">
            <KpiItem
              title="Prazo Médio"
              value={metrics.prazoMedio.value}
              change={metrics.prazoMedio.change}
              changeType={metrics.prazoMedio.changeType}
              icon={<ClockIcon className="h-5 w-5 text-white" />}
              tooltip="Prazo médio ponderado das dívidas"
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Dívida Líquida/EBITDA */}
          <div className="relative">
            <KpiItem
              title="Dívida Líquida/EBITDA"
              value={metrics.dividaLiquidaEbitda.value}
              change={metrics.dividaLiquidaEbitda.change}
              changeType={metrics.dividaLiquidaEbitda.changeType}
              icon={<DollarSign className="h-5 w-5 text-white" />}
              tooltip="Indicador de capacidade de pagamento líquida (clique para ver histórico)"
              isClickable={true}
              onClick={() => {
                setSelectedIndicator({ type: "divida_liquida_ebitda", title: "Dívida Líquida/EBITDA" });
                setModalOpen(true);
              }}
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Dívida/EBITDA */}
          <div className="relative">
            <KpiItem
              title="Dívida/EBITDA"
              value={metrics.dividaEbitda.value}
              change={metrics.dividaEbitda.change}
              changeType={metrics.dividaEbitda.changeType}
              icon={<TrendingDownIcon className="h-5 w-5 text-white" />}
              tooltip="Indicador de capacidade de pagamento (clique para ver histórico)"
              isClickable={true}
              onClick={() => {
                setSelectedIndicator({ type: "divida_ebitda", title: "Dívida/EBITDA" });
                setModalOpen(true);
              }}
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Dívida/Receita */}
          <div className="relative">
            <KpiItem
              title="Dívida/Receita"
              value={metrics.dividaReceita.value}
              change={metrics.dividaReceita.change}
              changeType={metrics.dividaReceita.changeType}
              icon={<Building2Icon className="h-5 w-5 text-white" />}
              tooltip="Dívida total em relação à receita anual (clique para ver histórico)"
              isClickable={true}
              onClick={() => {
                setSelectedIndicator({ type: "divida_receita", title: "Dívida/Receita" });
                setModalOpen(true);
              }}
            />
            <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
          </div>

          {/* Dívida Líquida/Receita */}
          <div className="relative">
            <KpiItem
              title="Dívida Líquida/Receita"
              value={metrics.dividaLiquidaReceita.value}
              change={metrics.dividaLiquidaReceita.change}
              changeType={metrics.dividaLiquidaReceita.changeType}
              icon={<TrendingDownIcon className="h-5 w-5 text-white" />}
              tooltip="Dívida líquida em relação à receita anual (clique para ver histórico)"
              isClickable={true}
              onClick={() => {
                setSelectedIndicator({ type: "divida_liquida_receita", title: "Dívida Líquida/Receita" });
                setModalOpen(true);
              }}
            />
          </div>
        </div>

        {/* Footer com insights */}
        <div className="px-6 py-4 border-t">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Safra atual: {data.currentSafra?.nome || 'N/A'}. 
              Indicadores baseados em dados consolidados de débitos, ativos e resultados operacionais.
            </p>
          </div>
        </div>
      </Card>
      
      {/* Modal para gráfico histórico */}
      {selectedIndicator && (
        <FinancialIndicatorHistoricalModalV2
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          organizationId={organizationId}
          indicatorType={selectedIndicator.type}
          indicatorTitle={selectedIndicator.title}
        />
      )}
    </TooltipProvider>
  );
}