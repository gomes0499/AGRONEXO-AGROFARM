"use client";

import { TrendingUp, BarChart3 } from "lucide-react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
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
import type { ProductivityData } from "@/lib/actions/production-chart-actions";
import type { ProdutividadeChartData } from "@/lib/actions/produtividade-chart-actions";
import { getProdutividadeChartData } from "@/lib/actions/produtividade-chart-actions";
import { useScenario } from "@/contexts/scenario-context-v2";
import { useProductionScenarioData } from "@/hooks/use-production-scenario-data";
import { useChartColors } from "@/contexts/chart-colors-context";

interface ProdutividadeChartClientProps {
  organizationId: string;
  propertyIds?: string[];
  cultureIds?: string[];
  projectionId?: string;
  initialData: ProdutividadeChartData;
}

export function ProdutividadeChartClient({
  organizationId,
  propertyIds,
  cultureIds,
  projectionId,
  initialData,
}: ProdutividadeChartClientProps) {
  const [data, setData] = useState<ProductivityData[]>(initialData?.chartData || []);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [isPending, startTransition] = useTransition();
  const { currentScenario, getProjectedValue } = useScenario();
  const { activeScenario, mappedData, hasActiveScenario } = useProductionScenarioData(organizationId);
  const { colors, organizationColors } = useChartColors();

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
        if (key !== "safra") {
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

      // Função para formatar o label - similar ao área plantada
      // Os dados podem vir como: "SOJA-1ªSAFRA", "MILHO-2ªSAFRA", etc.
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

  // Apply scenario adjustments when scenario changes
  useEffect(() => {
    let processedData = initialData?.chartData || [];
    
    // Primeiro, tentar usar o cenário de produtividade (novo sistema)
    if (hasActiveScenario && mappedData && Object.keys(mappedData).length > 0) {
      processedData = (initialData?.chartData || []).map((item) => {
        const safra = initialData?.safras?.find((s) => s.nome === item.safra);
        if (!safra) return item;
        
        const adjustedItem: ProductivityData = {
          safra: item.safra,
        };
        
        // Para cada cultura no item original
        Object.keys(item).forEach((key) => {
          if (key !== 'safra') {
            let projectedValue = item[key] as number;
            
            // Verificar se temos dados do cenário para esta cultura/sistema
            if (mappedData[key] && mappedData[key][safra.id]) {
              projectedValue = mappedData[key][safra.id].produtividade;
            }
            
            adjustedItem[key] = projectedValue;
          }
        });
        
        return adjustedItem;
      });
    }
    // Se não houver cenário de produtividade, usar o sistema antigo
    else if (currentScenario && currentScenario.cultureData) {
      processedData = (initialData?.chartData || []).map((item) => {
        // Encontrar a safra correspondente
        const safra = initialData?.safras?.find((s) => s.nome === item.safra);
        if (!safra || !currentScenario.cultureData[safra.id]) {
          return item; // Sem dados de cenário para esta safra
        }

        const adjustedItem: ProductivityData = {
          safra: item.safra,
        };

        // Para cada cultura no item original
        Object.keys(item).forEach((key) => {
          if (key !== 'safra') {
            // Tentar encontrar projeção para esta cultura
            let projectedProductivity = item[key] as number;
            
            // Buscar nos dados do cenário
            const safraProjections = currentScenario.cultureData[safra.id];
            if (safraProjections && safraProjections.length > 0) {
              // Tentar match exato primeiro
              for (const proj of safraProjections) {
                const cultureName = proj.culture_name || '';
                const systemName = proj.system_name || '';
                
                // Criar chave similar à usada no chart
                let projKey = cultureName;
                if (systemName && systemName !== 'SEQUEIRO') {
                  projKey = `${cultureName} ${systemName}`;
                }
                
                // Normalizar para comparação
                const normalizedProjKey = projKey
                  .toUpperCase()
                  .replace(/\s+/g, '')
                  .replace(/[ÃÁÀÂ]/g, 'A')
                  .replace(/[ÕÓÒÔ]/g, 'O')
                  .replace(/[ÇC]/g, 'C')
                  .replace(/[ÉÈÊ]/g, 'E')
                  .replace(/[ÍÌÎ]/g, 'I')
                  .replace(/[ÚÙÛ]/g, 'U');
                
                const normalizedKey = key.toUpperCase().replace(/\s+/g, '');
                
                if (normalizedProjKey === normalizedKey || projKey === key) {
                  projectedProductivity = proj.productivity;
                  break;
                }
              }
            }
            
            adjustedItem[key] = projectedProductivity;
          }
        });

        return adjustedItem;
      });
    }

    setData(processedData);
  }, [currentScenario, hasActiveScenario, mappedData, initialData?.chartData, initialData?.safras]);

  // Refresh data when filters change
  useEffect(() => {
    startTransition(async () => {
      try {
        const newData = await getProdutividadeChartData(
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

  // Calcular crescimento médio
  const calcularCrescimentoMedio = () => {
    if (data.length < 2) return "0.0";
    
    const culturasKeys = Object.keys(chartConfig);
    let crescimentoTotal = 0;
    let culturaComDados = 0;
    
    culturasKeys.forEach(cultura => {
      const primeiraSafra = data[0][cultura] as number;
      const ultimaSafra = data[data.length - 1][cultura] as number;
      
      if (primeiraSafra && ultimaSafra && primeiraSafra > 0) {
        const crescimento = ((ultimaSafra - primeiraSafra) / primeiraSafra) * 100;
        crescimentoTotal += crescimento;
        culturaComDados++;
      }
    });
    
    if (culturaComDados === 0) return "0.0";
    
    const crescimentoMedio = crescimentoTotal / culturaComDados;
    return crescimentoMedio.toFixed(1);
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Evolução da Produtividade por Cultura
                </CardTitle>
                <CardDescription className="text-white/80">
                  Nenhum dado de produtividade encontrado
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="w-full h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">
              Cadastre dados de produtividade para visualizar o gráfico
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const crescimentoMedio = calcularCrescimentoMedio();
  const culturasKeys = Object.keys(chartConfig);

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-white">
                Evolução da Produtividade por Cultura (sc/ha){(currentScenario || activeScenario) && " - Projeção"}
                {isPending && " (Atualizando...)"}
              </CardTitle>
              <CardDescription className="text-white/80">
                {activeScenario
                  ? `Cenário de Produtividade: ${activeScenario.nome}`
                  : currentScenario 
                  ? `Cenário: ${currentScenario.scenarioName} - Produtividade projetada por cultura`
                  : `Produtividade média por cultura (${data[0]?.safra} - ${data[data.length - 1]?.safra})`}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="w-full h-[350px] sm:h-[400px] relative">
          {/* Indicadores R/P com linhas no topo */}
          <div className="absolute top-2 left-0 right-0 h-8 pointer-events-none z-20" style={{ marginLeft: "50px", marginRight: "10px" }}>
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
              <LineChart
                data={data}
                margin={{ top: 45, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="safra"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  fontSize={12}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  tickFormatter={(value) =>
                    `${Number(value).toLocaleString()}`
                  }
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  width={50}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value, name) => {
                    const formattedValue = typeof value === 'number' ? Number(value).toLocaleString() : '0';
                    const nameStr = typeof name === 'string' ? name : String(name);
                    return [
                      <span key="value" className="font-medium">{formattedValue} sc/ha</span>,
                      <span key="name">{chartConfig[nameStr]?.label || nameStr}</span>,
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
                    <Line
                      key={cultura}
                      type="monotone"
                      dataKey={cultura}
                      stroke={cor}
                      strokeWidth={2}
                      dot={{ fill: cor, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                      name={String(chartConfig[cultura]?.label || cultura)}
                      connectNulls={false}
                      label={{
                        position: "top",
                        className: "fill-foreground",
                        fontSize: 12,
                        fontWeight: "bold",
                        offset: 8,
                        formatter: (value: number) => value ? Math.round(value).toString() : ""
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}