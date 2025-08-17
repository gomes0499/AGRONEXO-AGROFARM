"use client";

import { useState, useTransition, useEffect } from "react";
import { LayoutList } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Loader2 } from "lucide-react";
import { useChartColors } from "@/contexts/chart-colors-context";
import { getTotalLiabilitiesChartData, type LiabilityData, type TotalLiabilitiesChartData } from "@/lib/actions/total-liabilities-chart-actions";

// Formatar valor monetário
function formatCurrency(value: number, digits = 2) {
  // Não usar notação compacta, sempre mostrar o valor completo
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "standard",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

  return formatted;
}

interface FinancialTotalLiabilitiesChartProps {
  organizationId: string;
  selectedYear?: number | string;
  projectionId?: string;
  initialData: TotalLiabilitiesChartData;
  error?: string;
  selectedSafraId?: string;
}

export function FinancialTotalLiabilitiesChart({
  organizationId,
  selectedYear,
  projectionId,
  initialData,
  error: initialError,
  selectedSafraId,
}: FinancialTotalLiabilitiesChartProps) {
  const [data, setData] = useState<LiabilityData[]>(initialData.data);
  const [displaySafra, setDisplaySafra] = useState<string | undefined>(initialData.safraName);
  const [error, setError] = useState<string | null>(initialError || null);
  const [isPending, startTransition] = useTransition();
  
  // Usar cores customizadas
  const { colors } = useChartColors();
  
  const chartConfig = {
    total: {
      label: "Dívida Total",
      color: colors.color1,
    },
    liquido: {
      label: "Dívida Líquida",
      color: colors.color2,
    },
    bancos_tradings: {
      label: "Dívida Bancária",
      color: colors.color3,
    },
    outros: {
      label: "Outros Passivos",
      color: colors.color4,
    },
  } satisfies ChartConfig;

  // Função para recarregar dados
  const refreshData = () => {
    startTransition(async () => {
      try {
        setError(null);
        const result = await getTotalLiabilitiesChartData(
          organizationId,
          selectedSafraId || selectedYear,
          projectionId
        );
        setData(result.data);
        setDisplaySafra(result.safraName);
      } catch (err) {
        console.error("Erro ao recarregar dados de passivos totais:", err);
        setError("Erro ao recarregar gráfico de passivos totais");
      }
    });
  };
  
  // Update data when filters change
  useEffect(() => {
    if (selectedSafraId) {
      refreshData();
    }
  }, [selectedSafraId]);

  if (error) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <LayoutList className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Passivos Totais - R$ milhões</CardTitle>
                <CardDescription className="text-white/80">
                  {error}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground dark:text-gray-400">
              {error}
            </div>
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
                <LayoutList className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Passivos Totais - R$ milhões {displaySafra ? `(${displaySafra})` : ""}
                </CardTitle>
                <CardDescription className="text-white/80">
                  Composição dos passivos por tipo
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[350px] sm:h-[400px] flex flex-col items-center justify-center">
            <div className="text-muted-foreground dark:text-gray-400 mb-4">
              Nenhum dado de passivos encontrado
            </div>
            <div className="text-center text-sm text-muted-foreground dark:text-gray-400 max-w-md">
              Para visualizar este gráfico, cadastre dívidas bancárias, de
              fornecedores e outras dívidas no módulo financeiro.
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
              <LayoutList className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">
                Posição da Dívida por Safra - R$ milhões
                {isPending && (
                  <Loader2 className="h-4 w-4 animate-spin inline ml-2" />
                )}
              </CardTitle>
              <CardDescription className="text-white/80">
                {data && data.length > 0
                  ? data.length === 1 
                    ? `Valores totais das dívidas na safra ${data[0]?.safra}`
                    : `Valores totais das dívidas nas safras com movimentação (${
                        data[0]?.safra
                      } - ${data[data.length - 1]?.safra})`
                  : "Valores totais das dívidas em todas as safras"}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 pb-6">
        <div className="w-full h-[350px] sm:h-[400px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 35, right: 30, left: 20, bottom: 60 }}
                barGap={0}
                barCategoryGap="5%"
                barSize={30}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="safra"
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tickMargin={25}
                  tick={{ fontSize: 11, fill: "var(--foreground)" }}
                  interval={0}
                />
                <YAxis
                  tickFormatter={(value) => (value/1000000).toFixed(0)}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                  tick={{ fill: "var(--foreground)" }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent className="dark:border-gray-700" />
                  }
                  formatter={(value: any, name: any) => {
                    const formattedValue = formatCurrency(Number(value));
                    const label = chartConfig[name as keyof typeof chartConfig]?.label || name;
                    return [
                      `${formattedValue} `,
                      label,
                    ];
                  }}
                  labelFormatter={(label) => `Safra: ${label}`}
                />
                <Legend
                  verticalAlign="top"
                  wrapperStyle={{ paddingTop: "10px" }}
                  formatter={(value, entry) => (
                    <span className="text-foreground dark:text-white">
                      {value}
                    </span>
                  )}
                />
                <Bar
                  dataKey="outros"
                  name="Outros Passivos"
                  fill={chartConfig.outros.color}
                >
                  <LabelList
                    dataKey="outros"
                    position="top"
                    formatter={(value: number) => (value/1000000).toFixed(0)}
                    fill={chartConfig.outros.color}
                    fontSize={10}
                    fontWeight="600"
                    offset={5}
                  />
                </Bar>
                <Bar
                  dataKey="bancos_tradings"
                  name="Dívida Bancária"
                  fill={chartConfig.bancos_tradings.color}
                >
                  <LabelList
                    dataKey="bancos_tradings"
                    position="top"
                    formatter={(value: number) => (value/1000000).toFixed(0)}
                    fill={chartConfig.bancos_tradings.color}
                    fontSize={10}
                    fontWeight="600"
                    offset={5}
                  />
                </Bar>
                <Bar
                  dataKey="total"
                  name="Dívida Total"
                  fill={chartConfig.total.color}
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey="total"
                    position="top"
                    formatter={(value: number) => (value/1000000).toFixed(0)}
                    fill={chartConfig.total.color}
                    fontSize={10}
                    fontWeight="600"
                    offset={5}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}