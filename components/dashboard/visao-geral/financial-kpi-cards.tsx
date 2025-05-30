import { Suspense, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getFinancialMetrics } from "@/lib/actions/financial-metrics-actions";
import type { FinancialMetrics } from "@/lib/actions/financial-metrics-actions";
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
import { createClient } from "@/lib/supabase/client";
import { defaultIndicatorConfigs, type IndicatorThreshold } from "@/schemas/indicators";
import { IndicatorValueBadge } from "@/components/indicators/indicator-value-badge";

interface SafraOption {
  id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
}

interface FinancialKpiCardsProps {
  organizationId: string;
  safraId?: string;
}

interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  changeIcon?: React.ReactNode;
  tooltip?: string;
}

interface FinancialKpiCardsContentProps extends FinancialKpiCardsProps {}

function KpiCard({ title, value, change, changeType, icon, changeIcon, tooltip }: KpiCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-emerald-600 dark:text-emerald-400";
      case "negative":
        return "text-rose-600 dark:text-rose-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getChangeIcon = () => {
    if (changeIcon) return changeIcon;
    
    switch (changeType) {
      case "positive":
        return <ArrowUpIcon className="h-3 w-3 mr-1" />;
      case "negative":
        return <ArrowDownIcon className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  // Determinar badge de status com base no changeType
  const getStatusBadge = () => {
    switch (changeType) {
      case "positive":
        return (
          <Badge 
            variant="outline" 
            className="text-xs ml-2"
            style={{
              backgroundColor: "#52C41A20",
              color: "#52C41A",
              borderColor: "#52C41A",
            }}
          >
            Bom
          </Badge>
        );
      case "negative":
        return (
          <Badge 
            variant="outline" 
            className="text-xs ml-2"
            style={{
              backgroundColor: "#FF4D4F20",
              color: "#FF4D4F",
              borderColor: "#FF4D4F",
            }}
          >
            Atenção
          </Badge>
        );
      default:
        return (
          <Badge 
            variant="outline" 
            className="text-xs ml-2"
            style={{
              backgroundColor: "#1890FF20",
              color: "#1890FF",
              borderColor: "#1890FF",
            }}
          >
            Estável
          </Badge>
        );
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between mt-1">
          <div className={cn("flex items-center text-xs", getChangeColor())}>
            {getChangeIcon()}
            {change}
          </div>
          {getStatusBadge()}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FinancialKpiCardsContent({ organizationId, safraId: initialSafraId }: FinancialKpiCardsContentProps) {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [safras, setSafras] = useState<SafraOption[]>([]);
  const [selectedSafraId, setSelectedSafraId] = useState<string>(initialSafraId || "");
  const [loadingSafras, setLoadingSafras] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Carregar as safras disponíveis
  useEffect(() => {
    async function fetchSafras() {
      try {
        setLoadingSafras(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("safras")
          .select("id, nome, ano_inicio, ano_fim")
          .eq("organizacao_id", organizationId)
          .order("ano_inicio", { ascending: false });

        if (error) {
          console.error("Erro ao buscar safras:", error);
          return;
        }

        setSafras(data || []);

        // Definir safra atual como padrão se não estiver definida
        if (!selectedSafraId && data && data.length > 0) {
          const currentYear = new Date().getFullYear();
          const currentSafra =
            data?.find((s) => s.ano_inicio === currentYear) || data?.[0];
          if (currentSafra) {
            setSelectedSafraId(currentSafra.id);
            setSelectedYear(currentSafra.ano_inicio);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar safras:", error);
      } finally {
        setLoadingSafras(false);
      }
    }

    if (organizationId) {
      fetchSafras();
    }
  }, [organizationId]);

  // Carregar métricas financeiras quando a safra mudar
  useEffect(() => {
    const loadMetrics = async () => {
      if (!organizationId || !selectedSafraId) return;

      try {
        setLoading(true);
        setError(null);

        // Buscar o ano correspondente à safra selecionada
        const safra = safras.find(s => s.id === selectedSafraId);
        const yearToUse = safra?.ano_inicio || new Date().getFullYear();
        
        setSelectedYear(yearToUse);
        const result = await getFinancialMetrics(organizationId, yearToUse);
        setMetrics(result);
      } catch (err) {
        console.error("Erro ao carregar métricas financeiras:", err);
        setError("Erro ao carregar métricas");
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [organizationId, selectedSafraId, safras]);

  const formatMilhoes = (valor: number) => {
    return `R$ ${(valor / 1000000).toFixed(1)}M`;
  };

  const formatAnos = (valor: number) => {
    return `${valor.toFixed(1)} anos`;
  };

  const getChangeType = (percentual: number): "positive" | "negative" | "neutral" => {
    if (Math.abs(percentual) < 0.1) return "neutral";
    return percentual >= 0 ? "positive" : "negative";
  };

  const getDividaChangeType = (percentual: number): "positive" | "negative" | "neutral" => {
    // Para dívida, uma redução (negativo) é positiva
    if (Math.abs(percentual) < 0.1) return "neutral";
    return percentual < 0 ? "positive" : "negative";
  };

  const formatRatio = (value: number) => {
    return value.toFixed(1) + "x";
  };

  const getIndicatorChangeType = (value: number, threshold1: number, threshold2: number): "positive" | "negative" | "neutral" => {
    // Para indicadores de dívida, quanto menor, melhor
    if (value <= threshold1) return "positive";
    if (value <= threshold2) return "neutral";
    return "negative";
  };

  const handleSafraChange = (value: string) => {
    setSelectedSafraId(value);
  };
  
  if (loading || !metrics) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid gap-4">
        {/* Cabeçalho com seletor de safra */}
        <Card className="border-border/50">
          <CardHeader className="bg-primary text-white rounded-t-lg pb-4 flex flex-row justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Resumo Financeiro</CardTitle>
                <CardDescription className="text-white/80">
                  Indicadores consolidados de endividamento e liquidez
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {loadingSafras ? (
                <div className="h-9 w-48 bg-white/10 rounded animate-pulse" />
              ) : (
                <Select value={selectedSafraId} onValueChange={handleSafraChange}>
                  <SelectTrigger className="w-48 h-9 bg-white/10 border-white/20 text-white focus:ring-white/30 placeholder:text-white/60">
                    <SelectValue placeholder="Selecionar safra" />
                  </SelectTrigger>
                  <SelectContent>
                    {safras.map((safra) => (
                      <SelectItem key={safra.id} value={safra.id}>
                        {safra.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Indicadores consolidados de endividamento e liquidez. Valores são 
                    atualizados conforme a safra selecionada.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
        </Card>

        {/* Primeira linha de KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="DÍVIDA BANCÁRIA"
            value={formatMilhoes(metrics.dividaBancaria.valorAtual)}
            change={`${metrics.dividaBancaria.percentualMudanca > 0 ? '+' : ''}${metrics.dividaBancaria.percentualMudanca.toFixed(1)}% YoY`}
            changeType={getDividaChangeType(metrics.dividaBancaria.percentualMudanca)}
            icon={<Building2Icon className="h-4 w-4 text-white" />}
            tooltip="Total de dívidas com instituições financeiras (bancos)."
          />

          <KpiCard
            title="OUTROS PASSIVOS"
            value={formatMilhoes(metrics.outrosPassivos.valorAtual)}
            change={`${metrics.outrosPassivos.percentualMudanca > 0 ? '+' : ''}${metrics.outrosPassivos.percentualMudanca.toFixed(1)}% YoY`}
            changeType={getDividaChangeType(metrics.outrosPassivos.percentualMudanca)}
            icon={<FileTextIcon className="h-4 w-4 text-white" />}
            tooltip="Inclui dívidas com tradings, fornecedores, arrendamentos e outros passivos."
          />

          <KpiCard
            title="DÍVIDA LÍQUIDA"
            value={formatMilhoes(metrics.dividaLiquida.valorAtual)}
            change={`${metrics.dividaLiquida.percentualMudanca > 0 ? '+' : ''}${metrics.dividaLiquida.percentualMudanca.toFixed(1)}% YoY`}
            changeType={getDividaChangeType(metrics.dividaLiquida.percentualMudanca)}
            icon={<TrendingDownIcon className="h-4 w-4 text-white" />}
            tooltip="Dívida total menos ativos financeiros (caixa, estoques, recebíveis)."
          />

          <KpiCard
            title="PRAZO MÉDIO"
            value={formatAnos(metrics.prazoMedio.valorAtual)}
            change={`vs ${formatAnos(metrics.prazoMedio.valorAnterior)} ant.`}
            changeType={metrics.prazoMedio.valorAtual > 5 ? "positive" : metrics.prazoMedio.valorAtual > 3 ? "neutral" : "negative"}
            icon={<ClockIcon className="h-4 w-4 text-white" />}
            changeIcon={<ClockIcon className="h-3 w-3 mr-1" />}
            tooltip="Prazo médio ponderado para vencimento das dívidas."
          />
        </div>
        
        {/* Novos indicadores de endividamento */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <IndicatorKpiCard
            title="DÍVIDA/RECEITA"
            value={metrics.indicadores.dividaReceita}
            formatValue={formatRatio}
            indicatorType="DIVIDA_FATURAMENTO"
            icon={<TrendingDownIcon className="h-4 w-4 text-white" />}
            tooltip="Relação entre dívida total e receita bruta anual. Indica quantos anos de receita seriam necessários para quitar toda a dívida. O badge indica o nível de risco com base nos limiares configurados."
            organizationId={organizationId}
          />
          
          <IndicatorKpiCard
            title="DÍVIDA/EBITDA"
            value={metrics.indicadores.dividaEbitda}
            formatValue={formatRatio}
            indicatorType="DIVIDA_EBITDA"
            icon={<TrendingDownIcon className="h-4 w-4 text-white" />}
            tooltip="Relação entre dívida total e EBITDA anual. Indica quantos anos de resultado operacional seriam necessários para quitar toda a dívida. O badge indica o nível de risco com base nos limiares configurados."
            organizationId={organizationId}
          />
          
          <IndicatorKpiCard
            title="DÍV. LÍQUIDA/RECEITA"
            value={metrics.indicadores.dividaLiquidaReceita}
            formatValue={formatRatio}
            indicatorType="DIVIDA_FATURAMENTO"
            icon={<TrendingDownIcon className="h-4 w-4 text-white" />}
            tooltip="Relação entre dívida líquida e receita bruta anual. Mais preciso por considerar os ativos financeiros disponíveis. O badge indica o nível de risco com base nos limiares configurados."
            organizationId={organizationId}
          />
          
          <IndicatorKpiCard
            title="DÍV. LÍQUIDA/EBITDA"
            value={metrics.indicadores.dividaLiquidaEbitda}
            formatValue={formatRatio}
            indicatorType="DIVIDA_EBITDA"
            icon={<TrendingDownIcon className="h-4 w-4 text-white" />}
            tooltip="Relação entre dívida líquida e EBITDA anual. Métrica chave de capacidade de pagamento utilizada por bancos e agências de rating. O badge indica o nível de risco com base nos limiares configurados."
            organizationId={organizationId}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

interface IndicatorKpiCardProps {
  title: string;
  value: number;
  formatValue: (value: number) => string;
  indicatorType: string;
  icon: React.ReactNode;
  tooltip?: string;
  organizationId: string;
}

function IndicatorKpiCard({ 
  title, 
  value, 
  formatValue,
  indicatorType, 
  icon, 
  tooltip,
  organizationId 
}: IndicatorKpiCardProps) {
  const [thresholds, setThresholds] = useState<IndicatorThreshold[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use default thresholds from schema
    const defaultThresholds = defaultIndicatorConfigs[indicatorType as keyof typeof defaultIndicatorConfigs] || [];
    setThresholds(defaultThresholds as IndicatorThreshold[]);
    setLoading(false);

    // Try to fetch organization-specific thresholds
    const fetchIndicatorConfig = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("configuracao_indicador")
          .select("*")
          .eq("organizacaoId", organizationId)
          .eq("indicatorType", indicatorType)
          .single();

        if (error) {
          console.warn(`Usando limiares padrão para ${indicatorType}:`, error.message);
          return;
        }

        if (data && data.thresholds) {
          setThresholds(data.thresholds);
        }
      } catch (err) {
        console.error("Erro ao buscar limiares:", err);
      }
    };

    fetchIndicatorConfig();
  }, [indicatorType, organizationId]);

  // Determine level based on thresholds
  const getIndicatorLevel = () => {
    if (!thresholds || thresholds.length === 0) return null;

    for (const threshold of thresholds) {
      const min = threshold.min;
      const max = threshold.max;
      
      if (max === undefined) {
        if (value >= min) return threshold;
      } else {
        if (value >= min && value <= max) return threshold;
      }
    }
    
    return null;
  };

  const level = getIndicatorLevel();

  const getChangeType = (): "positive" | "negative" | "neutral" => {
    if (!level) return "neutral";
    
    // Para DIVIDA_EBITDA e DIVIDA_FATURAMENTO, quanto menor, melhor
    if (indicatorType === "DIVIDA_EBITDA" || indicatorType === "DIVIDA_FATURAMENTO") {
      if (level.level === "BOM" || level.level === "MUITO_BOM") return "positive";
      if (level.level === "CONFORTAVEL") return "neutral";
      return "negative";
    }
    
    // Para outros indicadores (ex: LIQUIDEZ), quanto maior, melhor
    if (level.level === "BOM" || level.level === "MUITO_BOM") return "positive";
    if (level.level === "CONFORTAVEL") return "neutral";
    return "negative";
  };

  const getChangeColor = () => {
    switch (getChangeType()) {
      case "positive":
        return "text-emerald-600 dark:text-emerald-400";
      case "negative":
        return "text-rose-600 dark:text-rose-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getChangeIcon = () => {
    switch (getChangeType()) {
      case "positive":
        return <ArrowUpIcon className="h-3 w-3 mr-1" />;
      case "negative":
        return <ArrowDownIcon className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  const getIdealValueText = () => {
    if (indicatorType === "DIVIDA_EBITDA") return "Ideal: até 3,0x";
    if (indicatorType === "DIVIDA_FATURAMENTO") return "Ideal: até 2,0x";
    return "";
  };

  const getLevelBadgeVariant = () => {
    if (!level) return "outline";
    
    switch (level.level) {
      case "MUITO_BOM":
        return "outline";
      case "BOM":
        return "outline";
      case "CONFORTAVEL":
        return "outline";
      case "ATENCAO":
        return "outline";
      case "THRESHOLD":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getLevelBadgeText = () => {
    if (!level) return "";
    
    switch (level.level) {
      case "MUITO_BOM":
        return "Muito Bom";
      case "BOM":
        return "Bom";
      case "CONFORTAVEL":
        return "Confortável";
      case "ATENCAO":
        return "Atenção";
      case "THRESHOLD":
        return "Crítico";
      default:
        if (level && typeof level === 'object' && 'level' in level) {
          const levelValue = level.level;
          if (levelValue) {
            // Convert to string to ensure type safety
            const levelStr = String(levelValue);
            // Now we can safely perform string operations
            if (levelStr.indexOf('_') !== -1) {
              return levelStr.split('_').join(' ');
            }
            return levelStr;
          }
        }
        return "Desconhecido";
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        <div className="flex items-center justify-between mt-1">
          <div className={cn("flex items-center text-xs", getChangeColor())}>
            {getChangeIcon()}
            {getIdealValueText()}
          </div>
          
          {level && !loading && (
            <Badge
              variant="outline"
              className="ml-2 text-xs"
              style={{
                backgroundColor: `${level.color}20`,
                color: level.color,
                borderColor: level.color,
              }}
            >
              {getLevelBadgeText()}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function FinancialKpiCards({ organizationId }: FinancialKpiCardsProps) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <FinancialKpiCardsContent organizationId={organizationId} />
    </Suspense>
  );
}