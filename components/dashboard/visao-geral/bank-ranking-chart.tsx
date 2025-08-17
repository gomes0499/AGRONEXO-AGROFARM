"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  LabelList,
  PieChart,
  Pie,
  Label,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Building2, DollarSign, BarChart3, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useChartColors } from "@/contexts/chart-colors-context";

interface BankRankingChartProps {
  organizationId: string;
  projectionId?: string;
}

interface BankData {
  banco: string;
  valor: number;
  percentual: number;
}

interface DonutData {
  name: string;
  value: number;
  fill: string;
}

export function BankRankingChart({ organizationId, projectionId }: BankRankingChartProps) {
  const [data, setData] = useState<BankData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para os gráficos de rosca
  const [currencyData, setCurrencyData] = useState<DonutData[]>([]);
  const [typeData, setTypeData] = useState<DonutData[]>([]);
  const [avgRateData, setAvgRateData] = useState<DonutData[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [avgRate, setAvgRate] = useState(0);
  
  const cambio = 5.70;
  const { colors } = useChartColors();

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        
        // Buscar todas as dívidas bancárias
        const { data: dividas } = await supabase
          .from('dividas_bancarias')
          .select('*')
          .eq('organizacao_id', organizationId);

        if (dividas && dividas.length > 0) {
          // DADOS PARA O GRÁFICO DE BARRAS (apenas bancos)
          const bancoMap = new Map<string, number>();
          const dividasBancarias = dividas.filter(d => d.tipo === 'BANCO');
          
          // DADOS PARA OS GRÁFICOS DE ROSCA (todas as dívidas)
          let totalBRL = 0;
          let totalUSD = 0;
          let totalCusteio = 0;
          let totalInvestimento = 0;
          let somaTaxaPonderada = 0;
          let somaValorTotal = 0;
          
          dividas.forEach(divida => {
            const fluxo = divida.fluxo_pagamento_anual || {};
            
            // Somar todos os valores do fluxo
            let totalDivida = 0;
            Object.values(fluxo).forEach((valor: any) => {
              const valorNum = parseFloat(valor.toString());
              totalDivida += valorNum;
            });
            
            // Converter para reais se necessário
            const valorConvertido = divida.moeda === 'USD' 
              ? totalDivida * cambio
              : totalDivida;
            
            // Para gráfico de barras (apenas bancos)
            if (divida.tipo === 'BANCO') {
              let banco = divida.instituicao_bancaria || 'Outros';
              banco = banco.trim()
                .replace(/BANCO\s+/gi, '')
                .replace(/\s+/g, ' ')
                .toUpperCase();
              
              const current = bancoMap.get(banco) || 0;
              bancoMap.set(banco, current + valorConvertido);
            }
            
            // Para gráficos de rosca (todas as dívidas)
            // Agrupar por moeda
            if (divida.moeda === 'USD') {
              totalUSD += valorConvertido;
            } else {
              totalBRL += valorConvertido;
            }
            
            // Agrupar por modalidade
            if (divida.modalidade === 'CUSTEIO') {
              totalCusteio += valorConvertido;
            } else if (divida.modalidade === 'INVESTIMENTO' || divida.modalidade === 'INVESTIMENTOS') {
              totalInvestimento += valorConvertido;
            }
            
            // Calcular taxa média ponderada
            const taxa = parseFloat(divida.taxa_real) || 0;
            if (taxa > 0 && valorConvertido > 0) {
              somaTaxaPonderada += taxa * valorConvertido;
              somaValorTotal += valorConvertido;
            }
          });
          
          // Processar dados do gráfico de barras
          const total = Array.from(bancoMap.values()).reduce((sum, val) => sum + val, 0);
          const dataArray = Array.from(bancoMap.entries())
            .map(([banco, valor]) => ({
              banco,
              valor: valor / 1000000,
              percentual: (valor / total) * 100,
            }))
            .filter(item => item.valor > 0)
            .sort((a, b) => b.valor - a.valor);
          
          dataArray.push({
            banco: 'TOTAL GERAL',
            valor: total / 1000000,
            percentual: 100,
          });
          
          setData(dataArray);
          
          // Processar dados dos gráficos de rosca
          const totalMoeda = totalBRL + totalUSD;
          setTotalDebt(totalMoeda);
          
          // Taxa média ponderada
          const taxaMediaPonderada = somaValorTotal > 0 ? somaTaxaPonderada / somaValorTotal : 0;
          setAvgRate(taxaMediaPonderada);
          
          // Dados de moeda
          const moedaData: DonutData[] = [];
          if (totalBRL > 0) {
            moedaData.push({
              name: 'REAIS',
              value: totalBRL,
              fill: colors.color1
            });
          }
          if (totalUSD > 0) {
            moedaData.push({
              name: 'DÓLAR',
              value: totalUSD,
              fill: colors.color3
            });
          }
          
          // Dados de tipo
          const tipoData: DonutData[] = [];
          if (totalCusteio > 0) {
            tipoData.push({
              name: 'CUSTEIO',
              value: totalCusteio,
              fill: colors.color2
            });
          }
          if (totalInvestimento > 0) {
            tipoData.push({
              name: 'INVESTIMENTO',
              value: totalInvestimento,
              fill: colors.color4
            });
          }
          
          // Dados de custo médio
          const custoData: DonutData[] = [
            {
              name: 'CUSTO MÉDIO',
              value: taxaMediaPonderada,
              fill: colors.color1
            },
            {
              name: 'RESTANTE',
              value: Math.max(0, 100 - taxaMediaPonderada),
              fill: '#e5e7eb'
            }
          ];
          
          setCurrencyData(moedaData);
          setTypeData(tipoData);
          setAvgRateData(custoData);
        }
      } catch (error) {
        console.error('Erro ao carregar ranking de bancos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organizationId, projectionId]);

  const chartConfig = {
    valor: {
      label: "Valor",
      color: "#8678E9",
    },
  } satisfies ChartConfig;

  const DonutChart = ({ data, type }: { data: DonutData[]; type: 'currency' | 'type' | 'rate' }) => {
    const formattedValue = useMemo(() => {
      if (type === 'rate') {
        return `${avgRate.toFixed(2)}%`;
      }
      
      const total = data.reduce((sum, item) => {
        if (item.name !== 'RESTANTE') {
          return sum + item.value;
        }
        return sum;
      }, 0);
      
      if (total >= 1000000) {
        return `${(total / 1000000).toFixed(1)}M`;
      }
      return total.toFixed(0);
    }, [data, type]);

    const unit = type === 'rate' ? 'a.a.' : 'R$';

    if (data.length === 0) {
      return (
        <div className="h-[140px] flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Sem dados</p>
        </div>
      );
    }

    return (
      <ChartContainer config={chartConfig} className="h-[140px] w-[140px]">
        <PieChart>
          <ChartTooltip 
            cursor={false}
            content={
              <ChartTooltipContent 
                hideLabel 
                formatter={(value: any) => {
                  if (type === 'rate') {
                    return `${Number(value).toFixed(2)}%`;
                  }
                  return `R$ ${(Number(value) / 1000000).toFixed(1)}M`;
                }}
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={35}
            outerRadius={55}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) - 5}
                        className="fill-foreground text-xl font-bold"
                      >
                        {formattedValue}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 12}
                        className="fill-muted-foreground text-xs"
                      >
                        {unit}
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
    );
  };

  const renderLegend = (data: DonutData[], total?: number) => {
    const calcTotal = total || data.reduce((sum, item) => {
      if (item.name !== 'RESTANTE') {
        return sum + item.value;
      }
      return sum;
    }, 0);

    return (
      <div className="space-y-1">
        {data.filter(item => item.name !== 'RESTANTE').map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-sm" 
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span className="font-medium">
              {calcTotal > 0 ? ((item.value / calcTotal) * 100).toFixed(1) : 0}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Endividamento por Banco</CardTitle>
              <CardDescription className="text-white/80">
                Carregando dados...
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">Carregando gráfico...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Endividamento por Banco</CardTitle>
              <CardDescription className="text-white/80">
                Nenhum dado disponível
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">
              Adicione dados de dívidas bancárias para visualizar o gráfico
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
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-white">
                Endividamento por Banco
              </CardTitle>
              <CardDescription className="text-white/80">
                Distribuição do endividamento por instituição financeira
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6 pb-0">
        {/* Gráfico de Barras */}
        <div className="w-full h-[400px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 40, right: 30, bottom: 60, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="banco"
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 11, fill: "var(--foreground)" }}
                />
                <YAxis
                  tickFormatter={(value) => value.toFixed(0)}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tick={{ fill: "var(--foreground)" }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: any) => {
                    const item = data.find(d => Math.abs(d.valor - Number(value)) < 0.01);
                    return [
                      `R$ ${Number(value).toFixed(1)}M (${item?.percentual.toFixed(1)}%)`,
                      "Valor"
                    ];
                  }}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar
                  dataKey="valor"
                  fill={chartConfig.valor.color}
                  radius={[4, 4, 0, 0]}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.banco === 'TOTAL GERAL' ? colors.color1 : colors.color3} 
                    />
                  ))}
                  <LabelList
                    dataKey="valor"
                    position="top"
                    content={(props: any) => {
                      const { x, y, width, height, value, index } = props;
                      const entry = data[index];
                      if (!entry) return null;
                      
                      return (
                        <g>
                          <text
                            x={x + width / 2}
                            y={y - 15}
                            fill="#666"
                            fontSize={10}
                            textAnchor="middle"
                          >
                            {entry.percentual.toFixed(1)}%
                          </text>
                          <text
                            x={x + width / 2}
                            y={y - 3}
                            className="fill-foreground"
                            fontSize={11}
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {entry.valor.toFixed(1)}
                          </text>
                        </g>
                      );
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        
        {/* Gráficos de Rosca */}
        <div className="grid grid-cols-3 divide-x divide-border border-t">
          {/* Endividamento por Moeda */}
          <div className="p-4 flex items-center gap-4">
            <div className="flex-shrink-0">
              <DonutChart data={currencyData} type="currency" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Endividamento por Moeda</span>
              </div>
              {renderLegend(currencyData, totalDebt)}
            </div>
          </div>

          {/* Endividamento por Tipo */}
          <div className="p-4 flex items-center gap-4">
            <div className="flex-shrink-0">
              <DonutChart data={typeData} type="type" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Endividamento por Tipo</span>
              </div>
              {renderLegend(typeData)}
            </div>
          </div>

          {/* Custo Médio */}
          <div className="p-4 flex items-center gap-4">
            <div className="flex-shrink-0">
              <DonutChart data={avgRateData} type="rate" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Custo Médio</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Taxa média ponderada de todas as dívidas
              </div>
              <div className="text-sm font-bold">
                {avgRate.toFixed(2)}% a.a.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}