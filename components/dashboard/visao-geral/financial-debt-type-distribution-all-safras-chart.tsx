"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { PercentIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { formatCurrency, formatPercent } from "@/lib/utils/formatters";
import { useChartColors } from "@/contexts/chart-colors-context";
import type { DebtTypeDistributionAllSafrasData, DebtTypeData } from "@/lib/actions/debt-type-distribution-all-safras-actions";
import { getDebtTypeDistributionAllSafrasData } from "@/lib/actions/debt-type-distribution-all-safras-actions";

interface FinancialDebtTypeDistributionAllSafrasChartProps {
  organizationId: string;
  initialData: DebtTypeDistributionAllSafrasData;
  projectionId?: string;
}

function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-background dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm dark:text-white">{data.name}</p>
        <div className="my-1 h-px bg-border dark:bg-gray-600" />
        <div className="space-y-1 mt-2">
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground dark:text-gray-400">
              Valor:
            </span>
            <span className="font-medium dark:text-white">
              {formatCurrency(data.value)}
            </span>
          </p>
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground dark:text-gray-400">
              Participação:
            </span>
            <span className="font-medium dark:text-white">
              {formatPercent(data.percentual)}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export function FinancialDebtTypeDistributionAllSafrasChart({
  organizationId,
  initialData,
  projectionId,
}: FinancialDebtTypeDistributionAllSafrasChartProps) {
  const [data, setData] = useState<DebtTypeDistributionAllSafrasData>(initialData);
  const [isPending, startTransition] = useTransition();
  
  // Usar cores customizadas
  const { colors } = useChartColors();
  
  // Mapear cores para os dados
  const colorMapping = {
    color1: colors.color1,
    color2: colors.color2,
  };

  // Update data when filters change
  useEffect(() => {
    startTransition(async () => {
      try {
        const newData = await getDebtTypeDistributionAllSafrasData(
          organizationId,
          projectionId
        );
        setData(newData);
      } catch (error) {
        console.error("Erro ao atualizar dados de distribuição por modalidade:", error);
      }
    });
  }, [organizationId, projectionId]);

  if (!data.data || data.data.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <PercentIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Dívidas: Custeio vs Investimentos (Consolidado)
                </CardTitle>
                <CardDescription className="text-white/80">
                  Custeio vs Investimentos
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[350px] sm:h-[400px] flex flex-col items-center justify-center">
            <div className="text-muted-foreground mb-4">
              Nenhuma dívida bancária encontrada
            </div>
            <div className="text-center text-sm text-muted-foreground max-w-md">
              Para visualizar este gráfico, cadastre dívidas bancárias no módulo
              financeiro.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular estatísticas
  const total = data.data.reduce((sum, item) => sum + item.value, 0);

  // Configuração do gráfico
  const chartConfig: ChartConfig = {
    custeio: {
      label: "Custeio",
      color: colors.color1,
    },
    investimentos: {
      label: "Investimentos",
      color: colors.color2,
    },
  };

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <PercentIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">
                Dívidas: Custeio vs Investimentos (Consolidado)
                {isPending && " (Atualizando...)"}
              </CardTitle>
              <CardDescription className="text-white/80">
                Distribuição das dívidas bancárias por modalidade
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="w-full h-[350px] sm:h-[400px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${formatPercent(percent)}`
                  }
                >
                  {data.data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colorMapping[entry.color as keyof typeof colorMapping] || colors.color1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry, index) => {
                    if (entry && entry.payload) {
                      const payload = entry.payload as unknown as DebtTypeData;
                      return (
                        <span className="text-sm dark:text-white">
                          {payload.name} ({formatPercent(payload.percentual)})
                        </span>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      {/* Footer com estatísticas */}
      <div className="p-4 border-t text-sm">
        <p className="text-center font-medium dark:text-white">
          Total de dívidas: {formatCurrency(total)}
          <span className="mx-2">•</span>
          <span>
            Custeio:{" "}
            {formatPercent(
              data.data.find((d) => d.name === "Custeio")?.percentual || 0
            )}
            <span className="mx-1">-</span>
            Investimentos:{" "}
            {formatPercent(
              data.data.find((d) => d.name === "Investimentos")?.percentual || 0
            )}
          </span>
        </p>
      </div>
    </Card>
  );
}