"use client";

import { useState, useEffect, useMemo } from "react";
import { TrendingUp, Building2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
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
  ChartTooltip,
  ChartTooltipContent,
  ChartContainer,
} from "@/components/ui/chart";
import { getBankDistributionData, type BankData } from "@/lib/actions/financial-bank-distribution-actions";
import { formatCurrency } from "@/lib/utils/formatters";
import { Loader2 } from "lucide-react";
import { useChartColors } from "@/contexts/chart-colors-context";

interface FinancialBankDistributionChartClientProps {
  organizationId: string;
  selectedYear?: number | string;
  projectionId?: string;
  initialData: BankData[];
  initialYearUsed: number;
  initialSafraName?: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-background dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm dark:text-white">{label}</p>
        <div className="my-1 h-px bg-border dark:bg-gray-600" />
        <div className="space-y-1 mt-2">
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground dark:text-gray-400">
              Valor:
            </span>
            <span className="font-medium dark:text-white">
              {formatCurrency(data.valor)}
            </span>
          </p>
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground dark:text-gray-400">
              Participação:
            </span>
            <span className="font-medium dark:text-white">
              {data.percentual.toFixed(1)}%
            </span>
          </p>
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground dark:text-gray-400">
              Ranking:
            </span>
            <span className="font-medium dark:text-white">
              {data.rank}º posição
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export function FinancialBankDistributionChartClient({
  organizationId,
  selectedYear,
  projectionId,
  initialData,
  initialYearUsed,
  initialSafraName,
}: FinancialBankDistributionChartClientProps) {
  const [data, setData] = useState<BankData[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayYear, setDisplayYear] = useState<number>(initialYearUsed);
  const [displaySafra, setDisplaySafra] = useState<string | undefined>(initialSafraName);
  
  // Usar cores customizadas
  const { colors } = useChartColors();
  
  // Criar configuração do gráfico com cor customizada
  const chartConfig = useMemo(() => ({
    valor: {
      label: "Valor da Dívida",
      color: colors.color1,
    },
  } satisfies ChartConfig), [colors]);

  // Update data when selectedYear changes
  useEffect(() => {
    if (selectedYear && selectedYear !== displayYear) {
      const loadData = async () => {
        try {
          setLoading(true);
          setError(null);

          const result = await getBankDistributionData(
            organizationId,
            selectedYear,
            projectionId
          );

          setData(result.data);
          setDisplayYear(result.yearUsed);
          setDisplaySafra(result.safraName);
        } catch (err) {
          console.error("Erro ao carregar dados de distribuição bancária:", err);
          setError("Erro ao carregar gráfico de distribuição bancária");
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [selectedYear, organizationId, projectionId, displayYear]);

  if (loading) {
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
                  Endividamento por Banco
                </CardTitle>
                <CardDescription className="text-white/80">
                  Carregando distribuição bancária...
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Carregando dados bancários...
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
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
                  Endividamento por Banco
                </CardTitle>
                <CardDescription className="text-white/80">
                  {error}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
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
                  Endividamento por Banco{" "}
                  {displaySafra ? `(${displaySafra})` : `(${displayYear})`}
                </CardTitle>
                <CardDescription className="text-white/80">
                  Distribuição das dívidas bancárias por instituição
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[350px] sm:h-[400px] flex flex-col items-center justify-center">
            <div className="text-muted-foreground mb-4">
              Nenhuma dívida bancária encontrada para a safra{" "}
              {displaySafra || displayYear}
            </div>
            <div className="text-center text-sm text-muted-foreground max-w-md">
              Para visualizar este gráfico, cadastre dívidas bancárias no módulo
              financeiro e defina valores para a safra selecionada.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular estatísticas para o footer
  const total = data.reduce((sum, item) => sum + item.valor, 0);
  const topBank = data[0];
  const concentracaoTop3 = data
    .slice(0, 3)
    .reduce((sum, bank) => sum + bank.percentual, 0);

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
                Endividamento por Banco ({displayYear})
              </CardTitle>
              <CardDescription className="text-white/80">
                Top 8 bancos + outros - Ranking por valor de dívida
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
                data={data}
                margin={{ top: 30, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="banco"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 10, fill: "var(--foreground)" }}
                  tickFormatter={(value) =>
                    value.length > 12 ? `${value.slice(0, 12)}...` : value
                  }
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  width={40}
                  tick={{ fill: "var(--foreground)" }}
                  tickFormatter={(value) => formatCurrency(value, 0)}
                />
                <ChartTooltip
                  content={<CustomTooltip />}
                  formatter={(value, name, payload) => [
                    formatCurrency(payload?.payload?.valor || 0),
                    "Valor da Dívida",
                  ]}
                  labelFormatter={(label) => `Banco: ${label}`}
                />
                <Bar
                  dataKey="valor"
                  fill="var(--color-valor)"
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey="valor"
                    position="top"
                    formatter={(value: number) => value >= 1000000 ? `${(value/1000000).toFixed(1)}M` : value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toFixed(0)}
                    fill="var(--color-valor)"
                    fontSize={11}
                    fontWeight="600"
                    offset={8}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm px-6 pt-4">
        <div className="flex gap-2 font-medium leading-none dark:text-white">
          🏆 <span className="font-semibold">{topBank.banco}</span> lidera com{" "}
          {topBank.percentual.toFixed(1)}% do endividamento
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground dark:text-gray-400 text-xs">
          Top 3 bancos concentram {concentracaoTop3.toFixed(1)}% do
          endividamento total ({formatCurrency(total)})
        </div>
      </CardFooter>
    </Card>
  );
}