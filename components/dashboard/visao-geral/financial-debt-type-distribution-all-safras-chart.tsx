"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { PercentIcon } from "lucide-react";
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
} from "@/components/ui/chart";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatPercent } from "@/lib/utils/formatters";
import { Loader2 } from "lucide-react";

interface FinancialDebtTypeDistributionAllSafrasProps {
  organizationId: string;
}

interface DebtTypeData {
  name: string;
  value: number;
  percentual: number;
  color: string;
}

const COLORS = ["#1B124E", "#4338CA"];

const chartConfig = {
  valor: {
    label: "Valor da Dívida",
    color: "#1B124E",
  },
} satisfies ChartConfig;

async function getDebtTypeDistributionAllSafrasData(organizationId: string): Promise<{ data: DebtTypeData[] }> {
  const supabase = createClient();
  
  // Busca todas as dívidas bancárias
  const { data: dividasBancarias } = await supabase
    .from('dividas_bancarias')
    .select('*')
    .eq('organizacao_id', organizationId);

  if (!dividasBancarias || dividasBancarias.length === 0) {
    return { data: [] };
  }

  // Inicializar totais por modalidade
  const totalPorModalidade: Record<string, number> = {
    CUSTEIO: 0,
    INVESTIMENTOS: 0
  };
  
  // Processar cada dívida bancária
  dividasBancarias.forEach(divida => {
    const modalidade = divida.modalidade || "OUTROS";
    
    // Verifica se valores_por_ano existe e processa
    let valores = divida.valores_por_ano;
    if (typeof valores === 'string') {
      try {
        valores = JSON.parse(valores);
      } catch (e) {
        console.error("Erro ao parsear valores_por_ano:", e);
        valores = {};
      }
    }
    
    // Soma todos os valores de todas as safras para esta modalidade
    let valorTotal = 0;
    
    if (valores && typeof valores === 'object') {
      // Somar todos os valores de todas as safras
      Object.values(valores).forEach(valor => {
        if (typeof valor === 'number' && valor > 0) {
          valorTotal += valor;
        }
      });
    }
    
    // Se não encontrou nenhum valor mas tem valor_total, usa ele
    if (valorTotal === 0 && divida.valor_total) {
      valorTotal = divida.valor_total;
    }
    
    // Acumula o valor na modalidade correspondente se for maior que zero
    if (valorTotal > 0) {
      if (modalidade === "CUSTEIO" || modalidade === "INVESTIMENTOS") {
        totalPorModalidade[modalidade] += valorTotal;
      } else {
        // Para outras modalidades, considerar como INVESTIMENTOS
        totalPorModalidade["INVESTIMENTOS"] += valorTotal;
      }
    }
  });

  // Calcular total geral
  const totalGeral = Object.values(totalPorModalidade).reduce((sum, valor) => sum + valor, 0);
  
  if (totalGeral === 0) {
    return { data: [] };
  }

  // Criar array de dados para o gráfico com percentuais corretos
  const data: DebtTypeData[] = [
    {
      name: "Custeio",
      value: totalPorModalidade.CUSTEIO,
      percentual: totalPorModalidade.CUSTEIO / totalGeral,
      color: COLORS[0]
    },
    {
      name: "Investimentos",
      value: totalPorModalidade.INVESTIMENTOS,
      percentual: totalPorModalidade.INVESTIMENTOS / totalGeral,
      color: COLORS[1]
    }
  ].filter(item => item.value > 0);

  return { data };
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
            <span className="text-muted-foreground dark:text-gray-400">Valor:</span> 
            <span className="font-medium dark:text-white">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground dark:text-gray-400">Participação:</span> 
            <span className="font-medium dark:text-white">{formatPercent(data.percentual)}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export function FinancialDebtTypeDistributionAllSafrasChart({ organizationId }: FinancialDebtTypeDistributionAllSafrasProps) {
  const [data, setData] = useState<DebtTypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Efeito para carregar dados quando a organização mudar
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Carregando dados de distribuição de modalidades para todas as safras`);
        
        const result = await getDebtTypeDistributionAllSafrasData(organizationId);
        
        const { data: typeData } = result;
        console.log(`Dados carregados: ${typeData.length} modalidades encontradas (todas as safras)`);
        
        setData(typeData);
      } catch (err) {
        console.error("Erro ao carregar dados de distribuição por modalidade:", err);
        setError("Erro ao carregar gráfico de distribuição por modalidade");
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
                <PercentIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Distribuição de Dívidas
                </CardTitle>
                <CardDescription className="text-white/80">
                  Carregando dados...
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
                Carregando dados...
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
                <PercentIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Distribuição de Dívidas
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
              Para visualizar este gráfico, cadastre dívidas bancárias no módulo financeiro.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular estatísticas
  const total = data.reduce((sum, item) => sum + item.value, 0);

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
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${formatPercent(percent)}`}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || COLORS[index % COLORS.length]} 
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
                      return <span className="text-sm dark:text-white">{payload.name} ({formatPercent(payload.percentual)})</span>;
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
      <div className="p-4 bg-muted/30 rounded-b-lg text-sm">
        <p className="text-center font-medium dark:text-white">
          Total de dívidas: {formatCurrency(total)}
          <span className="mx-2">•</span>
          <span>
            Custeio: {formatPercent(data.find(d => d.name === "Custeio")?.percentual || 0)}
            <span className="mx-1">-</span>
            Investimentos: {formatPercent(data.find(d => d.name === "Investimentos")?.percentual || 0)}
          </span>
        </p>
      </div>
    </Card>
  );
}