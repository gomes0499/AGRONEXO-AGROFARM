"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { StatsCard } from "@/components/production/stats/stats-card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2,
  XCircle,
  Award,
  BarChart3,
  Activity,
  DollarSign,
  Percent,
  Target,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/utils/formatters";

interface IndicatorMetric {
  name: string;
  value: number;
  weight: number;
  score: number;
  status: "excellent" | "good" | "warning" | "danger";
  icon: React.ReactNode;
  formattedValue: string;
  description: string;
}

interface RatingTabProps {
  indicators: {
    liquidez?: number;
    dividaEbitda?: number;
    dividaFaturamento?: number;
    dividaPl?: number;
    ltv?: number;
    ebitda?: number;
    margemEbitda?: number;
    roe?: number;
    roa?: number;
  };
  organizationName?: string;
}

// Função para calcular score de cada indicador (0-100)
function calculateIndicatorScore(indicatorType: string, value: number): number {
  switch (indicatorType) {
    case "liquidez":
      // Liquidez: quanto maior, melhor
      if (value >= 1.5) return 100;
      if (value >= 1.2) return 80;
      if (value >= 1.0) return 60;
      if (value >= 0.8) return 40;
      return 20;
    
    case "dividaEbitda":
      // Dívida/EBITDA: quanto menor, melhor
      if (value <= 1.5) return 100;
      if (value <= 2.5) return 80;
      if (value <= 3.5) return 60;
      if (value <= 5.0) return 40;
      return 20;
    
    case "dividaFaturamento":
      // Dívida/Faturamento: quanto menor, melhor
      if (value <= 0.3) return 100;
      if (value <= 0.5) return 80;
      if (value <= 0.7) return 60;
      if (value <= 1.0) return 40;
      return 20;
    
    case "dividaPl":
      // Dívida/PL: quanto menor, melhor
      if (value <= 0.5) return 100;
      if (value <= 0.8) return 80;
      if (value <= 1.2) return 60;
      if (value <= 1.8) return 40;
      return 20;
    
    case "ltv":
      // LTV: quanto menor, melhor
      if (value <= 0.3) return 100;
      if (value <= 0.5) return 80;
      if (value <= 0.7) return 60;
      if (value <= 0.85) return 40;
      return 20;
    
    case "margemEbitda":
      // Margem EBITDA: quanto maior, melhor
      if (value >= 25) return 100;
      if (value >= 20) return 80;
      if (value >= 15) return 60;
      if (value >= 10) return 40;
      return 20;
    
    case "roe":
      // ROE: quanto maior, melhor
      if (value >= 20) return 100;
      if (value >= 15) return 80;
      if (value >= 10) return 60;
      if (value >= 5) return 40;
      return 20;
    
    case "roa":
      // ROA: quanto maior, melhor
      if (value >= 15) return 100;
      if (value >= 10) return 80;
      if (value >= 7) return 60;
      if (value >= 3) return 40;
      return 20;
    
    default:
      return 50;
  }
}

// Função para determinar status baseado no score
function getStatusFromScore(score: number): "excellent" | "good" | "warning" | "danger" {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "warning";
  return "danger";
}

// Função para obter cor baseado no status
function getColorFromStatus(status: "excellent" | "good" | "warning" | "danger") {
  switch (status) {
    case "excellent":
      return "text-green-600 dark:text-green-400";
    case "good":
      return "text-blue-600 dark:text-blue-400";
    case "warning":
      return "text-yellow-600 dark:text-yellow-400";
    case "danger":
      return "text-red-600 dark:text-red-400";
  }
}

// Função para obter badge variant baseado no status
function getBadgeVariant(status: "excellent" | "good" | "warning" | "danger") {
  switch (status) {
    case "excellent":
      return "default" as const;
    case "good":
      return "secondary" as const;
    case "warning":
      return "outline" as const;
    case "danger":
      return "destructive" as const;
  }
}

// Função para calcular rating geral (AAA, AA, A, BBB, BB, B, CCC, CC, C, D)
function calculateGeneralRating(score: number): string {
  if (score >= 90) return "AAA";
  if (score >= 80) return "AA";
  if (score >= 70) return "A";
  if (score >= 60) return "BBB";
  if (score >= 50) return "BB";
  if (score >= 40) return "B";
  if (score >= 30) return "CCC";
  if (score >= 20) return "CC";
  if (score >= 10) return "C";
  return "D";
}

// Função para obter descrição do rating
function getRatingDescription(rating: string): string {
  switch (rating) {
    case "AAA":
      return "Excelente capacidade de pagamento. Risco mínimo.";
    case "AA":
      return "Muito boa capacidade de pagamento. Risco muito baixo.";
    case "A":
      return "Boa capacidade de pagamento. Risco baixo.";
    case "BBB":
      return "Capacidade adequada de pagamento. Risco moderado.";
    case "BB":
      return "Capacidade de pagamento com algumas incertezas. Risco médio.";
    case "B":
      return "Capacidade de pagamento vulnerável. Risco elevado.";
    case "CCC":
      return "Capacidade de pagamento frágil. Risco alto.";
    case "CC":
      return "Capacidade de pagamento muito frágil. Risco muito alto.";
    case "C":
      return "Capacidade de pagamento extremamente frágil. Risco extremo.";
    case "D":
      return "Inadimplência ou incapacidade de pagamento. Risco máximo.";
    default:
      return "Rating não disponível.";
  }
}

export function RatingTab({ indicators, organizationName = "Empresa" }: RatingTabProps) {
  const [overallScore, setOverallScore] = useState(0);
  const [rating, setRating] = useState("N/A");
  const [metrics, setMetrics] = useState<IndicatorMetric[]>([]);

  useEffect(() => {
    // Configurar métricas com pesos
    const metricsConfig = [
      {
        key: "liquidez",
        name: "Liquidez Corrente",
        weight: 0.15,
        icon: <DollarSign className="h-4 w-4 text-white" />,
        formatter: (v: number) => v.toFixed(2),
        description: "Capacidade de pagar obrigações de curto prazo"
      },
      {
        key: "dividaEbitda",
        name: "Dívida/EBITDA",
        weight: 0.20,
        icon: <BarChart3 className="h-4 w-4 text-white" />,
        formatter: (v: number) => v.toFixed(2) + "x",
        description: "Tempo necessário para quitar dívidas com o EBITDA"
      },
      {
        key: "dividaFaturamento",
        name: "Dívida/Faturamento",
        weight: 0.15,
        icon: <Activity className="h-4 w-4 text-white" />,
        formatter: (v: number) => formatPercent(v * 100),
        description: "Relação entre dívida total e receita anual"
      },
      {
        key: "dividaPl",
        name: "Dívida/Patrimônio Líquido",
        weight: 0.20,
        icon: <Target className="h-4 w-4 text-white" />,
        formatter: (v: number) => formatPercent(v * 100),
        description: "Alavancagem financeira da empresa"
      },
      {
        key: "ltv",
        name: "Loan to Value (LTV)",
        weight: 0.15,
        icon: <Percent className="h-4 w-4 text-white" />,
        formatter: (v: number) => formatPercent(v * 100),
        description: "Relação entre dívida e valor dos ativos"
      },
      {
        key: "margemEbitda",
        name: "Margem EBITDA",
        weight: 0.15,
        icon: <TrendingUp className="h-4 w-4 text-white" />,
        formatter: (v: number) => formatPercent(v),
        description: "Rentabilidade operacional"
      }
    ];

    // Calcular métricas
    const calculatedMetrics: IndicatorMetric[] = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    metricsConfig.forEach(config => {
      const value = indicators[config.key as keyof typeof indicators];
      if (value !== undefined && value !== null) {
        const score = calculateIndicatorScore(config.key, value);
        const status = getStatusFromScore(score);
        
        calculatedMetrics.push({
          name: config.name,
          value: value,
          weight: config.weight,
          score: score,
          status: status,
          icon: config.icon,
          formattedValue: config.formatter(value),
          description: config.description
        });

        totalWeightedScore += score * config.weight;
        totalWeight += config.weight;
      }
    });

    // Calcular score geral
    const finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    setOverallScore(finalScore);
    setRating(calculateGeneralRating(finalScore));
    setMetrics(calculatedMetrics);
  }, [indicators]);

  const ratingStatus = getStatusFromScore(overallScore);
  const ratingColor = getColorFromStatus(ratingStatus);

  return (
    <div className="space-y-6">
      {/* Card Principal - Rating Geral */}
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<Award className="h-5 w-5 text-white" />}
          title="Rating de Crédito"
          description={organizationName}
        />
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Rating */}
            <div>
              <div className={cn("text-7xl font-bold mb-2", ratingColor)}>
                {rating}
              </div>
              <div className="text-2xl font-semibold text-muted-foreground">
                Score: {overallScore.toFixed(0)}/100
              </div>
            </div>

            {/* Barra de progresso visual */}
            <div className="relative w-full h-6 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "absolute left-0 top-0 h-full transition-all duration-500",
                  ratingStatus === "excellent" && "bg-green-500",
                  ratingStatus === "good" && "bg-blue-500",
                  ratingStatus === "warning" && "bg-yellow-500",
                  ratingStatus === "danger" && "bg-red-500"
                )}
                style={{ width: `${overallScore}%` }}
              />
            </div>

            {/* Descrição */}
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {getRatingDescription(rating)}
            </p>

            {/* Badge de Status */}
            <div>
              <Badge 
                variant={getBadgeVariant(ratingStatus)} 
                className="text-sm px-4 py-1"
              >
                {ratingStatus === "excellent" && "Risco Mínimo"}
                {ratingStatus === "good" && "Risco Baixo"}
                {ratingStatus === "warning" && "Risco Moderado"}
                {ratingStatus === "danger" && "Risco Alto"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas Individuais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <StatsCard
            key={index}
            title={metric.name}
            value={metric.formattedValue}
            description={`Score: ${metric.score.toFixed(0)}/100 • Peso: ${(metric.weight * 100).toFixed(0)}%`}
            icon={metric.icon}
            footer={
              <div className="space-y-2">
                <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "absolute left-0 top-0 h-full transition-all",
                      metric.status === "excellent" && "bg-green-500",
                      metric.status === "good" && "bg-blue-500",
                      metric.status === "warning" && "bg-yellow-500",
                      metric.status === "danger" && "bg-red-500"
                    )}
                    style={{ width: `${metric.score}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </div>
            }
          />
        ))}
      </div>

      {/* Card de Metodologia */}
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<Info className="h-4 w-4 text-white" />}
          title="Metodologia de Cálculo"
          description="Como calculamos o rating de crédito"
        />
        <CardContent className="p-6 space-y-6">
          <div>
            <h4 className="font-semibold mb-3">Processo de Avaliação</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>Cada indicador recebe um score de 0 a 100 baseado em faixas de referência do mercado</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>O score final é a média ponderada dos scores individuais</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>O rating varia de AAA (melhor) até D (pior)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>A análise considera liquidez, endividamento e rentabilidade</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Escala de Rating</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="font-bold text-green-600 dark:text-green-400">AAA - AA</div>
                <div className="text-xs text-muted-foreground mt-1">Excelente</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="font-bold text-blue-600 dark:text-blue-400">A - BBB</div>
                <div className="text-xs text-muted-foreground mt-1">Bom</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="font-bold text-yellow-600 dark:text-yellow-400">BB - B</div>
                <div className="text-xs text-muted-foreground mt-1">Moderado</div>
              </div>
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="font-bold text-orange-600 dark:text-orange-400">CCC - CC</div>
                <div className="text-xs text-muted-foreground mt-1">Alto Risco</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="font-bold text-red-600 dark:text-red-400">C - D</div>
                <div className="text-xs text-muted-foreground mt-1">Crítico</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}