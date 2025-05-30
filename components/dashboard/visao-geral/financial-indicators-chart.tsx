"use client";

import { TrendingUp, AlertTriangle } from "lucide-react";
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
import { useEffect, useState } from "react";
import {
  getFinancialIndicatorsChart,
  getFinancialIndicatorsBenchmarks,
  type FinancialIndicatorData,
} from "@/lib/actions/financial-indicators-actions";

interface FinancialIndicatorsChartProps {
  organizationId: string;
}

const chartConfig = {
  dividaReceita: {
    label: "Dívida/Receita",
    color: "#DC2626", // Tom final da paleta (vermelho)
  },
  dividaEbitda: {
    label: "Dívida/EBITDA",
    color: "#1B124E", // Tom primário da marca
  },
  dividaLucroLiquido: {
    label: "Dívida/Lucro Líquido",
    color: "#059669", // Tom de destaque (verde)
  },
} satisfies ChartConfig;

export function FinancialIndicatorsChart({
  organizationId,
}: FinancialIndicatorsChartProps) {
  const [data, setData] = useState<FinancialIndicatorData[]>([]);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [chartData, benchmarkData] = await Promise.all([
          getFinancialIndicatorsChart(organizationId),
          getFinancialIndicatorsBenchmarks(),
        ]);

        setData(chartData);
        setBenchmarks(benchmarkData);
      } catch (err) {
        console.error("Erro ao carregar gráfico de indicadores:", err);
        setError("Erro ao carregar dados do gráfico");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [organizationId]);

  // Calcular tendências
  const calcularTendencias = () => {
    if (data.length < 2) return {
      dividaReceita: "0.0",
      dividaEbitda: "0.0", 
      dividaLucroLiquido: "0.0"
    };

    const primeiro = data[0];
    const ultimo = data[data.length - 1];

    const calcularVariacao = (inicial: number | null, final: number | null) => {
      if (!inicial || !final || inicial === 0) return "0.0";
      return (((final - inicial) / inicial) * 100).toFixed(1);
    };

    return {
      dividaReceita: calcularVariacao(primeiro.dividaReceita, ultimo.dividaReceita),
      dividaEbitda: calcularVariacao(primeiro.dividaEbitda, ultimo.dividaEbitda),
      dividaLucroLiquido: calcularVariacao(primeiro.dividaLucroLiquido, ultimo.dividaLucroLiquido)
    };
  };

  // Avaliar nível de risco baseado nos benchmarks
  const avaliarRisco = () => {
    if (!data.length || !benchmarks) return "BAIXO";
    
    const ultimoAno = data[data.length - 1];
    let nivelRisco = "BAIXO";

    // Verificar cada indicador
    if (ultimoAno.dividaReceita && ultimoAno.dividaReceita > benchmarks.dividaReceita.critico) {
      nivelRisco = "CRÍTICO";
    } else if (ultimoAno.dividaEbitda && ultimoAno.dividaEbitda > benchmarks.dividaEbitda.critico) {
      nivelRisco = "CRÍTICO";
    } else if (ultimoAno.dividaLucroLiquido && ultimoAno.dividaLucroLiquido > benchmarks.dividaLucroLiquido.critico) {
      nivelRisco = "CRÍTICO";
    } else if (
      (ultimoAno.dividaReceita && ultimoAno.dividaReceita > benchmarks.dividaReceita.aceitavel) ||
      (ultimoAno.dividaEbitda && ultimoAno.dividaEbitda > benchmarks.dividaEbitda.aceitavel) ||
      (ultimoAno.dividaLucroLiquido && ultimoAno.dividaLucroLiquido > benchmarks.dividaLucroLiquido.aceitavel)
    ) {
      nivelRisco = "ALTO";
    } else if (
      (ultimoAno.dividaReceita && ultimoAno.dividaReceita > benchmarks.dividaReceita.ideal) ||
      (ultimoAno.dividaEbitda && ultimoAno.dividaEbitda > benchmarks.dividaEbitda.ideal) ||
      (ultimoAno.dividaLucroLiquido && ultimoAno.dividaLucroLiquido > benchmarks.dividaLucroLiquido.ideal)
    ) {
      nivelRisco = "MÉDIO";
    }

    return nivelRisco;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Indicadores de Endividamento
                </CardTitle>
                <CardDescription className="text-white/80">
                  Carregando indicadores financeiros...
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
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Indicadores de Endividamento
                </CardTitle>
                <CardDescription className="text-white/80">
                  {error || "Nenhum dado de indicadores encontrado"}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="w-full h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">
              {error || "Cadastre dados financeiros para visualizar os indicadores"}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tendencias = calcularTendencias();
  const nivelRisco = avaliarRisco();

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">
                Indicadores de Endividamento
              </CardTitle>
              <CardDescription className="text-white/80">
                Evolução dos indicadores financeiros ({data[0]?.ano} -{" "}
                {data[data.length - 1]?.ano})
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
                  dataKey="ano"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  tickFormatter={(value) => `${Number(value).toFixed(1)}x`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  width={60}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, name) => [
                    `${Number(value).toFixed(2)}x`,
                    name && typeof name === 'string' && 
                      (name === 'dividaReceita' || name === 'dividaEbitda' || name === 'dividaLucroLiquido') ?
                      chartConfig[name as keyof typeof chartConfig].label : String(name),
                  ]}
                  labelFormatter={(label) => `Ano: ${label}`}
                />
                <ChartLegend content={<ChartLegendMultirow itemsPerRow={2} />} />
                
                {/* Linhas de referência para benchmarks */}
                {benchmarks && (
                  <>
                    <ReferenceLine 
                      y={benchmarks.dividaReceita.critico} 
                      stroke="#DC2626" 
                      strokeDasharray="2 2" 
                      opacity={0.3}
                    />
                    <ReferenceLine 
                      y={benchmarks.dividaEbitda.critico} 
                      stroke="#1B124E" 
                      strokeDasharray="2 2" 
                      opacity={0.3}
                    />
                  </>
                )}

                {/* Linhas dos indicadores */}
                <Line
                  type="monotone"
                  dataKey="dividaReceita"
                  stroke={chartConfig.dividaReceita.color}
                  strokeWidth={2}
                  dot={{ fill: chartConfig.dividaReceita.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name="Dívida/Receita"
                  connectNulls={false}
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
                />
                <Line
                  type="monotone"
                  dataKey="dividaLucroLiquido"
                  stroke={chartConfig.dividaLucroLiquido.color}
                  strokeWidth={2}
                  dot={{ fill: chartConfig.dividaLucroLiquido.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name="Dívida/Lucro Líquido"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm px-6 pt-4 bg-muted/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-xs">
          {/* Nível de Risco */}
          <div className="space-y-1">
            <div className="font-medium text-muted-foreground">Nível de Risco Atual</div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                nivelRisco === 'CRÍTICO' ? 'bg-red-500' :
                nivelRisco === 'ALTO' ? 'bg-orange-500' :
                nivelRisco === 'MÉDIO' ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <span className={
                nivelRisco === 'CRÍTICO' ? 'text-red-600 font-medium' :
                nivelRisco === 'ALTO' ? 'text-orange-600 font-medium' :
                nivelRisco === 'MÉDIO' ? 'text-yellow-600 font-medium' : 'text-green-600 font-medium'
              }>
                {nivelRisco === 'CRÍTICO' ? '🔴 CRÍTICO' :
                 nivelRisco === 'ALTO' ? '🟠 ALTO' :
                 nivelRisco === 'MÉDIO' ? '🟡 MÉDIO' : '🟢 BAIXO'}
              </span>
            </div>
          </div>
          
          {/* Benchmarks */}
          <div className="space-y-1">
            <div className="font-medium text-muted-foreground">Benchmarks (Críticos)</div>
            <div className="text-xs space-y-1">
              <div>Dívida/Receita: &lt; {benchmarks?.dividaReceita.critico}x</div>
              <div>Dívida/EBITDA: &lt; {benchmarks?.dividaEbitda.critico}x</div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 font-medium leading-none pt-2 border-t border-muted-foreground/20 w-full">
          Tendência predominante: 
          {(Number(tendencias.dividaReceita) + Number(tendencias.dividaEbitda) + Number(tendencias.dividaLucroLiquido)) / 3 >= 0 ? (
            <>
              {" "}crescimento dos indicadores <TrendingUp className="h-4 w-4 text-red-500" />
            </>
          ) : (
            <>
              {" "}melhoria dos indicadores <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />
            </>
          )}
        </div>
        
        <div className="leading-none text-muted-foreground text-xs">
          Indicadores baseados em dívidas vs receita, EBITDA e lucro líquido projetados
        </div>
      </CardFooter>
    </Card>
  );
}