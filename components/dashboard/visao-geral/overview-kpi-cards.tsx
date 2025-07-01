"use client";

import type React from "react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  HomeIcon,
  MapIcon,
  BanknoteIcon,
  SproutIcon,
  TreePineIcon,
  ShieldIcon,
  DropletsIcon,
  LeafIcon,
  Loader2,
  Info,
  BarChart3,
  Target,
  DollarSign,
  TrendingUp,
  Building2,
  FileText,
  TrendingDown,
  Clock,
  Home,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useState, useTransition, useMemo, useEffect } from "react";
import {
  formatArea,
  formatCurrency,
  formatPercentage,
} from "@/lib/utils/property-formatters";
import { useDashboardFilterContext } from "@/components/dashboard/dashboard-filter-provider";
import { BrazilMapSvg } from "@/components/properties/brazil-map-svg";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { AreaPlantadaChartClient as AreaPlantadaChart } from "@/components/production/stats/area-plantada-chart";
import { ProdutividadeChartClient as ProdutividadeChart } from "@/components/production/stats/produtividade-chart";
import { ReceitaChartClient as ReceitaChart } from "@/components/production/stats/receita-chart";
import { FinancialChartClient as FinancialChart } from "@/components/production/stats/financial-chart";
import {
  getOverviewKpiData,
  type OverviewKpiData,
} from "@/lib/actions/overview-kpi-data-actions";

interface OverviewKpiCardsProps {
  organizationId: string;
  projectionId?: string;
  initialData: OverviewKpiData;
}

interface KpiItemProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  loading?: boolean;
  tooltip?: string;
  clickable?: boolean;
  onClick?: () => void;
  isProjection?: boolean;
  chartData?: any[];
  chartType?: "area" | "bar" | "productivity" | "revenue" | "financial";
}

function KpiItem({
  title,
  value,
  change,
  isPositive,
  icon,
  loading = false,
  tooltip,
  clickable = false,
  onClick,
  isProjection = false,
  chartData,
  chartType,
}: KpiItemProps) {
  const [showChart, setShowChart] = useState(false);

  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    } else if (chartData && chartType) {
      setShowChart(true);
    }
  };

  return (
    <>
      <Card
        className={cn(
          "border transition-colors hover:bg-muted/50",
          (clickable || (chartData && chartType)) && "cursor-pointer"
        )}
        onClick={handleClick}
      >
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {isProjection && (
                <Badge variant="secondary" className="mb-1">
                  Projeção
                </Badge>
              )}
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-medium text-muted-foreground">
                  {title}
                </CardTitle>
                {tooltip && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p className="text-sm">{tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando...
                </span>
              ) : (
                value
              )}
            </p>
            <div className="flex items-center gap-1 text-sm">
              <span
                className={cn(
                  "flex items-center",
                  isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                {isPositive ? (
                  <ArrowUpIcon className="h-3 w-3" />
                ) : (
                  <ArrowDownIcon className="h-3 w-3" />
                )}
                {change}
              </span>
              <span className="text-muted-foreground">vs. ano passado</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {chartData && chartType && (
        <Dialog open={showChart} onOpenChange={setShowChart}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{title} - Histórico</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {chartType === "area" && <AreaPlantadaChart organizationId="" initialData={{ chartData: [], culturaColors: {}, safras: [] }} />}
              {chartType === "productivity" && (
                <ProdutividadeChart organizationId="" initialData={{ chartData: [], culturaColors: {}, safras: [] }} />
              )}
              {chartType === "revenue" && <ReceitaChart organizationId="" initialData={{ chartData: [], culturaColors: {}, safras: [] }} />}
              {chartType === "financial" && <FinancialChart organizationId="" initialData={{ chartData: [], safras: [] }} />}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export function OverviewKpiCards({
  organizationId,
  projectionId,
  initialData,
}: OverviewKpiCardsProps) {
  const { filters, getFilteredPropertyIds, allPropertyIds } =
    useDashboardFilterContext();
  const [isPending, startTransition] = useTransition();

  // Use initial data from server
  const [data, setData] = useState(initialData);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);

  // Reload data when filters change
  useEffect(() => {
    if (filters.propertyIds.length > 0) {
      startTransition(async () => {
        const filteredPropertyIds = getFilteredPropertyIds(allPropertyIds);
        const newData = await getOverviewKpiData(
          organizationId,
          filteredPropertyIds,
          projectionId
        );
        setData(newData);
      });
    }
  }, [
    filters.propertyIds,
    organizationId,
    projectionId,
    getFilteredPropertyIds,
    allPropertyIds,
  ]);

  // Calculate all metrics using memoization
  const metrics = useMemo(() => {
    const {
      properties,
      propertyStats,
      sicarData,
      productionData,
      financialData,
      extendedFinancialData,
    } = data;

    return {
      // Property metrics
      totalProperties: properties.length,
      totalArea: properties.reduce((acc: number, p: any) => acc + (p.area_total || 0), 0),

      // Environmental metrics (SICAR)
      environmentalCompliance:
        sicarData.percentualReservaLegal >= 20
          ? 100
          : sicarData.percentualReservaLegal * 5,
      waterResources: sicarData.percentualRecursosHidricos,

      // Production metrics
      productivity: productionData?.produtividade || 0,
      productivityChange: productionData?.produtividadeVariacao || 0,
      revenue: productionData?.receita || 0,
      revenueChange: productionData?.receitaVariacao || 0,

      // Financial metrics
      ebitda: productionData?.ebitda || 0,
      ebitdaMargin: productionData?.margemEbitda || 0,
      netDebt: financialData?.dividaLiquida?.valorAtual || 0,
      netDebtChange: financialData?.dividaLiquida?.variacao || 0,

      // Debt indicators
      debtToRevenue: extendedFinancialData.dividaReceita,
      debtToEbitda: extendedFinancialData.dividaEbitda,
      netDebtToEbitda: extendedFinancialData.dividaLiquidaEbitda,
    };
  }, [data]);

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <KpiItem
        title="Propriedades"
        value={metrics.totalProperties.toString()}
        change={`${formatArea(metrics.totalArea)} ha`}
        isPositive={true}
        icon={<HomeIcon className="h-4 w-4" />}
        loading={isPending}
        clickable={true}
        onClick={() => setShowPropertyDialog(true)}
        isProjection={!!projectionId}
      />

      <KpiItem
        title="Conformidade Ambiental"
        value={`${metrics.environmentalCompliance.toFixed(0)}%`}
        change={`${metrics.waterResources.toFixed(1)}% APP`}
        isPositive={metrics.environmentalCompliance >= 80}
        icon={<ShieldIcon className="h-4 w-4" />}
        loading={isPending}
        tooltip="Percentual de conformidade com requisitos ambientais (Reserva Legal e APP)"
        isProjection={!!projectionId}
      />

      <KpiItem
        title="Produtividade Média"
        value={`${metrics.productivity.toFixed(0)} sc/ha`}
        change={`${metrics.productivityChange.toFixed(1)}%`}
        isPositive={metrics.productivityChange > 0}
        icon={<SproutIcon className="h-4 w-4" />}
        loading={isPending}
        chartData={data.productionData?.produtividadeHistorico}
        chartType="productivity"
        isProjection={!!projectionId}
      />

      <KpiItem
        title="Receita Total"
        value={formatCurrency(metrics.revenue)}
        change={`${metrics.revenueChange.toFixed(1)}%`}
        isPositive={metrics.revenueChange > 0}
        icon={<DollarSign className="h-4 w-4" />}
        loading={isPending}
        chartData={data.productionData?.receitaHistorico}
        chartType="revenue"
        isProjection={!!projectionId}
      />

      <KpiItem
        title="EBITDA"
        value={formatCurrency(metrics.ebitda)}
        change={`${metrics.ebitdaMargin.toFixed(1)}% margem`}
        isPositive={metrics.ebitdaMargin > 20}
        icon={<TrendingUp className="h-4 w-4" />}
        loading={isPending}
        tooltip="Lucro antes de juros, impostos, depreciação e amortização"
        chartData={data.financialData?.ebitdaHistorico}
        chartType="financial"
        isProjection={!!projectionId}
      />

      <KpiItem
        title="Dívida Líquida"
        value={formatCurrency(metrics.netDebt)}
        change={`${metrics.netDebtChange.toFixed(1)}%`}
        isPositive={metrics.netDebtChange < 0}
        icon={<BanknoteIcon className="h-4 w-4" />}
        loading={isPending}
        tooltip="Dívida total menos caixa e equivalentes"
        isProjection={!!projectionId}
      />

      <KpiItem
        title="Dívida/EBITDA"
        value={
          metrics.debtToEbitda ? `${metrics.debtToEbitda.toFixed(2)}x` : "N/A"
        }
        change={
          metrics.netDebtToEbitda
            ? `Líq: ${metrics.netDebtToEbitda.toFixed(2)}x`
            : "N/A"
        }
        isPositive={(metrics.debtToEbitda || 0) < 3}
        icon={<Target className="h-4 w-4" />}
        loading={isPending}
        tooltip="Indicador de alavancagem financeira (ideal < 3x)"
        isProjection={!!projectionId}
      />

      <KpiItem
        title="Dívida/Receita"
        value={
          metrics.debtToRevenue
            ? `${(metrics.debtToRevenue * 100).toFixed(0)}%`
            : "N/A"
        }
        change={
          metrics.netDebtToEbitda
            ? `${((metrics.netDebt / metrics.revenue) * 100).toFixed(0)}% líq`
            : "N/A"
        }
        isPositive={(metrics.debtToRevenue || 0) < 0.5}
        icon={<BarChart3 className="h-4 w-4" />}
        loading={isPending}
        tooltip="Percentual da dívida em relação à receita anual"
        isProjection={!!projectionId}
      />

      {/* Property Details Dialog */}
      <Dialog open={showPropertyDialog} onOpenChange={setShowPropertyDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Distribuição Geográfica das Propriedades</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <BrazilMapSvg
              estadosData={data.propertyStats}
              className="w-full h-[500px]"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
