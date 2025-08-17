"use client";

import { useEffect, useState } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  LabelList,
  Rectangle,
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
} from "@/components/ui/chart";
import { TrendingUp, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useChartColors } from "@/contexts/chart-colors-context";

interface BankDebtWaterfallChartProps {
  organizationId: string;
  projectionId?: string;
}

export function BankDebtWaterfallChart({ organizationId, projectionId }: BankDebtWaterfallChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalGeral, setTotalGeral] = useState(0);
  const [totalCusteio, setTotalCusteio] = useState(0);
  const [totalInvestimento, setTotalInvestimento] = useState(0);
  const [cambio, setCambio] = useState(5.70);
  const { colors } = useChartColors();

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient();
        
        // Buscar todas as dívidas bancárias e safras
        const [{ data: dividas }, { data: safras }] = await Promise.all([
          supabase
            .from('dividas_bancarias')
            .select('*')
            .eq('organizacao_id', organizationId)
            .eq('tipo', 'BANCO'),
          supabase
            .from('safras')
            .select('*')
            .eq('organizacao_id', organizationId)
            .order('ano_inicio')
        ]);

        if (dividas && safras) {
          // Criar mapa de safra_id para safra
          const safraById = new Map(safras.map(s => [s.id, s]));
          
          // Processar dívidas por safra - somar valores de pagamento por safra
          const safraMap = new Map<string, { valor: number; ano_fim: number }>();
          let totalCusteioCalc = 0;
          let totalInvestimentoCalc = 0;
          
          dividas.forEach(divida => {
            const fluxo = divida.fluxo_pagamento_anual || {};
            
            // Para cada safra no fluxo de pagamento, somar o valor do pagamento
            Object.entries(fluxo).forEach(([safraId, valorPagamento]) => {
              const safra = safraById.get(safraId);
              
              if (safra && safra.ano_fim >= 2024 && safra.ano_fim <= 2032) {
                // Converter para reais se necessário
                const valor = parseFloat((valorPagamento as any).toString());
                const valorConvertido = divida.moeda === 'USD' 
                  ? (valor * cambio) / 1000000
                  : valor / 1000000;
                
                // Somar aos totais de custeio/investimento
                if (divida.modalidade === 'CUSTEIO') {
                  totalCusteioCalc += valorConvertido;
                } else if (divida.modalidade === 'INVESTIMENTOS') {
                  totalInvestimentoCalc += valorConvertido;
                }
                
                const current = safraMap.get(safra.nome);
                if (current) {
                  safraMap.set(safra.nome, {
                    valor: current.valor + valorConvertido,
                    ano_fim: safra.ano_fim
                  });
                } else {
                  safraMap.set(safra.nome, {
                    valor: valorConvertido,
                    ano_fim: safra.ano_fim
                  });
                }
              }
            });
          });
          
          setTotalCusteio(totalCusteioCalc);
          setTotalInvestimento(totalInvestimentoCalc);

          // Converter Map para array e processar
          const dataArray = Array.from(safraMap.entries()).map(([safra, data]) => ({
            safra,
            ano_fim: data.ano_fim,
            valor_milhoes: data.valor
          }));

          processWaterfallData(dataArray);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de dívida bancária:', error);
      } finally {
        setLoading(false);
      }
    };

    const processWaterfallData = (rawData: any[]) => {
      // Ordenar por ano
      const sortedData = rawData.sort((a, b) => a.ano_fim - b.ano_fim);
      
      const waterfallData: any[] = [];
      let accumulated = 0;
      
      sortedData.forEach((item, index) => {
        const valor = parseFloat(item.valor_milhoes) || 0;
        const previousAccumulated = accumulated;
        accumulated += valor;
        
        waterfallData.push({
          ano: item.ano_fim.toString(),
          safra: item.safra,
          valor: valor,
          valorReal: valor,
          change: valor,
          accumulated: accumulated,
          start: previousAccumulated, // Para waterfall
          end: accumulated, // Para waterfall
          type: 'regular',
          displayValue: valor.toFixed(1),
          color: colors.color1
        });
      });
      
      // Adicionar total geral com valor acumulado
      if (waterfallData.length > 0) {
        waterfallData.push({
          ano: 'TOTAL GERAL',
          safra: '',
          valor: accumulated,
          valorReal: accumulated,
          change: 0,
          accumulated: accumulated,
          start: 0,
          end: accumulated,
          type: 'total-geral',
          displayValue: accumulated.toFixed(1),
          color: colors.color1
        });
        
        setTotalGeral(accumulated);
      }
      
      setData(waterfallData);
    };

    loadData();
  }, [organizationId, projectionId]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Passivos Bancários - Prazo</CardTitle>
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
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Passivos Bancários - Prazo</CardTitle>
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

  const chartConfig = {
    valor: {
      label: "Valor",
      color: "#2563eb",
    },
  };

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-white">
                Dívida Bancária (Milhões)
              </CardTitle>
              <CardDescription className="text-white/80">
                Evolução dos passivos bancários por período
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
                margin={{ top: 40, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="ano"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
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
                    <span key="name">Dívida Bancária</span>,
                  ]}
                  labelFormatter={(label) => `Ano: ${label}`}
                />
                
                {/* Barras invisíveis para criar o efeito de base */}
                <Bar 
                  dataKey="start" 
                  stackId="waterfall"
                  fill="transparent"
                  barSize={60}
                />
                
                {/* Barras visíveis para os valores */}
                <Bar 
                  dataKey="valor" 
                  stackId="waterfall"
                  barSize={60}
                  shape={(props: any) => {
                    const { fill, x, y, width, height, payload } = props;
                    const isTotal = payload.type === 'total-geral';
                    
                    // Para o total, desenhar uma barra completa
                    if (isTotal) {
                      return (
                        <Rectangle
                          {...props}
                          y={y}
                          height={height}
                          fill={payload.color}
                        />
                      );
                    }
                    
                    // Para valores regulares, desenhar barra flutuante
                    return (
                      <g>
                        <Rectangle
                          {...props}
                          fill={payload.color}
                        />
                        {/* Linha conectora para o próximo valor */}
                        {payload.type !== 'total-geral' && (
                          <line
                            x1={x + width}
                            y1={y}
                            x2={x + width + 20}
                            y2={y}
                            stroke="#999"
                            strokeWidth={1}
                            strokeDasharray="2 2"
                          />
                        )}
                      </g>
                    );
                  }}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList
                    position="top"
                    content={(props: any) => {
                      const { x, y, width, value, index } = props;
                      const entry = data[index];
                      if (!entry) return null;
                      
                      return (
                        <text
                          x={x + width / 2}
                          y={y - 10}
                          className="fill-foreground"
                          fontSize={12}
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {entry.displayValue}
                        </text>
                      );
                    }}
                  />
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
        
        {/* Câmbio */}
        <div className="mt-4 flex justify-end">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded border dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-300 text-xs">Câmbio</span>
            <span className="font-bold text-sm dark:text-gray-100">: {cambio.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}