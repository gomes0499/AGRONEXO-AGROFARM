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
import { useEffect, useState } from "react";
import {
  getFinancialChart,
  type FinancialData,
} from "@/lib/actions/production-chart-actions";

interface FinancialChartProps {
  organizationId: string;
  propertyIds?: string[];
}

export function FinancialChart({
  organizationId,
  propertyIds,
}: FinancialChartProps) {
  const [data, setData] = useState<FinancialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configuração das linhas do gráfico - Variações da cor da marca #1B124E
  const chartConfig: ChartConfig = {
    receitaTotal: {
      label: "Receita Total",
      color: "#1B124E", // Cor original da marca - mais escura
    },
    custoTotal: {
      label: "Custo Total",
      color: "#3F2C88", // Variação média-escura
    },
    ebitda: {
      label: "EBITDA",
      color: "#6346C2", // Variação média-clara
    },
    lucroLiquido: {
      label: "Lucro Líquido",
      color: "#8760FC", // Variação mais clara
    },
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const chartData = await getFinancialChart(organizationId, propertyIds);
        setData(chartData);
      } catch (err) {
        console.error("Erro ao carregar gráfico financeiro:", err);
        setError("Erro ao carregar dados do gráfico");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [organizationId, propertyIds]);

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

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: Math.abs(value) >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
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
                  Carregando dados financeiros...
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="w-full h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">Carregando gráfico...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || data.length === 0) {
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
                  {error || "Nenhum dado financeiro encontrado"}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="w-full h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">
              {error || "Cadastre dados de produção e custos para visualizar o gráfico"}
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
                Evolução Financeira
              </CardTitle>
              <CardDescription className="text-white/80">
                Receita, Custo, EBITDA e Lucro Líquido por safra ({data[0]?.safra} -{" "}
                {data[data.length - 1]?.safra})
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
                    formatCurrency(Number(value)),
                    chartConfig[name as string]?.label || name,
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
                  name={chartConfig.receitaTotal.label}
                />
                
                {/* Custo Total */}
                <Line
                  type="monotone"
                  dataKey="custoTotal"
                  stroke={chartConfig.custoTotal.color}
                  strokeWidth={3}
                  dot={{ fill: chartConfig.custoTotal.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name={chartConfig.custoTotal.label}
                />
                
                {/* EBITDA */}
                <Line
                  type="monotone"
                  dataKey="ebitda"
                  stroke={chartConfig.ebitda.color}
                  strokeWidth={3}
                  dot={{ fill: chartConfig.ebitda.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name={chartConfig.ebitda.label}
                />
                
                {/* Lucro Líquido */}
                <Line
                  type="monotone"
                  dataKey="lucroLiquido"
                  stroke={chartConfig.lucroLiquido.color}
                  strokeWidth={3}
                  dot={{ fill: chartConfig.lucroLiquido.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name={chartConfig.lucroLiquido.label}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm px-6 pt-4 bg-muted/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-xs">
          {/* Período Realizado 2021-2024 */}
          <div className="space-y-1">
            <div className="font-medium text-muted-foreground">Realizado (2021-2024)</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#6346C2" }}></div>
              <span>EBITDA: {mediasMargens.ebitdaRealizado}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#8760FC" }}></div>
              <span>Lucro Líquido: {mediasMargens.lucroRealizado}%</span>
            </div>
          </div>
          
          {/* Período Projetado 2025-2030 */}
          <div className="space-y-1">
            <div className="font-medium text-muted-foreground">Projetado (2025-2030)</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#6346C2" }}></div>
              <span>EBITDA: {mediasMargens.ebitdaProjetado}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#8760FC" }}></div>
              <span>Lucro Líquido: {mediasMargens.lucroProjetado}%</span>
            </div>
          </div>
        </div>
        
        <div className="leading-none text-muted-foreground text-xs pt-2 border-t border-muted-foreground/20 w-full">
          Margens médias calculadas sobre a receita total por período
        </div>
      </CardFooter>
    </Card>
  );
}