"use client";

import { useState, useEffect } from "react";
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
  ChartTooltip,
  ChartContainer,
} from "@/components/ui/chart";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/formatters";
import { Loader2 } from "lucide-react";

interface FinancialBankDistributionAllSafrasChartProps {
  organizationId: string;
}

interface BankData {
  banco: string;
  valor: number;
  percentual: number;
  rank: number;
}

const chartConfig = {
  valor: {
    label: "Valor da Dívida",
    color: "#1B124E", // Tom primário da marca
  },
} satisfies ChartConfig;

async function getBankDistributionAllSafrasData(organizationId: string): Promise<{ data: BankData[] }> {
  const supabase = createClient();
  
  // Busca todas as dívidas bancárias
  const { data: dividasBancarias } = await supabase
    .from('dividas_bancarias')
    .select('*')
    .eq('organizacao_id', organizationId);

  if (!dividasBancarias || dividasBancarias.length === 0) {
    return { data: [] };
  }
  
  // Agrupar por banco
  const bankTotals: Record<string, number> = {};
  
  // Processar cada dívida bancária
  dividasBancarias.forEach(divida => {
    const banco = divida.instituicao_bancaria || "BANCO NÃO INFORMADO";
    
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
    
    // Soma todos os valores de todas as safras para este banco
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
    
    // Acumula o valor no banco correspondente se for maior que zero
    if (valorTotal > 0) {
      bankTotals[banco] = (bankTotals[banco] || 0) + valorTotal;
    }
  });

  // Calcular total geral
  const totalGeral = Object.values(bankTotals).reduce((sum, valor) => sum + valor, 0);
  
  if (totalGeral === 0) {
    return { data: [] };
  }

  // Criar array ordenado de bancos
  const allBanks = Object.entries(bankTotals)
    .filter(([_, valor]) => valor > 0)
    .map(([banco, valor]) => ({
      banco,
      valor,
      percentual: (valor / totalGeral) * 100,
      rank: 0,
    }))
    .sort((a, b) => b.valor - a.valor)
    .map((bank, index) => ({ ...bank, rank: index + 1 }));

  // Pegar os top 8 e agrupar o resto em "OUTROS"
  const top8 = allBanks.slice(0, 8);
  const outros = allBanks.slice(8);
  
  const banks: BankData[] = [...top8];
  
  // Se há mais de 8 bancos, criar categoria "OUTROS"
  if (outros.length > 0) {
    const valorOutros = outros.reduce((sum, bank) => sum + bank.valor, 0);
    const percentualOutros = (valorOutros / totalGeral) * 100;
    
    banks.push({
      banco: `OUTROS (${outros.length})`,
      valor: valorOutros,
      percentual: percentualOutros,
      rank: 9
    });
  }

  return { data: banks };
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm">{label}</p>
        <div className="my-1 h-px bg-border" />
        <div className="space-y-1 mt-2">
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground">Valor:</span> 
            <span className="font-medium">{formatCurrency(data.valor)}</span>
          </p>
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground">Participação:</span> 
            <span className="font-medium">{data.percentual.toFixed(1)}%</span>
          </p>
          <p className="text-sm flex justify-between gap-4">
            <span className="text-muted-foreground">Ranking:</span> 
            <span className="font-medium">{data.rank}º posição</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export function FinancialBankDistributionAllSafrasChart({ organizationId }: FinancialBankDistributionAllSafrasChartProps) {
  const [data, setData] = useState<BankData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Efeito para carregar dados quando a organização mudar
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Carregando dados bancários consolidados de todas as safras`);
        
        const result = await getBankDistributionAllSafrasData(organizationId);
        
        const { data: bankData } = result;
        console.log(`Dados carregados: ${bankData.length} bancos encontrados (todas as safras)`);
        
        setData(bankData);
      } catch (err) {
        console.error("Erro ao carregar dados de distribuição bancária:", err);
        setError("Erro ao carregar gráfico de distribuição bancária");
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
                  Endividamento por Banco (Consolidado)
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

  // Calcular estatísticas para o footer
  const total = data.reduce((sum, item) => sum + item.valor, 0);
  const topBank = data[0];
  const concentracaoTop3 = data.slice(0, 3).reduce((sum, bank) => sum + bank.percentual, 0);

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
                Endividamento por Banco (Consolidado)
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
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
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
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  width={40}
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
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm px-6 pt-4 bg-muted/30">
        <div className="flex gap-2 font-medium leading-none">
          🏆 <span className="font-semibold">{topBank.banco}</span> lidera com {topBank.percentual.toFixed(1)}% do endividamento
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground text-xs">
          Top 3 bancos concentram {concentracaoTop3.toFixed(1)}% do endividamento total ({formatCurrency(total)})
        </div>
      </CardFooter>
    </Card>
  );
}