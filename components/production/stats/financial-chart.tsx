"use client";

import { TrendingUp, LineChart as LineChartIcon } from "lucide-react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartContainer,
} from "@/components/ui/chart";
import { ChartLegendMultirow } from "@/components/ui/chart-legend-multirow";
import { useState, useTransition, useEffect } from "react";
import type { FinancialData as ProductionFinancialData } from "@/lib/actions/production-chart-actions";
import type { FinancialChartData } from "@/lib/actions/financial-chart-actions";
import { getFinancialChartData } from "@/lib/actions/financial-chart-actions";
import { useScenario } from "@/contexts/scenario-context-v2";
import { useChartColors } from "@/contexts/chart-colors-context";

interface FinancialChartClientProps {
  organizationId: string;
  propertyIds?: string[];
  cultureIds?: string[];
  projectionId?: string;
  initialData: FinancialChartData;
}

// Formatar valor monetário
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: Math.abs(value) >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: 0,
  }).format(value);
};

export function FinancialChartClient({
  organizationId,
  propertyIds,
  cultureIds,
  projectionId,
  initialData,
}: FinancialChartClientProps) {
  const [data, setData] = useState<ProductionFinancialData[]>(initialData?.chartData || []);
  const [isPending, startTransition] = useTransition();
  const { currentScenario, getProjectedValue } = useScenario();
  const { colors } = useChartColors();

  // Configuração das linhas do gráfico - Usando cores do contexto
  const chartConfig: ChartConfig = {
    receitaTotal: {
      label: "Receita Total",
      color: colors.color1,
    },
    custoTotal: {
      label: "Custo Total",
      color: colors.color2,
    },
    ebitda: {
      label: "EBITDA",
      color: colors.color3,
    },
    lucroLiquido: {
      label: "Lucro Líquido",
      color: colors.color4,
    },
  };

  // Apply scenario adjustments when scenario changes
  useEffect(() => {
    let processedData = initialData?.chartData || [];
    
    if (currentScenario && currentScenario.cultureData) {
      processedData = (initialData?.chartData || []).map((item) => {
        // Encontrar a safra correspondente
        const safra = initialData?.safras?.find((s) => s.nome === item.safra);
        if (!safra) {
          return item; // Sem dados de cenário para esta safra
        }

        // Calcular receita e custo projetados baseados nos dados de cultura
        let receitaProjetada = item.receitaTotal;
        let custoProjetado = item.custoTotal;
        
        if (currentScenario.cultureData[safra.id]) {
          // Se temos dados de projeção para esta safra
          const safraProjections = currentScenario.cultureData[safra.id];
          
          if (safraProjections.length > 0) {
            // Por simplificação, vamos usar as projeções agregadas
            // Em uma implementação completa, isso calcularia baseado em preços reais
            receitaProjetada = (getProjectedValue as any)(
              item.receitaTotal,
              safra.id,
              'revenue',
              currentScenario
            );
            
            custoProjetado = (getProjectedValue as any)(
              item.custoTotal,
              safra.id,
              'cost',
              currentScenario
            );
          }
        }
        
        // Aplicar taxa de câmbio se definida
        if ((currentScenario as any).harvestData?.[safra.id]?.dollar_rate) {
          const dollarRate = (currentScenario as any).harvestData[safra.id].dollar_rate;
          // Aplicar taxa de câmbio à receita (simplificado - assumindo parte da receita em dólar)
          receitaProjetada = receitaProjetada * (1 + (dollarRate - 5.0) * 0.1); // 10% de impacto por real de variação
        }

        const adjustedItem: ProductionFinancialData = {
          safra: item.safra,
          receitaTotal: receitaProjetada,
          custoTotal: custoProjetado,
          ebitda: receitaProjetada - custoProjetado,
          lucroLiquido: (receitaProjetada - custoProjetado) * 0.8, // 80% do EBITDA como aproximação
        };
        
        return adjustedItem;
      });
    }
    
    setData(processedData);
  }, [currentScenario, initialData?.chartData, initialData?.safras, getProjectedValue]);

  // Refresh data when filters change
  useEffect(() => {
    startTransition(async () => {
      try {
        const newData = await getFinancialChartData(
          organizationId,
          propertyIds,
          cultureIds,
          projectionId
        );
        setData(newData.chartData);
      } catch (error) {
        console.error("Erro ao atualizar dados do gráfico:", error);
      }
    });
  }, [organizationId, propertyIds, cultureIds, projectionId]);

  // Calcular médias das margens por período
  const calcularMediasMargens = () => {
    if (data.length === 0) return {
      ebitdaRealizado: "0.0",
      lucroRealizado: "0.0",
      ebitdaProjetado: "0.0",
      lucroProjetado: "0.0"
    };

    // Separar dados por período baseado no ano da safra
    const dadosRealizados = data.filter(item => {
      const ano = parseInt(item.safra.split('/')[0]); // Pegar primeiro ano da safra
      return ano >= 2021 && ano <= 2024;
    });

    const dadosProjetados = data.filter(item => {
      const ano = parseInt(item.safra.split('/')[0]); // Pegar primeiro ano da safra
      return ano >= 2025 && ano <= 2030;
    });

    // Calcular médias do período realizado (2021-2024)
    let ebitdaRealizado = "0.0";
    let lucroRealizado = "0.0";
    
    if (dadosRealizados.length > 0) {
      const somaEbitdaRealizado = dadosRealizados.reduce((acc, item) => {
        const margemEbitda = item.receitaTotal > 0 ? (item.ebitda / item.receitaTotal) * 100 : 0;
        return acc + margemEbitda;
      }, 0);
      
      const somaLucroRealizado = dadosRealizados.reduce((acc, item) => {
        const margemLucro = item.receitaTotal > 0 ? (item.lucroLiquido / item.receitaTotal) * 100 : 0;
        return acc + margemLucro;
      }, 0);
      
      ebitdaRealizado = (somaEbitdaRealizado / dadosRealizados.length).toFixed(1);
      lucroRealizado = (somaLucroRealizado / dadosRealizados.length).toFixed(1);
    }

    // Calcular médias do período projetado (2025-2030)
    let ebitdaProjetado = "0.0";
    let lucroProjetado = "0.0";
    
    if (dadosProjetados.length > 0) {
      const somaEbitdaProjetado = dadosProjetados.reduce((acc, item) => {
        const margemEbitda = item.receitaTotal > 0 ? (item.ebitda / item.receitaTotal) * 100 : 0;
        return acc + margemEbitda;
      }, 0);
      
      const somaLucroProjetado = dadosProjetados.reduce((acc, item) => {
        const margemLucro = item.receitaTotal > 0 ? (item.lucroLiquido / item.receitaTotal) * 100 : 0;
        return acc + margemLucro;
      }, 0);
      
      ebitdaProjetado = (somaEbitdaProjetado / dadosProjetados.length).toFixed(1);
      lucroProjetado = (somaLucroProjetado / dadosProjetados.length).toFixed(1);
    }

    return {
      ebitdaRealizado,
      lucroRealizado,
      ebitdaProjetado,
      lucroProjetado
    };
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <LineChartIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Evolução do Resultado
                </CardTitle>
                <CardDescription className="text-white/80">
                  Nenhum dado financeiro encontrado
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="w-full h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">
              Cadastre dados de produção e custos para visualizar o gráfico
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mediasMargens = calcularMediasMargens();

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <LineChartIcon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-white">
                {projectionId ? "Projeção Financeira (R$ milhões)" : "Evolução do Resultado (R$ milhões)"}
                {currentScenario && " - Cenário"}
                {isPending && " (Atualizando...)"}
              </CardTitle>
              <CardDescription className="text-white/80">
                {currentScenario 
                  ? `Cenário: ${currentScenario.scenarioName} - Indicadores financeiros projetados`
                  : projectionId
                  ? `Indicadores financeiros projetados (${data[0]?.safra} - ${data[data.length - 1]?.safra})`
                  : `Receita, Custo, EBITDA e Lucro Líquido por safra (${data[0]?.safra} - ${data[data.length - 1]?.safra})`}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="w-full h-[350px] sm:h-[400px] relative">
          {/* Indicadores R/P com linhas no topo */}
          <div className="absolute top-2 left-0 right-0 h-8 pointer-events-none z-20" style={{ marginLeft: "40px", marginRight: "10px" }}>
            <div className="relative w-full h-full">
              {/* Encontrar o ponto de divisão entre R e P */}
              {(() => {
                const projectedIndex = data.findIndex(item => parseInt(item.safra.split('/')[0]) >= 2025);
                const realizedWidth = projectedIndex === -1 ? 100 : (projectedIndex / data.length) * 100;
                const projectedWidth = projectedIndex === -1 ? 0 : ((data.length - projectedIndex) / data.length) * 100;
                
                return (
                  <>
                    {/* Linha e label para Realizado */}
                    {realizedWidth > 0 && (
                      <div 
                        className="absolute top-4 h-[2px] bg-gray-600"
                        style={{ 
                          left: '0%',
                          width: `${realizedWidth - 2}%`
                        }}
                      >
                        <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-600">
                          Realizado
                        </span>
                      </div>
                    )}
                    
                    {/* Linha e label para Projetado */}
                    {projectedWidth > 0 && (
                      <div 
                        className="absolute top-4 h-[2px] bg-red-500"
                        style={{ 
                          right: '0%',
                          width: `${projectedWidth - 2}%`
                        }}
                      >
                        <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-500">
                          Projetado
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
          
          <ChartContainer config={chartConfig} className="w-full h-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 45, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="safra"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  tickFormatter={(value) => (value/1000000).toFixed(0)}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  width={50}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, name) => [
                    <span key="value" className="font-medium">{formatCurrency(Number(value))}</span>,
                    <span key="name">{chartConfig[name as string]?.label || name}</span>,
                  ]}
                  labelFormatter={(label) => `Safra: ${label}`}
                />
                <ChartLegend
                  content={
                    <ChartLegendMultirow 
                      itemsPerRow={4}
                      payload={[
                        { value: chartConfig.receitaTotal.label, color: chartConfig.receitaTotal.color, type: 'rect' },
                        { value: chartConfig.custoTotal.label, color: chartConfig.custoTotal.color, type: 'rect' },
                        { value: chartConfig.ebitda.label, color: chartConfig.ebitda.color, type: 'rect' },
                        { value: chartConfig.lucroLiquido.label, color: chartConfig.lucroLiquido.color, type: 'rect' }
                      ]}
                    />
                  }
                />
                
                {/* Receita Total */}
                <Line
                  type="monotone"
                  dataKey="receitaTotal"
                  stroke={chartConfig.receitaTotal.color}
                  strokeWidth={2}
                  dot={{ fill: chartConfig.receitaTotal.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  connectNulls={false}
                  name={chartConfig.receitaTotal.label as string}
                  label={{
                    position: "top",
                    className: "fill-foreground",
                    fontSize: 12,
                    fontWeight: "bold",
                    offset: 8,
                    formatter: (value: number) => value ? (value/1000000).toFixed(0) : ""
                  }}
                />
                
                {/* Custo Total */}
                <Line
                  type="monotone"
                  dataKey="custoTotal"
                  stroke={chartConfig.custoTotal.color}
                  strokeWidth={2}
                  dot={{ fill: chartConfig.custoTotal.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  connectNulls={false}
                  name={chartConfig.custoTotal.label as string}
                  label={{
                    position: "bottom",
                    className: "fill-foreground",
                    fontSize: 12,
                    fontWeight: "bold",
                    offset: 8,
                    formatter: (value: number) => value ? (value/1000000).toFixed(0) : ""
                  }}
                />
                
                {/* EBITDA */}
                <Line
                  type="monotone"
                  dataKey="ebitda"
                  stroke={chartConfig.ebitda.color}
                  strokeWidth={2}
                  dot={{ fill: chartConfig.ebitda.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  connectNulls={false}
                  name={chartConfig.ebitda.label as string}
                  label={{
                    position: "top",
                    className: "fill-foreground",
                    fontSize: 12,
                    fontWeight: "bold",
                    offset: 8,
                    formatter: (value: number) => value ? (value/1000000).toFixed(0) : ""
                  }}
                />
                
                {/* Lucro Líquido */}
                <Line
                  type="monotone"
                  dataKey="lucroLiquido"
                  stroke={chartConfig.lucroLiquido.color}
                  strokeWidth={2}
                  dot={{ fill: chartConfig.lucroLiquido.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  connectNulls={false}
                  name={chartConfig.lucroLiquido.label as string}
                  label={{
                    position: "bottom",
                    className: "fill-foreground",
                    fontSize: 12,
                    fontWeight: "bold",
                    offset: 8,
                    formatter: (value: number) => value ? (value/1000000).toFixed(0) : ""
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}