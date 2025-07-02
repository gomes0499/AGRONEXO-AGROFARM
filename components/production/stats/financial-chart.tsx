"use client";

import { TrendingUp, LineChart as LineChartIcon } from "lucide-react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
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
                  Evolução Financeira
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
            <div>
              <CardTitle className="text-white">
                {projectionId ? "Projeção Financeira" : "Evolução Financeira"}
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
        <div className="w-full h-[350px] sm:h-[400px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
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
                  tickFormatter={(value) => formatCurrency(value)}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  width={70}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, name) => [
                    <span key="value" className="font-medium">{formatCurrency(Number(value))}</span>,
                    <span key="name">{chartConfig[name as string]?.label || name}</span>,
                  ]}
                  labelFormatter={(label) => `Safra: ${label}`}
                />
                <ChartLegend content={<ChartLegendMultirow itemsPerRow={3} />} />
                
                {/* Receita Total */}
                <Line
                  type="monotone"
                  dataKey="receitaTotal"
                  stroke={chartConfig.receitaTotal.color}
                  strokeWidth={3}
                  dot={{ fill: chartConfig.receitaTotal.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name={chartConfig.receitaTotal.label as string}
                  label={{
                    position: "top",
                    fill: chartConfig.receitaTotal.color,
                    fontSize: 11,
                    offset: 10,
                    formatter: (value: number) => value >= 1000000 ? `${(value/1000000).toFixed(1)}M` : value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toFixed(0)
                  }}
                />
                
                {/* Custo Total */}
                <Line
                  type="monotone"
                  dataKey="custoTotal"
                  stroke={chartConfig.custoTotal.color}
                  strokeWidth={3}
                  dot={{ fill: chartConfig.custoTotal.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name={chartConfig.custoTotal.label as string}
                  label={{
                    position: "bottom",
                    fill: chartConfig.custoTotal.color,
                    fontSize: 11,
                    offset: 10,
                    formatter: (value: number) => value >= 1000000 ? `${(value/1000000).toFixed(1)}M` : value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toFixed(0)
                  }}
                />
                
                {/* EBITDA */}
                <Line
                  type="monotone"
                  dataKey="ebitda"
                  stroke={chartConfig.ebitda.color}
                  strokeWidth={3}
                  dot={{ fill: chartConfig.ebitda.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name={chartConfig.ebitda.label as string}
                  label={{
                    position: "top",
                    fill: chartConfig.ebitda.color,
                    fontSize: 11,
                    offset: 10,
                    formatter: (value: number) => value >= 1000000 ? `${(value/1000000).toFixed(1)}M` : value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toFixed(0)
                  }}
                />
                
                {/* Lucro Líquido */}
                <Line
                  type="monotone"
                  dataKey="lucroLiquido"
                  stroke={chartConfig.lucroLiquido.color}
                  strokeWidth={3}
                  dot={{ fill: chartConfig.lucroLiquido.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name={chartConfig.lucroLiquido.label as string}
                  label={{
                    position: "bottom",
                    fill: chartConfig.lucroLiquido.color,
                    fontSize: 11,
                    offset: 10,
                    formatter: (value: number) => value >= 1000000 ? `${(value/1000000).toFixed(1)}M` : value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toFixed(0)
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm px-6 pt-4">
        {!projectionId ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-xs">
              {/* Período Realizado 2021-2024 */}
              <div className="space-y-1">
                <div className="font-medium text-muted-foreground">Realizado (2021-2024)</div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartConfig.ebitda.color }}></div>
                  <span>EBITDA: {mediasMargens.ebitdaRealizado}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartConfig.lucroLiquido.color }}></div>
                  <span>Lucro Líquido: {mediasMargens.lucroRealizado}%</span>
                </div>
              </div>
              
              {/* Período Projetado 2025-2030 */}
              <div className="space-y-1">
                <div className="font-medium text-muted-foreground">Projetado (2025-2030)</div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartConfig.ebitda.color }}></div>
                  <span>EBITDA: {mediasMargens.ebitdaProjetado}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartConfig.lucroLiquido.color }}></div>
                  <span>Lucro Líquido: {mediasMargens.lucroProjetado}%</span>
                </div>
              </div>
            </div>
            
            <div className="leading-none text-muted-foreground text-xs pt-2 border-t border-muted-foreground/20 w-full">
              {currentScenario 
                ? `Projeção baseada no cenário "${currentScenario.scenarioName}" - Safras ${data[0]?.safra} a ${data[data.length - 1]?.safra}`
                : "Margens médias calculadas sobre a receita total por período"}
            </div>
          </>
        ) : (
          <>
            <div className="w-full">
              <div className="font-medium text-muted-foreground text-xs mb-2">
                Indicadores projetados
              </div>
              {/* Mostrar margens médias do período */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartConfig.ebitda.color }}></div>
                    <span>Margem EBITDA média: {
                      data.length > 0 
                        ? ((data.reduce((sum, item) => sum + (item.ebitda / item.receitaTotal * 100), 0) / data.length).toFixed(1))
                        : "0.0"
                    }%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartConfig.lucroLiquido.color }}></div>
                    <span>Margem LL média: {
                      data.length > 0 
                        ? ((data.reduce((sum, item) => sum + (item.lucroLiquido / item.receitaTotal * 100), 0) / data.length).toFixed(1))
                        : "0.0"
                    }%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="leading-none text-muted-foreground text-xs pt-2 border-t border-muted-foreground/20 w-full">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {currentScenario 
                  ? `Cenário "${currentScenario.scenarioName}" aplicado`
                  : "Projeção baseada em áreas, produtividades, preços e custos estimados"}
              </div>
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}