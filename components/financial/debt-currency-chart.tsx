"use client";

import { useEffect, useState, useMemo } from "react";
import { PieChart, Pie, Cell, Label } from "recharts";
import { DollarSign } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { createClient } from "@/lib/supabase/client";

interface DebtCurrencyChartProps {
  organizationId: string;
  projectionId?: string;
}

interface ChartData {
  name: string;
  value: number;
  fill: string;
}

export function DebtCurrencyChart({ organizationId, projectionId }: DebtCurrencyChartProps) {
  const [currencyData, setCurrencyData] = useState<ChartData[]>([]);
  const [totalDebt, setTotalDebt] = useState(0);
  const [loading, setLoading] = useState(true);
  const cambio = 5.70;

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
          // Agrupar por moeda
          let totalBRL = 0;
          let totalUSD = 0;
          
          
          dividas.forEach(divida => {
            const fluxo = divida.fluxo_pagamento_anual || {};
            
            // Somar todos os valores do fluxo
            let totalDivida = 0;
            Object.values(fluxo).forEach((valor: any) => {
              const valorNum = parseFloat(valor.toString());
              totalDivida += valorNum;
            });
            
            // Valor original da dívida (antes da conversão)
            const valorOriginal = totalDivida;
            
            // Converter para reais para comparação
            const valorEmReais = divida.moeda === 'USD' 
              ? totalDivida * cambio
              : totalDivida;
            
            // Agrupar por moeda
            if (divida.moeda === 'USD') {
              totalUSD += valorEmReais;
            } else {
              totalBRL += valorEmReais;
            }
            
          });
          
          // Calcular totais
          const totalMoeda = totalBRL + totalUSD;
          setTotalDebt(totalMoeda);
          
          // Formatar dados de moeda
          const moedaData: ChartData[] = [];
          if (totalBRL > 0) {
            moedaData.push({
              name: 'REAIS',
              value: totalBRL,
              fill: '#17134F'
            });
          }
          if (totalUSD > 0) {
            moedaData.push({
              name: 'DÓLAR',
              value: totalUSD,
              fill: '#8678E9'
            });
          }
          
          setCurrencyData(moedaData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados de moeda/tipo:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [organizationId, projectionId]);

  const chartConfig: ChartConfig = {
    value: { label: "Valor" },
    REAIS: { label: "Reais", color: "#17134F" },
    DOLAR: { label: "Dólar", color: "#8678E9" },
    CUSTEIO: { label: "Custeio", color: "#5046C1" },
    INVESTIMENTO: { label: "Investimento", color: "#BCAAFF" },
    "CUSTO MÉDIO": { label: "Custo Médio", color: "#17134F" },
  };

  const DonutChart = ({ data }: { data: ChartData[] }) => {
    const formattedValue = useMemo(() => {
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
    }, [data]);

    const unit = 'R$';

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
    <div className="flex flex-col items-center gap-4">
      {loading ? (
        <div className="flex items-center justify-center h-[140px] w-full">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="flex-shrink-0">
            <DonutChart data={currencyData} />
          </div>
          <div className="w-full space-y-2">
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Endividamento por Moeda</span>
            </div>
            <div className="px-4">
              {renderLegend(currencyData, totalDebt)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}