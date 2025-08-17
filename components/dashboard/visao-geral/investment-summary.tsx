"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { StatsCard } from "@/components/production/stats/stats-card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Tractor,
  Package,
  ChevronDown,
  ChevronUp,
  Activity,
  ArrowDownCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import type { FluxoCaixaData } from "@/lib/actions/projections-actions/fluxo-caixa-simplificado";

interface InvestmentSummaryProps {
  data: FluxoCaixaData;
  selectedYear?: string;
  onYearChange?: (year: string) => void;
}

export function InvestmentSummary({ data, selectedYear, onYearChange }: InvestmentSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Usar todos os anos disponíveis
  const anosFiltrados = data.anos;
  const currentYear = selectedYear || anosFiltrados[0];

  // Calcular métricas para o ano selecionado
  const getYearMetrics = (year: string) => {
    const terras = data.investimentos?.terras?.[year] || 0;
    const maquinarios = data.investimentos?.maquinarios?.[year] || 0;
    const outros = data.investimentos?.outros?.[year] || 0;
    const vendasAtivos = data.investimentos?.vendas_ativos?.[year] || 0;
    
    const investimentoBruto = terras + maquinarios + outros;
    const investimentoLiquido = investimentoBruto - vendasAtivos;

    return {
      terras,
      maquinarios,
      outros,
      vendasAtivos,
      investimentoBruto,
      investimentoLiquido,
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

  const investimentoVariation = previousMetrics 
    ? calculateVariation(metrics.investimentoLiquido, previousMetrics.investimentoLiquido)
    : null;

  return (
    <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
      <CardHeaderPrimary
        icon={<DollarSign className="h-4 w-4" />}
        title="Investimentos e Vendas de Ativos"
        description="Resumo consolidado de investimentos e desinvestimentos"
      />
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Seletor de Ano */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Fluxo de Investimentos</h3>
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
          </div>

          {/* Cards de Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard
              title="Investimento Líquido"
              value={formatCurrency(metrics.investimentoLiquido)}
              description={investimentoVariation !== null ? 
                `${investimentoVariation > 0 ? '+' : ''}${investimentoVariation.toFixed(1)}% vs ano anterior` : 
                undefined
              }
              trend={investimentoVariation !== null ? {
                value: Math.abs(investimentoVariation),
                positive: investimentoVariation > 0,
                label: "vs ano anterior"
              } : undefined}
              icon={<Activity className="h-5 w-5 text-white" />}
            />
            
            <StatsCard
              title="Investimento Bruto"
              value={formatCurrency(metrics.investimentoBruto)}
              icon={<TrendingUp className="h-5 w-5 text-white" />}
            />
            
            <StatsCard
              title="Vendas de Ativos"
              value={formatCurrency(metrics.vendasAtivos)}
              description={metrics.investimentoBruto > 0 ? 
                `${((metrics.vendasAtivos / metrics.investimentoBruto) * 100).toFixed(1)}% do investimento bruto` : 
                undefined
              }
              icon={<ArrowDownCircle className="h-5 w-5 text-white" />}
            />
          </div>

          {/* Detalhamento */}
          <div className="mt-6 border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between"
            >
              <span className="font-medium">Detalhamento de Investimentos</span>
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {expanded && (
              <div className="mt-4 space-y-3">
                {/* Investimentos por categoria */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Terras</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(metrics.terras)}</span>
                  </div>
                  
                  {/* Detalhamento de terras */}
                  {data.investimentos?.terras_detalhado && Object.entries(data.investimentos.terras_detalhado).map(([propriedade, valores]) => {
                    const valor = valores[currentYear] || 0;
                    if (valor === 0) return null;
                    return (
                      <div key={propriedade} className="flex items-center justify-between pl-8 pr-3 py-2">
                        <span className="text-sm text-muted-foreground">{propriedade}</span>
                        <span className="text-sm">{formatCurrency(valor)}</span>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Tractor className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Maquinários</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(metrics.maquinarios)}</span>
                  </div>
                  
                  {/* Detalhamento de maquinários */}
                  {data.investimentos?.maquinarios_detalhado && Object.entries(data.investimentos.maquinarios_detalhado).map(([tipo, valores]) => {
                    const valor = valores[currentYear] || 0;
                    if (valor === 0) return null;
                    return (
                      <div key={tipo} className="flex items-center justify-between pl-8 pr-3 py-2">
                        <span className="text-sm text-muted-foreground">{tipo}</span>
                        <span className="text-sm">{formatCurrency(valor)}</span>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Outros</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(metrics.outros)}</span>
                  </div>
                  
                  {/* Detalhamento de outros */}
                  {data.investimentos?.outros_detalhado && Object.entries(data.investimentos.outros_detalhado).map(([tipo, valores]) => {
                    const valor = valores[currentYear] || 0;
                    if (valor === 0) return null;
                    return (
                      <div key={tipo} className="flex items-center justify-between pl-8 pr-3 py-2">
                        <span className="text-sm text-muted-foreground">{tipo}</span>
                        <span className="text-sm">{formatCurrency(valor)}</span>
                      </div>
                    );
                  })}

                  {/* Vendas de ativos */}
                  {metrics.vendasAtivos > 0 && (
                    <>
                      <div className="border-t pt-2 mt-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <ArrowDownCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="font-medium text-green-700 dark:text-green-300">(-) Vendas de Ativos</span>
                          </div>
                          <span className="font-semibold text-green-700 dark:text-green-300">
                            {formatCurrency(metrics.vendasAtivos)}
                          </span>
                        </div>
                        
                        {/* Detalhamento de vendas */}
                        {data.investimentos?.vendas_ativos_detalhado && Object.entries(data.investimentos.vendas_ativos_detalhado).map(([tipo, valores]) => {
                          const valor = valores[currentYear] || 0;
                          if (valor === 0) return null;
                          return (
                            <div key={tipo} className="flex items-center justify-between pl-8 pr-3 py-2">
                              <span className="text-sm text-muted-foreground">{tipo}</span>
                              <span className="text-sm text-green-600 dark:text-green-400">
                                {formatCurrency(valor)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Total líquido */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <span className="font-semibold">Investimento Líquido Total</span>
                    <span className="font-bold text-lg">{formatCurrency(metrics.investimentoLiquido)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}