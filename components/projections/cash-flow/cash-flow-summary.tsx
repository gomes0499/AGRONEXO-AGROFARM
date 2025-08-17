"use client";

import { useState } from "react";
import { StatsCard } from "@/components/production/stats/stats-card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Info,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import type { FluxoCaixaData } from "@/lib/actions/projections-actions/fluxo-caixa-simplificado";

interface CashFlowSummaryProps {
  data: FluxoCaixaData;
  selectedYear?: string;
  onYearChange?: (year: string) => void;
}

export function CashFlowSummary({ data, selectedYear, onYearChange }: CashFlowSummaryProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Usar todos os anos disponíveis
  const anosFiltrados = data.anos;
  const currentYear = selectedYear || anosFiltrados[0];

  // Calcular métricas para o ano selecionado
  const getYearMetrics = (year: string) => {
    const receitas = data.receitas_agricolas?.total_por_ano?.[year] || 0;
    const despesasAgricolas = data.despesas_agricolas?.total_por_ano?.[year] || 0;
    const outrasDespesas = data.outras_despesas?.total_por_ano?.[year] || 0;
    const investimentos = data.investimentos?.total?.[year] || 0;
    const servicoDivida = data.financeiras?.servico_divida?.[year] || 0;
    const novoCredito = data.financeiras?.novas_linhas_credito?.[year] || 0;
    
    const margemBruta = receitas + despesasAgricolas;
    const resultadoOperacional = margemBruta + outrasDespesas;
    const fluxoAntes = resultadoOperacional + investimentos;
    const fluxoFinal = fluxoAntes + servicoDivida + novoCredito;

    return {
      receitas,
      despesasAgricolas,
      outrasDespesas,
      investimentos,
      servicoDivida,
      novoCredito,
      margemBruta,
      resultadoOperacional,
      fluxoAntes,
      fluxoFinal,
    };
  };

  const metrics = getYearMetrics(currentYear);
  const previousYear = anosFiltrados[anosFiltrados.indexOf(currentYear) - 1];
  const previousMetrics = previousYear ? getYearMetrics(previousYear) : null;

  // Calcular variações
  const calculateVariation = (current: number, previous: number | null) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const fluxoVariation = previousMetrics 
    ? calculateVariation(metrics.fluxoFinal, previousMetrics.fluxoFinal)
    : null;

  // Status do fluxo
  const getFluxoStatus = (value: number) => {
    if (value > 0) return { color: "text-green-600", icon: CheckCircle, label: "Positivo" };
    if (value < 0) return { color: "text-red-600", icon: XCircle, label: "Negativo" };
    return { color: "text-gray-600", icon: AlertCircle, label: "Neutro" };
  };

  const fluxoStatus = getFluxoStatus(metrics.fluxoFinal);

  const sections = [
    {
      id: "receitas",
      title: "Receitas Agrícolas",
      value: metrics.receitas,
      icon: TrendingUp,
      color: "text-green-600",
      details: Object.entries(data.receitas_agricolas?.culturas || {}).map(([cultura, valores]) => ({
        label: cultura,
        value: valores[currentYear] || 0,
      })),
    },
    {
      id: "despesas",
      title: "Despesas Totais",
      value: metrics.despesasAgricolas + metrics.outrasDespesas,
      icon: TrendingDown,
      color: "text-red-600",
      details: [
        { label: "Despesas Agrícolas", value: metrics.despesasAgricolas },
        { label: "Outras Despesas", value: metrics.outrasDespesas },
      ],
    },
    {
      id: "investimentos",
      title: "Investimentos",
      value: metrics.investimentos,
      icon: DollarSign,
      color: "text-blue-600",
      details: [
        { label: "Terras", value: data.investimentos?.terras?.[currentYear] || 0 },
        { label: "Maquinários", value: data.investimentos?.maquinarios?.[currentYear] || 0 },
        { label: "Outros", value: data.investimentos?.outros?.[currentYear] || 0 },
        { label: "(-) Vendas de Ativos", value: -(data.investimentos?.vendas_ativos?.[currentYear] || 0) },
      ],
    },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Seletor de Ano */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Resumo do Fluxo de Caixa</h3>
        <div className="flex items-center gap-4">
          <select
            value={currentYear}
            onChange={(e) => onYearChange?.(e.target.value)}
            className="px-3 py-1.5 border rounded-md bg-background"
          >
            {anosFiltrados.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
          <div className={cn("flex items-center gap-2", fluxoStatus.color)}>
            <fluxoStatus.icon className="h-5 w-5" />
            <span className="font-medium">{fluxoStatus.label}</span>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Fluxo de Caixa Final"
          value={formatCurrency(metrics.fluxoFinal)}
          description={fluxoVariation !== null ? 
            `${fluxoVariation > 0 ? '+' : ''}${fluxoVariation.toFixed(1)}% vs ano anterior` : 
            undefined
          }
          trend={fluxoVariation !== null ? {
            value: Math.abs(fluxoVariation),
            positive: fluxoVariation > 0,
            label: "vs ano anterior"
          } : undefined}
          icon={<Activity className="h-5 w-5 text-white" />}
        />
        
        <StatsCard
          title="Margem Bruta"
          value={formatCurrency(metrics.margemBruta)}
          description={`${((metrics.margemBruta / metrics.receitas) * 100).toFixed(1)}% das receitas`}
          icon={<TrendingUp className="h-5 w-5 text-white" />}
        />
        
        <StatsCard
          title="Resultado Operacional"
          value={formatCurrency(metrics.resultadoOperacional)}
          icon={<BarChart3 className="h-5 w-5 text-white" />}
        />
        
        <StatsCard
          title="Serviço da Dívida"
          value={formatCurrency(Math.abs(metrics.servicoDivida))}
          description={`${Math.abs((metrics.servicoDivida / metrics.receitas) * 100).toFixed(1)}% das receitas`}
          icon={<DollarSign className="h-5 w-5 text-white" />}
        />
      </div>

      {/* Cards de Detalhamento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((section) => (
          <StatsCard
            key={section.id}
            title={section.title}
            value={formatCurrency(section.value)}
            icon={
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                    <section.icon className="h-5 w-5 text-white" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <p className="font-medium text-sm">{section.title}</p>
                    <div className="space-y-1">
                      {section.details.map((detail, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{detail.label}</span>
                          <span className="font-medium">
                            {formatCurrency(detail.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            }
            footer={
              expandedSection === section.id ? (
                <div className="space-y-1">
                  {section.details.map((detail, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{detail.label}</span>
                      <span>{formatCurrency(detail.value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedSection(
                    expandedSection === section.id ? null : section.id
                  )}
                  className="w-full"
                >
                  Ver detalhes
                </Button>
              )
            }
          />
        ))}
      </div>

      {/* Indicadores de Alerta */}
      <div className="flex flex-wrap gap-2">
        {metrics.fluxoFinal < 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Fluxo negativo - Atenção ao endividamento</span>
          </div>
        )}
        {Math.abs(metrics.servicoDivida / metrics.receitas) > 0.3 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Serviço da dívida alto (&gt;30% das receitas)</span>
          </div>
        )}
        {metrics.margemBruta < 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm">
            <XCircle className="h-4 w-4" />
            <span>Margem bruta negativa</span>
          </div>
        )}
      </div>
    </div>
  );
}