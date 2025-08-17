"use client";

import { useEffect, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
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
  ChartLegend,
} from "@/components/ui/chart";
import { ChartLegendMultirow } from "@/components/ui/chart-legend-multirow";
import { TrendingDown, Info } from "lucide-react";
import { getDebtPosition } from "@/lib/actions/debt-position-actions";
import type { ConsolidatedDebtPosition } from "@/lib/actions/debt-position-actions";
import { useChartColors } from "@/contexts/chart-colors-context";
import { useMemo } from "react";

interface DebtEvolutionChartProps {
  organizationId: string;
  projectionId?: string;
}

export function DebtEvolutionChart({ organizationId, projectionId }: DebtEvolutionChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useChartColors();

  // Paleta de cores baseada nas cores da organização ou padrão
  const COLOR_VARIATIONS = useMemo(() => ({
    dividaTotal: colors.color1,      // Azul escuro para Dívida Total (barra)
    dividaLiquida: colors.color3,    // Lavanda para Dívida Líquida (barra)
    bancos: '#FF8C42',               // Laranja para Bancos (linha)
    outros: '#FFD60A',               // Amarelo para Outros (linha)
  }), [colors]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const debtData = await getDebtPosition(organizationId, projectionId);
        
        if (debtData && debtData.anos && debtData.anos.length > 0) {
          // Transformar dados para o formato do gráfico
          const chartData = debtData.anos.map(ano => {
            // Buscar dívidas bancárias e outros passivos
            let dividaBancaria = 0;
            let outrosPassivos = 0;
            
            // Percorrer todas as dívidas - mesma lógica da tabela de projeções
            debtData.dividas.forEach(d => {
              const valor = d.valores_por_ano[ano] || 0;
              
              // Se a categoria é BANCOS, é dívida bancária
              if (d.categoria === "BANCOS") {
                dividaBancaria = valor;
              } else {
                // TUDO que não é BANCOS é considerado outros passivos
                outrosPassivos += valor;
              }
            });
            
            const dividaTotal = debtData.indicadores.endividamento_total[ano] || 0;
            const dividaLiquida = debtData.indicadores.divida_liquida[ano] || 0;
            
            // Converter ano de formato safra (2023/24) para ano simples (2024)
            // A safra 2023/24 representa o ano 2024, 2024/25 representa 2025, etc.
            let displayYear = ano;
            if (ano.includes('/')) {
              const [anoInicio, anoFim] = ano.split('/');
              // Usar o ano fim da safra como referência
              displayYear = '20' + anoFim; // Assumindo que anoFim é 24, 25, 26, etc.
              
              // Se anoFim tem 4 dígitos, usar direto
              if (anoFim.length === 4) {
                displayYear = anoFim;
              }
            }
            
            return {
              ano: displayYear,
              dividaTotal: dividaTotal / 1000000, // Converter para milhões
              dividaLiquida: dividaLiquida / 1000000,
              bancos: dividaBancaria / 1000000,
              outros: outrosPassivos / 1000000,
            };
          });
          
          // Filtrar anos de 2024 (safra 2023/24) a 2030 (safra 2029/30)
          const filteredData = chartData.filter(item => {
            const year = parseInt(item.ano);
            return year >= 2024 && year <= 2030;
          });
          
          setData(filteredData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de dívida:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organizationId, projectionId]);

  const chartConfig = {
    dividaTotal: {
      label: "Dívida Total",
      color: COLOR_VARIATIONS.dividaTotal,
    },
    dividaLiquida: {
      label: "Dívida Líquida",
      color: COLOR_VARIATIONS.dividaLiquida,
    },
    bancos: {
      label: "Bancos",
      color: COLOR_VARIATIONS.bancos,
    },
    outros: {
      label: "Outros",
      color: COLOR_VARIATIONS.outros,
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <TrendingDown className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Evolução do Endividamento</CardTitle>
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
              <TrendingDown className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Evolução do Endividamento</CardTitle>
              <CardDescription className="text-white/80">
                Nenhum dado disponível
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">
              Adicione dados de dívidas para visualizar o gráfico
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
              <TrendingDown className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-white">
                Evolução do Endividamento (R$ milhões)
              </CardTitle>
              <CardDescription className="text-white/80">
                Dívida total, líquida e composição por tipo (2024-2030)
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="w-full h-[400px] relative">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={data}
                margin={{ top: 20, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="ano"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  tickFormatter={(value) => value.toFixed(0)}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  width={50}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, name) => [
                    <span key="value" className="font-medium">
                      R$ {Number(value).toFixed(1)}M
                    </span>,
                    <span key="name">{chartConfig[name as keyof typeof chartConfig]?.label || name}</span>,
                  ]}
                  labelFormatter={(label) => `Ano: ${label}`}
                />
                <ChartLegend
                  content={
                    <ChartLegendMultirow 
                      itemsPerRow={4}
                      payload={[
                        { value: chartConfig.dividaTotal.label, color: chartConfig.dividaTotal.color, type: 'rect' },
                        { value: chartConfig.dividaLiquida.label, color: chartConfig.dividaLiquida.color, type: 'rect' },
                        { value: chartConfig.bancos.label, color: chartConfig.bancos.color, type: 'line' },
                        { value: chartConfig.outros.label, color: chartConfig.outros.color, type: 'line' },
                      ]}
                    />
                  }
                />
                
                {/* Barras */}
                <Bar
                  dataKey="dividaTotal"
                  fill={chartConfig.dividaTotal.color}
                  name={chartConfig.dividaTotal.label}
                  barSize={40}
                  label={{
                    position: "top",
                    className: "fill-foreground",
                    fontSize: 11,
                    fontWeight: "bold",
                    formatter: (value: number) => value ? value.toFixed(1) : ""
                  }}
                />
                <Bar
                  dataKey="dividaLiquida"
                  fill={chartConfig.dividaLiquida.color}
                  name={chartConfig.dividaLiquida.label}
                  barSize={40}
                  label={{
                    position: "top",
                    className: "fill-foreground",
                    fontSize: 11,
                    fontWeight: "bold",
                    formatter: (value: number) => value ? value.toFixed(1) : ""
                  }}
                />
                
                {/* Linhas */}
                <Line
                  type="monotone"
                  dataKey="bancos"
                  stroke={chartConfig.bancos.color}
                  strokeWidth={2}
                  dot={{ fill: chartConfig.bancos.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name={chartConfig.bancos.label}
                  connectNulls={false}
                  label={(props: any) => {
                    const { x, y, value } = props;
                    if (!value) return <g />;
                    
                    return (
                      <g>
                        <rect
                          x={x - 15}
                          y={y - 20}
                          width={30}
                          height={16}
                          rx={2}
                          fill={chartConfig.bancos.color}
                          fillOpacity={0.9}
                        />
                        <text
                          x={x}
                          y={y - 8}
                          fill="white"
                          fontSize={11}
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {value.toFixed(1)}
                        </text>
                      </g>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="outros"
                  stroke={chartConfig.outros.color}
                  strokeWidth={2}
                  dot={{ fill: chartConfig.outros.color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name={chartConfig.outros.label}
                  connectNulls={false}
                  label={(props: any) => {
                    const { x, y, value } = props;
                    if (!value) return <g />;
                    
                    return (
                      <g>
                        <rect
                          x={x - 15}
                          y={y + 8}
                          width={30}
                          height={16}
                          rx={2}
                          fill={chartConfig.outros.color}
                          fillOpacity={0.9}
                        />
                        <text
                          x={x}
                          y={y + 20}
                          fill="white"
                          fontSize={11}
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {value.toFixed(1)}
                        </text>
                      </g>
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}