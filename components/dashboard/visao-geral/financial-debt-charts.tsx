"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/formatters";
import { Loader2, TrendingUp, Building2 } from "lucide-react";
import { useOrganizationColors } from "@/lib/hooks/use-organization-colors";

interface FinancialDebtChartsProps {
  organizationId: string;
  selectedYear?: number;
}

interface DebtData {
  modalidade: string;
  valor: number;
  percentage: number;
}

// Cores padrão caso não haja cores personalizadas
const DEFAULT_COLORS = {
  CUSTEIO: "#1B124E", // Tom primário da marca
  INVESTIMENTOS: "#6346C2", // Tom secundário da marca
};

const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // Não mostrar label se menor que 5%

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium">{data.modalidade}</p>
        <p className="text-sm text-muted-foreground">
          Valor: {formatCurrency(data.valor)}
        </p>
        <p className="text-sm text-muted-foreground">
          Percentual: {data.percentage.toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

async function getDebtDataForAllYears(organizationId: string): Promise<DebtData[]> {
  const supabase = createClient();
  
  const { data: dividasBancarias } = await supabase
    .from('dividas_bancarias')
    .select('modalidade, fluxo_pagamento_anual')
    .eq('organizacao_id', organizationId);

  const modalidades: Record<string, number> = {
    CUSTEIO: 0,
    INVESTIMENTOS: 0,
  };

  dividasBancarias?.forEach(divida => {
    const fluxo = divida.fluxo_pagamento_anual || {};
    const totalDivida = Object.values(fluxo).reduce((sum: number, valor: any) => sum + (valor || 0), 0);
    modalidades[divida.modalidade] += totalDivida;
  });

  const total = Object.values(modalidades).reduce((sum, valor) => sum + valor, 0);

  return Object.entries(modalidades)
    .filter(([_, valor]) => valor > 0)
    .map(([modalidade, valor]) => ({
      modalidade,
      valor,
      percentage: total > 0 ? (valor / total) * 100 : 0,
    }));
}

async function getDebtDataForYear(organizationId: string, year: number): Promise<DebtData[]> {
  const supabase = createClient();
  
  const { data: dividasBancarias } = await supabase
    .from('dividas_bancarias')
    .select('modalidade, fluxo_pagamento_anual')
    .eq('organizacao_id', organizationId);

  const modalidades: Record<string, number> = {
    CUSTEIO: 0,
    INVESTIMENTOS: 0,
  };

  dividasBancarias?.forEach(divida => {
    const fluxo = divida.fluxo_pagamento_anual || {};
    const valorAno = fluxo[year.toString()] || 0;
    modalidades[divida.modalidade] += valorAno;
  });

  const total = Object.values(modalidades).reduce((sum, valor) => sum + valor, 0);

  return Object.entries(modalidades)
    .filter(([_, valor]) => valor > 0)
    .map(([modalidade, valor]) => ({
      modalidade,
      valor,
      percentage: total > 0 ? (valor / total) * 100 : 0,
    }));
}

function DebtPieChart({ 
  data, 
  title, 
  description,
  organizationId 
}: { 
  data: DebtData[]; 
  title: string; 
  description: string;
  organizationId?: string;
}) {
  const { palette } = useOrganizationColors(organizationId);
  
  // Criar mapeamento de cores dinâmico
  const colors = useMemo(() => ({
    CUSTEIO: palette[0] || DEFAULT_COLORS.CUSTEIO,
    INVESTIMENTOS: palette[1] || DEFAULT_COLORS.INVESTIMENTOS,
  }), [palette]);
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.valor, 0);

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
                {title}
              </CardTitle>
              <CardDescription className="text-white/80">
                {description}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="w-full h-[350px] sm:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="valor"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[entry.modalidade as keyof typeof colors]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>
                    {value}: {formatCurrency(entry.payload.valor)} ({entry.payload.percentage.toFixed(1)}%)
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm px-6 pt-4 bg-muted/30">
        <div className="flex gap-2 font-medium leading-none">
          Total de {formatCurrency(total)} em dívidas bancárias
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Distribuição entre modalidades de financiamento
        </div>
      </CardFooter>
    </Card>
  );
}

export function FinancialDebtCharts({ organizationId, selectedYear }: FinancialDebtChartsProps) {
  const [allYearsData, setAllYearsData] = useState<DebtData[]>([]);
  const [yearData, setYearData] = useState<DebtData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentYear = selectedYear || new Date().getFullYear();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [allYears, yearSpecific] = await Promise.all([
          getDebtDataForAllYears(organizationId),
          getDebtDataForYear(organizationId, currentYear),
        ]);

        setAllYearsData(allYears);
        setYearData(yearSpecific);
      } catch (err) {
        console.error("Erro ao carregar dados dos gráficos:", err);
        setError("Erro ao carregar gráficos");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organizationId, currentYear]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-48 mb-2 animate-pulse" />
              <div className="h-4 bg-muted rounded w-32 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DebtPieChart
      data={allYearsData}
      title="Distribuição de Dívidas Bancárias"
      description="Distribuição total entre custeio e investimentos"
      organizationId={organizationId}
    />
  );
}