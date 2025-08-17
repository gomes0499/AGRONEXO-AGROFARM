"use client";

import { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, Label, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, TrendingUp, BarChart3, Info, Calendar } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { createClient } from "@/lib/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useChartColors } from "@/contexts/chart-colors-context";

interface DebtBySafraChartsProps {
  organizationId: string;
  selectedSafraId?: string;
  projectionId?: string;
}

interface ChartData {
  name: string;
  value: number;
  fill: string;
}

interface BankRankingData {
  banco: string;
  valor: number;
  percentual: number;
}

export function DebtBySafraCharts({ organizationId, selectedSafraId, projectionId }: DebtBySafraChartsProps) {
  const [bankRankingData, setBankRankingData] = useState<BankRankingData[]>([]);
  const [currencyData, setCurrencyData] = useState<ChartData[]>([]);
  const [typeData, setTypeData] = useState<ChartData[]>([]);
  const [avgRateData, setAvgRateData] = useState<ChartData[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [avgRate, setAvgRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSafraName, setSelectedSafraName] = useState("");
  const cambio = 5.70;
  const { colors } = useChartColors();

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        
        // Buscar safras primeiro
        const { data: safras } = await supabase
          .from('safras')
          .select('*')
          .eq('organizacao_id', organizationId)
          .order('ano_inicio', { ascending: true });

        // Criar mapa de safras
        const safraMap = new Map();
        safras?.forEach(s => {
          safraMap.set(s.id, `${s.ano_inicio}/${String(s.ano_fim).slice(-2)}`);
        });

        // Buscar todas as dívidas bancárias
        const { data: dividas } = await supabase
          .from('dividas_bancarias')
          .select('*')
          .eq('organizacao_id', organizationId);

        if (dividas && dividas.length > 0 && selectedSafraId) {
          const safraName = safraMap.get(selectedSafraId);
          setSelectedSafraName(safraName || '');

          // 1. RANKING DE BANCOS PARA A SAFRA SELECIONADA
          const bankTotals = new Map<string, number>();
          
          let totalBRL = 0;
          let totalUSD = 0;
          let totalCusteio = 0;
          let totalInvestimento = 0;
          let somaTaxaPonderada = 0;
          let somaValorTotal = 0;

          dividas.forEach(divida => {
            const fluxo = divida.fluxo_pagamento_anual || {};
            
            // Verificar se esta dívida tem pagamento na safra selecionada
            if (fluxo[selectedSafraId]) {
              const valorDivida = parseFloat(fluxo[selectedSafraId].toString());
              const valorEmReais = divida.moeda === 'USD' ? valorDivida * cambio : valorDivida;
              
              // Agrupar por banco para o ranking
              let banco = divida.instituicao_bancaria || 'Outros';
              banco = banco.trim()
                .replace(/BANCO\s+/gi, '')
                .replace(/\s+/g, ' ')
                .toUpperCase();
              
              const currentBank = bankTotals.get(banco) || 0;
              bankTotals.set(banco, currentBank + valorEmReais);
              
              // Agrupar por moeda
              if (divida.moeda === 'USD') {
                totalUSD += valorEmReais;
              } else {
                totalBRL += valorEmReais;
              }
              
              // Agrupar por modalidade
              if (divida.modalidade === 'CUSTEIO') {
                totalCusteio += valorEmReais;
              } else if (divida.modalidade === 'INVESTIMENTO' || divida.modalidade === 'INVESTIMENTOS') {
                totalInvestimento += valorEmReais;
              }
              
              // Calcular taxa média ponderada
              const taxa = parseFloat(divida.taxa_real) || 0;
              if (taxa > 0 && valorEmReais > 0) {
                somaTaxaPonderada += taxa * valorEmReais;
                somaValorTotal += valorEmReais;
              }
            }
          });

          // Converter mapa de bancos para array e ordenar
          const totalBancos = Array.from(bankTotals.values()).reduce((sum, val) => sum + val, 0);
          const bankArray = Array.from(bankTotals.entries())
            .map(([banco, valor]) => ({
              banco,
              valor: valor / 1000000,
              percentual: (valor / totalBancos) * 100
            }))
            .filter(item => item.valor > 0)
            .sort((a, b) => b.valor - a.valor);

          // Adicionar total geral
          if (bankArray.length > 0) {
            bankArray.push({
              banco: 'TOTAL GERAL',
              valor: totalBancos / 1000000,
              percentual: 100
            });
          }

          setBankRankingData(bankArray);

          // Calcular totais
          const totalMoeda = totalBRL + totalUSD;
          setTotalDebt(totalMoeda);
          
          // Calcular taxa média ponderada
          const taxaMediaPonderada = somaValorTotal > 0 ? somaTaxaPonderada / somaValorTotal : 0;
          setAvgRate(taxaMediaPonderada);
          
          // Formatar dados de moeda
          const moedaData: ChartData[] = [];
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
          
          // Formatar dados de tipo
          const tipoData: ChartData[] = [];
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
          
          // Formatar dados de custo médio
          const custoData: ChartData[] = [
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
        console.error('Erro ao carregar dados por safra:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organizationId, selectedSafraId, projectionId]);

  const chartConfig: ChartConfig = {
    valor: { label: "Valor", color: "#8678E9" },
    REAIS: { label: "Reais", color: "#17134F" },
    DOLAR: { label: "Dólar", color: "#8678E9" },
    CUSTEIO: { label: "Custeio", color: "#5046C1" },
    INVESTIMENTO: { label: "Investimento", color: "#BCAAFF" },
    "CUSTO MÉDIO": { label: "Custo Médio", color: "#17134F" },
  };

  const DonutChart = ({ data, type }: { data: ChartData[]; type: 'currency' | 'type' | 'rate' }) => {
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

  const renderLegend = (data: ChartData[], total?: number) => {
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

  return (
    <div className="space-y-4">
      {/* Gráfico de Ranking de Bancos para a Safra Selecionada */}
      {selectedSafraId && bankRankingData.length > 0 && (
        <Card>
          <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-white/20">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">
                    Passivos Bancários - Concentração {selectedSafraName}
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    Ranking de instituições financeiras para a safra selecionada
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-0">
            {loading ? (
              <div className="h-[400px] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <>
                {/* Gráfico de Barras */}
                <div className="w-full h-[400px]">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={bankRankingData}
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
                            const item = bankRankingData.find(d => Math.abs(d.valor - Number(value)) < 0.01);
                            return [
                              `R$ ${Number(value).toFixed(1)}M (${item?.percentual.toFixed(1)}%)`,
                              "Valor"
                            ];
                          }}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Bar
                          dataKey="valor"
                          fill="#8678E9"
                          radius={[4, 4, 0, 0]}
                        >
                          {bankRankingData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.banco === 'TOTAL GERAL' ? colors.color1 : colors.color3} 
                            />
                          ))}
                          <LabelList
                            dataKey="valor"
                            position="top"
                            formatter={(value: number) => `${value.toFixed(1)}`}
                            fill="#000"
                            fontSize={11}
                            fontWeight="bold"
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
                        Taxa média ponderada
                      </div>
                      <div className="text-sm font-bold">
                        {avgRate.toFixed(2)}% a.a.
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}