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
import { useMemo } from "react";
import { type FinancialIndicatorData } from "@/lib/actions/financial-indicators-actions";
import { useChartColors } from "@/contexts/chart-colors-context";

interface FinancialIndicatorsChartClientProps {
  organizationId: string;
  initialData: FinancialIndicatorData[];
  initialBenchmarks: any;
}

export function FinancialIndicatorsChartClient({
  organizationId,
  initialData,
  initialBenchmarks,
}: FinancialIndicatorsChartClientProps) {
  // Usar cores customizadas
  const { colors } = useChartColors();
  
  // Criar configuração do gráfico com cores customizadas
  const chartConfig = useMemo(() => ({
    dividaReceita: {
      label: "Dívida/Receita",
      color: colors.color1,
    },
    dividaEbitda: {
      label: "Dívida/EBITDA",
      color: colors.color2,
    },
    dividaLucroLiquido: {
      label: "Dívida/Lucro Líquido",
      color: colors.color3,
    },
    ltv: {
      label: "LTV",
      color: colors.color4,
    },
    ltvLiquido: {
      label: "LTV Líquido",
      color: colors.color5,
    },
    liquidezCorrente: {
      label: "Liquidez Corrente",
      color: colors.color6,
    },
  } satisfies ChartConfig), [colors]);

  // Calcular tendências
  const calcularTendencias = () => {
    if (initialData.length < 2) return {
      dividaReceita: "0.0",
      dividaEbitda: "0.0", 
      dividaLucroLiquido: "0.0",
      ltv: "0.0",
      ltvLiquido: "0.0",
      liquidezCorrente: "0.0"
    };

    const primeiro = initialData[0];
    const ultimo = initialData[initialData.length - 1];

    const calcularVariacao = (inicial: number | null, final: number | null) => {
      if (!inicial || !final || inicial === 0) return "0.0";
      return (((final - inicial) / inicial) * 100).toFixed(1);
    };

    return {
      dividaReceita: calcularVariacao(primeiro.dividaReceita, ultimo.dividaReceita),
      dividaEbitda: calcularVariacao(primeiro.dividaEbitda, ultimo.dividaEbitda),
      dividaLucroLiquido: calcularVariacao(primeiro.dividaLucroLiquido, ultimo.dividaLucroLiquido),
      ltv: calcularVariacao(primeiro.ltv, ultimo.ltv),
      ltvLiquido: calcularVariacao(primeiro.ltvLiquido, ultimo.ltvLiquido),
      liquidezCorrente: calcularVariacao(primeiro.liquidezCorrente, ultimo.liquidezCorrente)
    };
  };

  // Avaliar nível de risco baseado nos benchmarks
  const avaliarRisco = () => {
    if (!initialData.length || !initialBenchmarks) return "BAIXO";
    
    const ultimoAno = initialData[initialData.length - 1];
    let nivelRisco = "BAIXO";

    // Verificar cada indicador
    if (ultimoAno.dividaReceita && ultimoAno.dividaReceita > initialBenchmarks.dividaReceita.critico) {
      nivelRisco = "CRÍTICO";
    } else if (ultimoAno.dividaEbitda && ultimoAno.dividaEbitda > initialBenchmarks.dividaEbitda.critico) {
      nivelRisco = "CRÍTICO";
    } else if (ultimoAno.dividaLucroLiquido && ultimoAno.dividaLucroLiquido > initialBenchmarks.dividaLucroLiquido.critico) {
      nivelRisco = "CRÍTICO";
    } else if (
      (ultimoAno.dividaReceita && ultimoAno.dividaReceita > initialBenchmarks.dividaReceita.aceitavel) ||
      (ultimoAno.dividaEbitda && ultimoAno.dividaEbitda > initialBenchmarks.dividaEbitda.aceitavel) ||
      (ultimoAno.dividaLucroLiquido && ultimoAno.dividaLucroLiquido > initialBenchmarks.dividaLucroLiquido.aceitavel)
    ) {
      nivelRisco = "ALTO";
    } else if (
      (ultimoAno.dividaReceita && ultimoAno.dividaReceita > initialBenchmarks.dividaReceita.ideal) ||
      (ultimoAno.dividaEbitda && ultimoAno.dividaEbitda > initialBenchmarks.dividaEbitda.ideal) ||
      (ultimoAno.dividaLucroLiquido && ultimoAno.dividaLucroLiquido > initialBenchmarks.dividaLucroLiquido.ideal)
    ) {
      nivelRisco = "MÉDIO";
    }

    return nivelRisco;
  };

  // Empty state
  if (initialData.length === 0) {
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
                  Nenhum dado de indicadores encontrado
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="w-full h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">
              Cadastre dados financeiros para visualizar os indicadores
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
                Evolução dos indicadores financeiros ({initialData[0]?.ano} -{" "}
                {initialData[initialData.length - 1]?.ano})
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
                data={initialData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="ano"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fontSize: 10, fill: "var(--foreground)" }}
                />
                <YAxis
                  tickFormatter={(value) => `${Number(value).toFixed(1)}x`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  width={60}
                  tick={{ fill: "var(--foreground)" }}
                />
                <ChartTooltip
                  content={
                    <div className="rounded-lg border bg-background dark:border-gray-700 p-2 shadow-md">
                      <ChartTooltipContent className="dark:text-white" />
                    </div>
                  }
                  formatter={(value, name) => [
                    name === 'ltv' || name === 'ltvLiquido' ? 
                      `${Number(value).toFixed(3)}` : 
                      `${Number(value).toFixed(2)}x`,
                    name && typeof name === 'string' && 
                      (name === 'dividaReceita' || name === 'dividaEbitda' || name === 'dividaLucroLiquido' || 
                       name === 'ltv' || name === 'ltvLiquido' || name === 'liquidezCorrente') ?
                      chartConfig[name as keyof typeof chartConfig].label : String(name),
                  ]}
                  labelFormatter={(label) => `Ano: ${label}`}
                />
                <ChartLegend content={<ChartLegendMultirow itemsPerRow={2} className="dark:text-gray-300" />} />
                
                {/* Linhas de referência para benchmarks */}
                {initialBenchmarks && (
                  <>
                    <ReferenceLine 
                      y={initialBenchmarks.dividaReceita.critico} 
                      stroke={colors.color1} 
                      strokeDasharray="2 2" 
                      opacity={0.3}
                    />
                    <ReferenceLine 
                      y={initialBenchmarks.dividaEbitda.critico} 
                      stroke={colors.color2} 
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
                <Line
                  type="monotone"
                  dataKey="ltv"
                  stroke={chartConfig.ltv.color}
                  strokeWidth={2}
                  dot={{ fill: chartConfig.ltv.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name="LTV"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="ltvLiquido"
                  stroke={chartConfig.ltvLiquido.color}
                  strokeWidth={2}
                  dot={{ fill: chartConfig.ltvLiquido.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name="LTV Líquido"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="liquidezCorrente"
                  stroke={chartConfig.liquidezCorrente.color}
                  strokeWidth={2}
                  dot={{ fill: chartConfig.liquidezCorrente.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name="Liquidez Corrente"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm px-6 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-xs">
          {/* Nível de Risco */}
          <div className="space-y-1">
            <div className="font-medium text-muted-foreground dark:text-gray-400">Nível de Risco Atual</div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                nivelRisco === 'CRÍTICO' ? 'bg-red-500' :
                nivelRisco === 'ALTO' ? 'bg-orange-500' :
                nivelRisco === 'MÉDIO' ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <span className={
                nivelRisco === 'CRÍTICO' ? 'text-red-600 dark:text-red-400 font-medium' :
                nivelRisco === 'ALTO' ? 'text-orange-600 dark:text-orange-400 font-medium' :
                nivelRisco === 'MÉDIO' ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 'text-green-600 dark:text-green-400 font-medium'
              }>
                {nivelRisco === 'CRÍTICO' ? '🔴 CRÍTICO' :
                 nivelRisco === 'ALTO' ? '🟠 ALTO' :
                 nivelRisco === 'MÉDIO' ? '🟡 MÉDIO' : '🟢 BAIXO'}
              </span>
            </div>
          </div>
          
          {/* Benchmarks */}
          <div className="space-y-1">
            <div className="font-medium text-muted-foreground dark:text-gray-400">Benchmarks (Críticos)</div>
            <div className="text-xs space-y-1 dark:text-gray-300">
              <div>Dívida/Receita: &lt; {initialBenchmarks?.dividaReceita.critico}x</div>
              <div>Dívida/EBITDA: &lt; {initialBenchmarks?.dividaEbitda.critico}x</div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 font-medium leading-none pt-2 border-t border-muted-foreground/20 dark:border-gray-700 w-full dark:text-white">
          Tendência predominante: 
          {(Number(tendencias.dividaReceita) + Number(tendencias.dividaEbitda) + Number(tendencias.dividaLucroLiquido) + 
            Number(tendencias.ltv) + Number(tendencias.ltvLiquido) - Number(tendencias.liquidezCorrente)) / 5 >= 0 ? (
            <>
              {" "}crescimento dos indicadores <TrendingUp className="h-4 w-4 text-red-500 dark:text-red-400" />
            </>
          ) : (
            <>
              {" "}melhoria dos indicadores <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400 rotate-180" />
            </>
          )}
        </div>
        
        <div className="leading-none text-muted-foreground dark:text-gray-400 text-xs">
          Indicadores baseados em dívidas vs receita, EBITDA e lucro líquido projetados
        </div>
      </CardFooter>
    </Card>
  );
}