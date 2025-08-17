"use client";

import { useMemo } from "react";
import { TrendingUp, Building2 } from "lucide-react";
import {
  Bar,
  BarChart,
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
import { formatCurrency } from "@/lib/utils/formatters";
import { useChartColors } from "@/contexts/chart-colors-context";

interface FinancialDebtEvolutionChartClientProps {
  organizationId: string;
  initialData: DebtEvolutionData[];
}

interface DebtEvolutionData {
  ano: string;
  CUSTEIO: number;
  INVESTIMENTOS: number;
  total: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    
    return (
      <div className="bg-background dark:bg-card border border-border dark:border-muted rounded-lg shadow-lg p-3">
        <p className="font-medium dark:text-foreground">{`Ano: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.dataKey}: ${formatCurrency(entry.value)}`}
          </p>
        ))}
        <div className="border-t dark:border-muted pt-1 mt-1">
          <p className="text-sm font-medium dark:text-foreground">
            Total: {formatCurrency(total)}
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export function FinancialDebtEvolutionChartClient({
  organizationId,
  initialData,
}: FinancialDebtEvolutionChartClientProps) {
  // Usar cores customizadas
  const { colors } = useChartColors();
  
  // Criar configuração do gráfico com cores customizadas
  const chartConfig = useMemo(() => ({
    CUSTEIO: {
      label: "Custeio",
      color: colors.color1,
    },
    INVESTIMENTOS: {
      label: "Investimentos",
      color: colors.color2,
    },
  } satisfies ChartConfig), [colors]);

  // Empty state
  if (!initialData || initialData.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Evolução das Dívidas Bancárias - R$ milhões
                </CardTitle>
                <CardDescription className="text-white/80">
                  Distribuição anual entre custeio e investimentos
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">
              Nenhum dado disponível
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular estatísticas para o footer
  const totalGeral = initialData.reduce((sum, item) => sum + item.total, 0);
  const anoMaior = initialData.reduce((max, item) => item.total > max.total ? item : max, initialData[0]);
  const crescimento = initialData.length > 1 ? 
    ((initialData[initialData.length - 1].total - initialData[0].total) / initialData[0].total) * 100 : 0;

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">
                Evolução das Dívidas Bancárias - R$ milhões
              </CardTitle>
              <CardDescription className="text-white/80">
                Distribuição anual entre custeio e investimentos ({initialData[0]?.ano} - {initialData[initialData.length - 1]?.ano})
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="w-full h-[350px] sm:h-[400px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={initialData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--muted)" />
                <XAxis 
                  dataKey="ano" 
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fontSize: 10, fill: "var(--foreground)" }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  width={40}
                  tickFormatter={(value) => (value/1000000).toFixed(0)}
                  tick={{ fill: "var(--foreground)" }}
                />
                <ChartTooltip
                  content={<CustomTooltip />}
                  formatter={(value, name, payload) => [
                    formatCurrency(value as number),
                    chartConfig[name as keyof typeof chartConfig]?.label || name,
                  ]}
                  labelFormatter={(label) => `Ano: ${label}`}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="CUSTEIO"
                  stackId="a"
                  fill="var(--color-CUSTEIO)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="INVESTIMENTOS"
                  stackId="a"
                  fill="var(--color-INVESTIMENTOS)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm px-6 pt-4">
        <div className="flex gap-2 font-medium leading-none dark:text-foreground">
          {crescimento >= 0 ? (
            <>
              Crescimento de {Math.abs(crescimento).toFixed(1)}% no período
              <TrendingUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Redução de {Math.abs(crescimento).toFixed(1)}% no período
              <TrendingUp className="h-4 w-4 rotate-180" />
            </>
          )}
        </div>
        <div className="leading-none text-muted-foreground text-xs">
          Maior dívida em {anoMaior.ano}: {formatCurrency(anoMaior.total)}
        </div>
      </CardFooter>
    </Card>
  );
}