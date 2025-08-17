"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getDebtPosition } from "@/lib/actions/debt-position-actions";
import { useChartColors } from "@/contexts/chart-colors-context";
import { useMemo } from "react";

interface FinancialIndicatorsEvolutionChartProps {
  organizationId: string;
  projectionId?: string;
}

interface IndicatorData {
  ano: string;
  dividaLiquidaReceita: number;
  dividaReceita: number;
  dividaLiquidaEbitda: number;
  dividaEbitda: number;
}

export function FinancialIndicatorsEvolutionChart({
  organizationId,
  projectionId,
}: FinancialIndicatorsEvolutionChartProps) {
  const [data, setData] = useState<IndicatorData[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useChartColors();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Usar a mesma lógica que as projeções - getDebtPosition
        const debtPosition = await getDebtPosition(organizationId, projectionId);
        
        if (!debtPosition || !debtPosition.indicadores) {
          setLoading(false);
          return;
        }

        const indicatorsByYear: IndicatorData[] = [];
        const { indicadores_calculados } = debtPosition.indicadores;
        
        // Pegar todos os anos disponíveis
        const anos = debtPosition.anos || [];
        
        // Para cada safra/ano, pegar os indicadores calculados
        anos.forEach((safraName: string) => {
          // Extrair o ano da safra (ex: "2024/25" -> "2025")
          const yearMatch = safraName.match(/\d{4}\/(\d{2})/);
          const ano = yearMatch ? `20${yearMatch[1]}` : safraName;
          
          // Pegar os indicadores já calculados
          const dividaReceita = indicadores_calculados?.divida_receita?.[safraName] || 0;
          const dividaEbitda = indicadores_calculados?.divida_ebitda?.[safraName] || 0;
          const dividaLiquidaReceita = indicadores_calculados?.divida_liquida_receita?.[safraName] || 0;
          const dividaLiquidaEbitda = indicadores_calculados?.divida_liquida_ebitda?.[safraName] || 0;
          
          // Só adicionar se tiver pelo menos um indicador válido
          if (dividaReceita > 0 || dividaEbitda !== 0 || dividaLiquidaReceita > 0 || dividaLiquidaEbitda !== 0) {
            indicatorsByYear.push({
              ano,
              dividaLiquidaReceita,
              dividaReceita,
              dividaLiquidaEbitda,
              dividaEbitda,
            });
          }
        });

        // Filtrar e ordenar os dados
        const filteredData = indicatorsByYear
          .filter(d => {
            const year = parseInt(d.ano);
            return year >= 2024 && year <= 2030;
          })
          .sort((a, b) => parseInt(a.ano) - parseInt(b.ano));

        setData(filteredData);
      } catch (error) {
        console.error("Erro ao carregar evolução dos indicadores:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organizationId, projectionId]);

  const chartConfig: ChartConfig = useMemo(() => ({
    dividaLiquidaReceita: {
      label: "Dívida Líquida/Receita",
      color: colors.color1,
    },
    dividaReceita: {
      label: "Dívida/Receita", 
      color: colors.color2,
    },
    dividaLiquidaEbitda: {
      label: "Dívida Líquida/EBITDA",
      color: colors.color3,
    },
    dividaEbitda: {
      label: "Dívida/EBITDA",
      color: colors.color4,
    },
  }), [colors]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">
                Evolução dos Indicadores Financeiros
              </CardTitle>
              <CardDescription className="text-white/80">
                Carregando dados...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">
                Evolução dos Indicadores Financeiros
              </CardTitle>
              <CardDescription className="text-white/80">
                Nenhum dado disponível
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">
              Adicione dados financeiros para visualizar o gráfico
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-white">
                Evolução dos Indicadores Financeiros
              </CardTitle>
              <CardDescription className="text-white/80">
                Acompanhamento histórico dos principais indicadores de endividamento
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="space-y-6">
          {/* Gráfico Superior - Dívida/Receita e Dívida/EBITDA */}
          <div>
            <div className="w-full h-[250px] relative">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data}
                    margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="ano"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      fontSize={12}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      tickFormatter={(value) => value.toFixed(1)}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      fontSize={12}
                      width={50}
                      domain={[0, 10]}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => {
                        const formattedValue = typeof value === 'number' ? Number(value).toFixed(2) : '0';
                        return [
                          <span key="value" className="font-medium">{formattedValue}x</span>,
                          <span key="name">{name}</span>,
                        ];
                      }}
                      labelFormatter={(label) => `Ano: ${label}`}
                    />
                    <ChartLegend
                      content={
                        <ChartLegendContent 
                          payload={[
                            { value: 'Dívida/Receita', color: chartConfig.dividaReceita.color, type: 'rect' },
                            { value: 'Dívida/EBITDA', color: chartConfig.dividaEbitda.color, type: 'rect' },
                          ]}
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="dividaReceita"
                      stroke={chartConfig.dividaReceita.color}
                      strokeWidth={2}
                      dot={{ fill: chartConfig.dividaReceita.color, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                      name="Dívida/Receita"
                      connectNulls={false}
                      label={{
                        position: "bottom",
                        className: "fill-foreground",
                        fontSize: 12,
                        fontWeight: "bold",
                        offset: 8,
                        formatter: (value: number) => value.toFixed(2)
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="dividaEbitda"
                      stroke={chartConfig.dividaEbitda.color}
                      strokeWidth={2}
                      dot={{ fill: chartConfig.dividaEbitda.color, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                      name="Dívida/EBITDA"
                      connectNulls={false}
                      label={{
                        position: "top",
                        className: "fill-foreground",
                        fontSize: 12,
                        fontWeight: "bold",
                        offset: 8,
                        formatter: (value: number) => value.toFixed(2)
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>

          {/* Gráfico Inferior - Dívida Líquida/Receita e Dívida Líquida/EBITDA */}
          <div>
            <div className="w-full h-[250px] relative">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data}
                    margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="ano"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      fontSize={12}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      tickFormatter={(value) => value.toFixed(1)}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      fontSize={12}
                      width={50}
                      domain={[0, 10]}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => {
                        const formattedValue = typeof value === 'number' ? Number(value).toFixed(2) : '0';
                        return [
                          <span key="value" className="font-medium">{formattedValue}x</span>,
                          <span key="name">{name}</span>,
                        ];
                      }}
                      labelFormatter={(label) => `Ano: ${label}`}
                    />
                    <ChartLegend
                      content={
                        <ChartLegendContent 
                          payload={[
                            { value: 'Dívida Líquida/Receita', color: chartConfig.dividaLiquidaReceita.color, type: 'rect' },
                            { value: 'Dívida Líquida/EBITDA', color: chartConfig.dividaLiquidaEbitda.color, type: 'rect' },
                          ]}
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="dividaLiquidaReceita"
                      stroke={chartConfig.dividaLiquidaReceita.color}
                      strokeWidth={2}
                      dot={{ fill: chartConfig.dividaLiquidaReceita.color, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                      name="Dívida Líquida/Receita"
                      connectNulls={false}
                      label={{
                        position: "bottom",
                        className: "fill-foreground",
                        fontSize: 12,
                        fontWeight: "bold",
                        offset: 8,
                        formatter: (value: number) => value.toFixed(2)
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="dividaLiquidaEbitda"
                      stroke={chartConfig.dividaLiquidaEbitda.color}
                      strokeWidth={2}
                      dot={{ fill: chartConfig.dividaLiquidaEbitda.color, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                      name="Dívida Líquida/EBITDA"
                      connectNulls={false}
                      label={{
                        position: "top",
                        className: "fill-foreground",
                        fontSize: 12,
                        fontWeight: "bold",
                        offset: 8,
                        formatter: (value: number) => value.toFixed(2)
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}