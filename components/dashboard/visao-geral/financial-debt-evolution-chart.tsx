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
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/formatters";
import { Loader2 } from "lucide-react";
import { useOrganizationColors } from "@/lib/hooks/use-organization-colors";

interface FinancialDebtEvolutionChartProps {
  organizationId: string;
}

interface DebtEvolutionData {
  ano: string;
  CUSTEIO: number;
  INVESTIMENTOS: number;
  total: number;
}

// Cores padrão caso não haja cores personalizadas
const DEFAULT_CHART_COLORS = {
  CUSTEIO: "#1B124E", // Tom primário da marca
  INVESTIMENTOS: "#6346C2", // Tom secundário da marca
};

async function getDebtEvolutionData(organizationId: string): Promise<DebtEvolutionData[]> {
  const supabase = createClient();
  
  const { data: dividasBancarias } = await supabase
    .from('dividas_bancarias')
    .select('modalidade, fluxo_pagamento_anual')
    .eq('organizacao_id', organizationId);

  if (!dividasBancarias || dividasBancarias.length === 0) {
    return [];
  }

  // Extrair todos os anos disponíveis
  const anosSet = new Set<string>();
  dividasBancarias.forEach(divida => {
    const fluxo = divida.fluxo_pagamento_anual || {};
    Object.keys(fluxo).forEach(ano => anosSet.add(ano));
  });

  const anos = Array.from(anosSet).sort();

  // Calcular valores por ano e modalidade
  const evolutionData: DebtEvolutionData[] = anos.map(ano => {
    let custeio = 0;
    let investimentos = 0;

    dividasBancarias.forEach(divida => {
      const fluxo = divida.fluxo_pagamento_anual || {};
      const valorAno = fluxo[ano] || 0;
      
      if (divida.modalidade === 'CUSTEIO') {
        custeio += valorAno;
      } else if (divida.modalidade === 'INVESTIMENTOS') {
        investimentos += valorAno;
      }
    });

    return {
      ano,
      CUSTEIO: custeio,
      INVESTIMENTOS: investimentos,
      total: custeio + investimentos,
    };
  }).filter(item => item.total > 0); // Filtrar anos sem dívidas

  return evolutionData;
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

export function FinancialDebtEvolutionChart({ organizationId }: FinancialDebtEvolutionChartProps) {
  const [data, setData] = useState<DebtEvolutionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { palette } = useOrganizationColors(organizationId);
  
  // Criar configuração dinâmica do gráfico com cores da organização
  const chartConfig = useMemo(() => ({
    CUSTEIO: {
      label: "Custeio",
      color: palette[0] || DEFAULT_CHART_COLORS.CUSTEIO,
    },
    INVESTIMENTOS: {
      label: "Investimentos",
      color: palette[1] || DEFAULT_CHART_COLORS.INVESTIMENTOS,
    },
  } satisfies ChartConfig), [palette]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const evolutionData = await getDebtEvolutionData(organizationId);
        setData(evolutionData);
      } catch (err) {
        console.error("Erro ao carregar dados de evolução:", err);
        setError("Erro ao carregar gráfico de evolução");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organizationId]);

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
                  Evolução das Dívidas Bancárias
                </CardTitle>
                <CardDescription className="text-white/80">
                  Carregando evolução das dívidas...
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">Carregando gráfico...</div>
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
                  Evolução das Dívidas Bancárias
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
                  Evolução das Dívidas Bancárias
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
  const totalGeral = data.reduce((sum, item) => sum + item.total, 0);
  const anoMaior = data.reduce((max, item) => item.total > max.total ? item : max, data[0]);
  const crescimento = data.length > 1 ? 
    ((data[data.length - 1].total - data[0].total) / data[0].total) * 100 : 0;

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
                Evolução das Dívidas Bancárias
              </CardTitle>
              <CardDescription className="text-white/80">
                Distribuição anual entre custeio e investimentos ({data[0]?.ano} - {data[data.length - 1]?.ano})
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
                  tickFormatter={(value) => formatCurrency(value, 0)}
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
      <CardFooter className="flex-col items-start gap-2 text-sm px-6 pt-4 bg-muted/30">
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