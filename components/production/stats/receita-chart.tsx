"use client";

import { TrendingUp, DollarSign } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
  ReferenceLine,
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
import { ChartLegendMultirow } from "@/components/ui/chart-legend-multirow";
import { useState, useTransition, useEffect } from "react";
import type { RevenueData } from "@/lib/actions/production-chart-actions";
import type { ReceitaChartData } from "@/lib/actions/receita-chart-actions";
import { getReceitaChartData } from "@/lib/actions/receita-chart-actions";
import { useChartColors } from "@/contexts/chart-colors-context";
import { useScenario } from "@/contexts/scenario-context-v2";

interface ReceitaChartClientProps {
  organizationId: string;
  propertyIds?: string[];
  cultureIds?: string[];
  projectionId?: string;
  initialData: ReceitaChartData;
}

// Formatar valor monetário
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: value >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: 0,
  }).format(value);
};

export function ReceitaChartClient({
  organizationId,
  propertyIds,
  cultureIds,
  projectionId,
  initialData,
}: ReceitaChartClientProps) {
  const [data, setData] = useState<RevenueData[]>(initialData?.chartData || []);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [isPending, startTransition] = useTransition();
  const { colors, organizationColors } = useChartColors();
  const { currentScenario, getProjectedValue } = useScenario();

  // Criar paleta de cores baseada nas cores da organização ou padrão
  const COLOR_VARIATIONS = [
    colors.color1,  // Primary
    colors.color2,  // Secondary
    colors.color3,  // Tertiary
    colors.color4,  // Quaternary
    colors.color5,  // Quinary
    colors.color6,  // Senary
    organizationColors?.septenary || '#6B5FD5',
    organizationColors?.octonary || '#A191FD',
    organizationColors?.nonary || '#D7C3FF',
    organizationColors?.denary || '#F2DCFF',
  ];

  // Process chart configuration based on data and colors
  useEffect(() => {
    const config: ChartConfig = {};
    
    // Usar paleta de cores fixa baseada em #17134F

    // Extrair todas as culturas únicas dos dados
    const culturasUnicas = new Set<string>();
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== "safra" && key !== "total") {
          culturasUnicas.add(key);
        }
      });
    });

    // Configurar cada cultura com ordem consistente
    let corIndex = 0;
    
    // Ordenar culturas para garantir consistência de cores
    const culturasOrdenadas = Array.from(culturasUnicas).sort((a, b) => {
      // Extrair nome da cultura e ciclo
      const getCultureAndCycle = (str: string) => {
        if (str.includes('-')) {
          const parts = str.split('-');
          return { culture: parts[0], cycle: parts[1] || '' };
        }
        return { culture: str, cycle: '' };
      };
      
      const aInfo = getCultureAndCycle(a);
      const bInfo = getCultureAndCycle(b);
      
      // Primeiro ordenar por cultura
      const cultureCompare = aInfo.culture.localeCompare(bInfo.culture);
      if (cultureCompare !== 0) return cultureCompare;
      
      // Depois por ciclo (1ª Safra antes de 2ª Safra)
      return aInfo.cycle.localeCompare(bInfo.cycle);
    });
    
    culturasOrdenadas.forEach((cultura) => {
      const chaveNormalizada = cultura.toUpperCase().replace(/\s+/g, "");
      const cor = COLOR_VARIATIONS[corIndex % COLOR_VARIATIONS.length];

      // Função para formatar o label - similar aos outros gráficos
      let label = cultura;
      
      // Se tem hífen, provavelmente tem ciclo
      if (cultura.includes('-')) {
        const parts = cultura.split('-');
        const culturaPart = parts[0];
        const cicloPart = parts[1] || '';
        
        // Mapear nome da cultura
        let cultureName = '';
        if (culturaPart.includes('SOJA')) cultureName = 'Soja';
        else if (culturaPart.includes('MILHO')) cultureName = 'Milho';
        else if (culturaPart.includes('FEIJAO')) cultureName = 'Feijão';
        else if (culturaPart.includes('SORGO')) cultureName = 'Sorgo';
        else if (culturaPart.includes('ALGODAO')) cultureName = 'Algodão';
        else if (culturaPart.includes('ARROZ')) cultureName = 'Arroz';
        else if (culturaPart.includes('TRIGO')) cultureName = 'Trigo';
        else if (culturaPart.includes('CENTEIO')) cultureName = 'Centeio';
        else if (culturaPart.includes('AVEIA')) cultureName = 'Aveia';
        else if (culturaPart.includes('CEVADA')) cultureName = 'Cevada';
        else cultureName = culturaPart;
        
        // Mapear ciclo
        let cycle = '';
        if (cicloPart.includes('1') || cicloPart.includes('PRIMEIRA')) {
          cycle = '1ª Safra';
        } else if (cicloPart.includes('2') || cicloPart.includes('SEGUNDA') || cicloPart.includes('SAFRINHA')) {
          cycle = '2ª Safra';
        }
        
        // Montar label final
        if (cycle) {
          label = `${cultureName} - ${cycle}`;
        } else {
          label = cultureName;
        }
      } else {
        // Sem hífen, só tem o nome da cultura
        if (cultura.includes('SOJA')) label = 'Soja';
        else if (cultura.includes('MILHO')) label = 'Milho';
        else if (cultura.includes('FEIJAO')) label = 'Feijão';
        else if (cultura.includes('SORGO')) label = 'Sorgo';
        else if (cultura.includes('ALGODAO')) label = 'Algodão';
        else if (cultura.includes('ARROZ')) label = 'Arroz';
        else if (cultura.includes('TRIGO')) label = 'Trigo';
        else if (cultura.includes('CENTEIO')) label = 'Centeio';
        else if (cultura.includes('AVEIA')) label = 'Aveia';
        else if (cultura.includes('CEVADA')) label = 'Cevada';
        else label = cultura;
      }

      config[cultura] = {
        label: label,
        color: cor,
      };

      corIndex++;
    });

    setChartConfig(config);
  }, [data, colors, initialData?.culturaColors]);

  // Apply scenario adjustments to data
  useEffect(() => {
    let processedData = initialData?.chartData || [];
    
    if (currentScenario && currentScenario.cultureData && initialData?.safras) {
      processedData = processedData.map((item) => {
        const safra = initialData.safras.find(s => s.nome === item.safra);
        if (!safra) return item;
        
        let adjustedItem = { ...item };
        
        // Get culture data for this harvest
        const harvestCultureData = currentScenario.cultureData[safra.id] || [];
        
        // For each culture in the item, apply scenario adjustments
        Object.keys(item).forEach((key) => {
          if (key !== "safra" && key !== "total" && typeof item[key] === "number") {
            // Try to find matching scenario data for this culture
            const scenarioData = harvestCultureData.find((cd: any) => 
              cd.culture_name?.toLowerCase().includes(key.toLowerCase()) ||
              key.toLowerCase().includes(cd.culture_name?.toLowerCase() || '')
            );
            
            if (scenarioData) {
              // Calculate projected value based on scenario changes
              const originalValue = item[key] as number;
              
              // Apply price changes if available
              if (scenarioData.price_per_unit && scenarioData.price_per_unit > 0) {
                const priceMultiplier = getProjectedValue(
                  safra.id, 
                  scenarioData.culture_id, 
                  scenarioData.system_id, 
                  'price_per_unit', 
                  1
                );
                adjustedItem[key] = originalValue * priceMultiplier;
              }
              
              // Apply area and productivity changes
              const areaMultiplier = getProjectedValue(
                safra.id, 
                scenarioData.culture_id, 
                scenarioData.system_id, 
                'area_hectares', 
                1
              );
              
              const productivityMultiplier = getProjectedValue(
                safra.id, 
                scenarioData.culture_id, 
                scenarioData.system_id, 
                'productivity', 
                1
              );
              
              adjustedItem[key] = (adjustedItem[key] as number) * areaMultiplier * productivityMultiplier;
            }
          }
        });
        
        // Recalculate total
        adjustedItem.total = Object.keys(adjustedItem).reduce((sum, key) => {
          if (key !== "safra" && key !== "total" && typeof adjustedItem[key] === "number") {
            return sum + (adjustedItem[key] as number);
          }
          return sum;
        }, 0);
        
        return adjustedItem;
      });
    }
    
    setData(processedData);
  }, [currentScenario, initialData?.chartData, initialData?.safras, getProjectedValue]);

  // Refresh data when filters change
  useEffect(() => {
    startTransition(async () => {
      try {
        const newData = await getReceitaChartData(
          organizationId,
          propertyIds,
          cultureIds,
          projectionId
        );
        setData(newData.chartData);
      } catch (error) {
        console.error("Erro ao atualizar dados do gráfico:", error);
      }
    });
  }, [organizationId, propertyIds, cultureIds, projectionId]);

  // Calcular médias por período
  const calcularMediasPeriodo = () => {
    if (data.length === 0) return {
      receitaRealizada: "R$ 0",
      receitaProjetada: "R$ 0",
      crescimentoMedio: "0.0"
    };

    // Separar dados por período baseado no ano da safra
    const dadosRealizados = data.filter(item => {
      const ano = parseInt(item.safra.split('/')[0]); // Pegar primeiro ano da safra
      return ano >= 2021 && ano <= 2024;
    });

    const dadosProjetados = data.filter(item => {
      const ano = parseInt(item.safra.split('/')[0]); // Pegar primeiro ano da safra
      return ano >= 2025 && ano <= 2030;
    });

    // Calcular média do período realizado (2021-2024)
    let receitaRealizada = "R$ 0";
    if (dadosRealizados.length > 0) {
      const somaRealizada = dadosRealizados.reduce((acc, item) => acc + item.total, 0);
      const mediaRealizada = somaRealizada / dadosRealizados.length;
      receitaRealizada = formatCurrency(mediaRealizada);
    }

    // Calcular média do período projetado (2025-2030)
    let receitaProjetada = "R$ 0";
    if (dadosProjetados.length > 0) {
      const somaProjetada = dadosProjetados.reduce((acc, item) => acc + item.total, 0);
      const mediaProjetada = somaProjetada / dadosProjetados.length;
      receitaProjetada = formatCurrency(mediaProjetada);
    }

    // Calcular crescimento médio total
    let crescimentoMedio = "0.0";
    if (data.length >= 2) {
      const primeiroAno = data[0];
      const ultimoAno = data[data.length - 1];
      if (primeiroAno.total > 0) {
        const crescimento = ((ultimoAno.total - primeiroAno.total) / primeiroAno.total) * 100;
        crescimentoMedio = crescimento.toFixed(1);
      }
    }

    return {
      receitaRealizada,
      receitaProjetada,
      crescimentoMedio
    };
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Evolução da Receita Projetada por Cultura
                </CardTitle>
                <CardDescription className="text-white/80">
                  Nenhum dado de receita encontrado
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="w-full h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">
              Cadastre dados de produção e preços para visualizar o gráfico
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mediasPeriodo = calcularMediasPeriodo();
  const culturasKeys = Object.keys(chartConfig);

  // Função para renderizar labels customizados com percentual
  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value, payload } = props;
    
    // Não mostrar se não há valor
    if (!value || value < 100000) return null; // Não mostrar valores menores que 100k
    
    // Calcular percentual do total
    const total = payload?.total || 0;
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    
    // Só mostrar se o segmento tiver altura suficiente
    if (height < 20 || parseFloat(percentage) < 2) {
      return null; // Não mostrar em segmentos muito pequenos para evitar sobreposição
    }
    
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight="600"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
      >
        {percentage}%
      </text>
    );
  };

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-white">
                {projectionId ? "Projeção de Receita por Cultura (R$ milhões)" : "Evolução da Receita por Cultura (R$ milhões)"}
                {isPending && " (Atualizando...)"}
              </CardTitle>
              <CardDescription className="text-white/80">
                {projectionId 
                  ? `Receita projetada por cultura em reais (${data[0]?.safra} - ${data[data.length - 1]?.safra})`
                  : `Receita por cultura em reais (${data[0]?.safra} - ${data[data.length - 1]?.safra})`
                }
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="w-full h-[350px] sm:h-[400px] relative">
          {/* Indicadores R/P com linhas no topo */}
          <div className="absolute top-2 left-0 right-0 h-8 pointer-events-none z-20" style={{ marginLeft: "40px", marginRight: "10px" }}>
            <div className="relative w-full h-full">
              {/* Encontrar o ponto de divisão entre R e P */}
              {(() => {
                const projectedIndex = data.findIndex(item => parseInt(item.safra.split('/')[0]) >= 2025);
                const realizedWidth = projectedIndex === -1 ? 100 : (projectedIndex / data.length) * 100;
                const projectedWidth = projectedIndex === -1 ? 0 : ((data.length - projectedIndex) / data.length) * 100;
                
                return (
                  <>
                    {/* Linha e label para Realizado */}
                    {realizedWidth > 0 && (
                      <div 
                        className="absolute top-4 h-[2px] bg-gray-600"
                        style={{ 
                          left: '0%',
                          width: `${realizedWidth - 2}%`
                        }}
                      >
                        <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-600">
                          Realizado
                        </span>
                      </div>
                    )}
                    
                    {/* Linha e label para Projetado */}
                    {projectedWidth > 0 && (
                      <div 
                        className="absolute top-4 h-[2px] bg-red-500"
                        style={{ 
                          right: '0%',
                          width: `${projectedWidth - 2}%`
                        }}
                      >
                        <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-500">
                          Projetado
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
          
          <ChartContainer config={chartConfig} className="w-full h-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 45, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="safra"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  tickFormatter={(value) => (value/1000000).toFixed(0)}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  width={40}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, name, payload) => {
                    const total = payload?.payload?.total || 0;
                    const percentage = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : "0.0";
                    return [
                      <span key="value" className="font-medium">{formatCurrency(Number(value))} <span className="text-muted-foreground">({percentage}%)</span></span>,
                      <span key="label">{chartConfig[name as string]?.label || name}</span>,
                    ];
                  }}
                  labelFormatter={(label) => `Safra: ${label}`}
                />
                <ChartLegend
                  content={
                    <ChartLegendMultirow 
                      itemsPerRow={3}
                      payload={culturasKeys.map(key => ({
                        value: chartConfig[key]?.label || key,
                        color: chartConfig[key]?.color || '#17134F',
                        type: 'rect'
                      }))}
                    />
                  }
                />
                {culturasKeys.map((cultura) => {
                  const cor = chartConfig[cultura]?.color;
                  return (
                    <Bar
                      key={cultura}
                      dataKey={cultura}
                      stackId="receita"
                      fill={cor}
                      name={String(chartConfig[cultura]?.label || cultura)}
                    >
                      <LabelList 
                        dataKey={cultura}
                        position="center"
                        content={renderCustomLabel}
                      />
                      {/* Renderizar o total apenas na última barra (topo do stack) */}
                      {culturasKeys.indexOf(cultura) === culturasKeys.length - 1 && (
                        <LabelList
                          dataKey="total"
                          position="top"
                          content={(props: any) => {
                            const { x, y, width, index } = props;
                            if (index === undefined || !data[index]) return null;
                            const total = data[index].total || 0;
                            const formattedTotal = (total / 1000000).toFixed(1);
                            return (
                              <text
                                x={x + width / 2}
                                y={y - 5}
                                className="fill-foreground"
                                textAnchor="middle"
                                dominantBaseline="bottom"
                                fontSize={12}
                                fontWeight="700"
                              >
                                {formattedTotal}
                              </text>
                            );
                          }}
                        />
                      )}
                    </Bar>
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}