import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getProductionStats } from "@/lib/actions/production-stats-actions";
import { formatArea, formatCurrency, formatPercentage } from "@/lib/utils/property-formatters";
import { Sprout, TrendingUp, TrendingDown, DollarSign, BarChart3, Target, Wheat, ArrowUpIcon, ArrowDownIcon, Loader2, Info, TrendingUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { MetricHistoryChartModal } from "./metric-history-chart-modal";
import type { MetricType } from "@/lib/actions/production-historical-stats-actions";

interface KpiItemProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  loading?: boolean;
  tooltip?: string;
  onClick?: () => void;
  clickable?: boolean;
}

function KpiItem({
  title,
  value,
  change,
  isPositive,
  icon,
  loading,
  tooltip,
  onClick,
  clickable = false,
}: KpiItemProps) {
  return (
    <div 
      className={cn(
        "flex items-start p-5 transition-colors",
        clickable && "cursor-pointer hover:bg-muted/50 active:bg-muted"
      )}
      onClick={onClick}
    >
      <div className={`rounded-full p-2 mr-3 bg-primary`}>{icon}</div>
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
            <p
              className={cn(
                "flex items-center text-xs font-medium mt-1",
                change === "Sem comparação"
                  ? "text-muted-foreground"
                  : isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {change === "Sem comparação" ? (
                <Info className="h-3 w-3 mr-1" />
              ) : isPositive ? (
                <ArrowUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownIcon className="h-3 w-3 mr-1" />
              )}
              {change}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

interface ProductionKpiCardsProps {
  organizationId: string;
  propertyIds?: string[];
  safraId?: string;
}

interface ProductionKpiCardsContentProps extends ProductionKpiCardsProps {}

function ProductionKpiCardsContent({ 
  organizationId, 
  propertyIds,
  safraId 
}: ProductionKpiCardsContentProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('area');

  const handleMetricClick = (metricType: MetricType) => {
    setSelectedMetric(metricType);
    setModalOpen(true);
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getProductionStats(organizationId, propertyIds, safraId);
      setStats(result);
    } catch (err) {
      console.error("Erro ao carregar KPIs de produção:", err);
      setError("Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (organizationId) {
      loadStats();
    }
  }, [organizationId, propertyIds, safraId]);

  if (loading || error || !stats) {
    return (
      <TooltipProvider>
        <Card>
          <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-white/20">
                  <Wheat className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">
                    Resumo da Produção
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    {loading ? "Carregando..." : error ? "Erro ao carregar" : "Indicadores consolidados de produção agrícola"}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* Loading state for all 4 KPIs */}
            <div className="relative">
              <KpiItem
                title="Área Plantada"
                value="0 ha"
                change="0% YoY"
                isPositive={true}
                loading={loading}
                icon={<Sprout className="h-5 w-5 text-white dark:text-gray-700" />}
              />
              <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
            </div>

            <div className="relative">
              <KpiItem
                title="Produtividade"
                value="0 sc/ha"
                change="0% YoY"
                isPositive={true}
                loading={loading}
                icon={<Target className="h-5 w-5 text-white dark:text-gray-700" />}
              />
              <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
            </div>

            <div className="relative">
              <KpiItem
                title="Receita"
                value="R$ 0"
                change="0% YoY"
                isPositive={true}
                loading={loading}
                icon={<DollarSign className="h-5 w-5 text-white dark:text-gray-700" />}
              />
              <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
            </div>

            <div>
              <KpiItem
                title="EBITDA"
                value="R$ 0"
                change="0% margem"
                isPositive={true}
                loading={loading}
                icon={<BarChart3 className="h-5 w-5 text-white dark:text-gray-700" />}
              />
            </div>
          </div>
        </Card>
      </TooltipProvider>
    );
  }

  return (
    <>
      <TooltipProvider>
        <Card>
          <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-white/20">
                  <Wheat className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">
                    Resumo da Produção
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    Indicadores consolidados de produção agrícola
                  </CardDescription>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Indicadores consolidados da produção agrícola incluindo área plantada, 
                    produtividade média, receita operacional e margem EBITDA.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* Área Plantada */}
            <div className="relative">
              <KpiItem
                title="Área Plantada"
                value={formatArea(stats.areaPlantada)}
                change={
                  !stats.temComparacao 
                    ? "Sem comparação" 
                    : `${stats.crescimentoArea >= 0 ? '+' : ''}${formatPercentage(stats.crescimentoArea)} YoY${stats.safraComparada ? ` vs ${stats.safraComparada}` : ''}`
                }
                isPositive={stats.temComparacao ? stats.crescimentoArea >= 0 : true}
                icon={<Sprout className="h-5 w-5 text-white dark:text-gray-700" />}
                tooltip="Área total destinada ao plantio de culturas agrícolas em hectares."
                clickable={true}
                onClick={() => handleMetricClick('area')}
              />
              <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
            </div>

            {/* Produtividade */}
            <div className="relative">
              <KpiItem
                title="Produtividade"
                value={`${stats.produtividadeMedia.toFixed(1)} sc/ha`}
                change={
                  !stats.temComparacao 
                    ? "Sem comparação" 
                    : `${stats.crescimentoProdutividade >= 0 ? '+' : ''}${formatPercentage(stats.crescimentoProdutividade)} YoY${stats.safraComparada ? ` vs ${stats.safraComparada}` : ''}`
                }
                isPositive={stats.temComparacao ? stats.crescimentoProdutividade >= 0 : true}
                icon={<Target className="h-5 w-5 text-white dark:text-gray-700" />}
                tooltip="Produtividade média das culturas em sacas por hectare."
                clickable={true}
                onClick={() => handleMetricClick('produtividade')}
              />
              <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
            </div>

            {/* Receita */}
            <div className="relative">
              <KpiItem
                title="Receita"
                value={formatCurrency(stats.receita)}
                change={
                  !stats.temComparacao 
                    ? "Sem comparação" 
                    : `${stats.crescimentoReceita >= 0 ? '+' : ''}${formatPercentage(stats.crescimentoReceita)} YoY${stats.safraComparada ? ` vs ${stats.safraComparada}` : ''}`
                }
                isPositive={stats.temComparacao ? stats.crescimentoReceita >= 0 : true}
                icon={<DollarSign className="h-5 w-5 text-white dark:text-gray-700" />}
                tooltip="Receita operacional bruta estimada com base na produção e preços de mercado."
                clickable={true}
                onClick={() => handleMetricClick('receita')}
              />
              <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
            </div>

            {/* EBITDA */}
            <div>
              <KpiItem
                title="EBITDA"
                value={formatCurrency(stats.ebitda)}
                change={`${stats.margemEbitda.toFixed(1)}% margem`}
                isPositive={stats.margemEbitda > 30}
                icon={<BarChart3 className="h-5 w-5 text-white dark:text-gray-700" />}
                tooltip="Resultado operacional antes de juros, impostos, depreciação e amortização."
                clickable={true}
                onClick={() => handleMetricClick('ebitda')}
              />
            </div>
          </div>
        </Card>
      </TooltipProvider>

      {/* Modal com gráfico histórico */}
      <MetricHistoryChartModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        metricType={selectedMetric}
        organizationId={organizationId}
        propertyIds={propertyIds}
      />
    </>
  );
}

export function ProductionKpiCards({ 
  organizationId, 
  propertyIds,
  safraId 
}: ProductionKpiCardsProps) {
  return <ProductionKpiCardsContent organizationId={organizationId} propertyIds={propertyIds} safraId={safraId} />;
}