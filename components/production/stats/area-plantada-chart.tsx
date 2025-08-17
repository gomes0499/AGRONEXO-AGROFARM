"use client";

import { TrendingUp, Leaf } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
  ReferenceLine,
  Cell,
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
import { useChartColors } from "@/contexts/chart-colors-context";
import type { AreaPlantadaChartData } from "@/lib/actions/area-plantada-chart-actions";
import { getAreaPlantadaChartData } from "@/lib/actions/area-plantada-chart-actions";
import { useScenario } from "@/contexts/scenario-context-v2";
import type { CultureAreaData } from "@/lib/actions/production-chart-actions";

interface AreaPlantadaChartRefactoredProps {
  organizationId: string;
  propertyIds?: string[];
  cultureIds?: string[];
  projectionId?: string;
  initialData: AreaPlantadaChartData;
}

export function AreaPlantadaChartClient({
  organizationId,
  propertyIds,
  cultureIds,
  projectionId,
  initialData,
}: AreaPlantadaChartRefactoredProps) {
  const [data, setData] = useState<CultureAreaData[]>(initialData?.chartData || []);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [isPending, startTransition] = useTransition();
  const { currentScenario, getProjectedValue } = useScenario();
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
    
    // Extrair todas as culturas únicas dos dados
    const culturasUnicas = new Set<string>();
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== "safra" && key !== "total") {
          culturasUnicas.add(key);
        }
      });
    });

    // Configurar cada cultura com cores da paleta
    let corIndex = 0;
    culturasUnicas.forEach((cultura) => {
      const chaveNormalizada = cultura.toUpperCase().replace(/\s+/g, "");
      const cor = COLOR_VARIATIONS[corIndex % COLOR_VARIATIONS.length];

      // Função para formatar o label
      // Os dados agora vêm como: "SOJA-1ªSAFRA", "MILHO-2ªSAFRA", etc.
      let label = cultura;
      
      // Primeiro, vamos decodificar a chave normalizada
      // A chave vem toda em maiúscula e sem espaços
      // Exemplos: "SOJA-1ªSAFRA", "MILHO-2ªSAFRA", "FEIJAO-1ªSAFRA"
      
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
        else cultureName = culturaPart; // Usar como está se não reconhecer
        
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
        // Mapear nome da cultura
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
        else label = cultura; // Usar como está se não reconhecer
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
    if (currentScenario && currentScenario.cultureData) {
      const processedData = (initialData?.chartData || []).map((item) => {
        // Encontrar a safra correspondente
        const safra = initialData?.safras?.find((s) => s.nome === item.safra);
        if (!safra || !currentScenario.cultureData[safra.id]) {
          return item; // Sem dados de cenário para esta safra
        }

        const adjustedItem: CultureAreaData = {
          safra: item.safra,
          total: 0,
        };

        // Para cada cultura no item original
        Object.keys(item).forEach((key) => {
          if (key !== 'safra' && key !== 'total') {
            // Tentar encontrar projeção para esta cultura
            let projectedArea = item[key] as number;
            
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
                  projectedArea = proj.area_hectares;
                  break;
                }
              }
            }
            
            adjustedItem[key] = projectedArea;
            adjustedItem.total += projectedArea;
          }
        });

        return adjustedItem;
      });

      setData(processedData);
    } else {
      setData(initialData?.chartData || []);
    }
  }, [currentScenario, initialData?.chartData, initialData?.safras]);

  // Refresh data when filters change
  useEffect(() => {
    startTransition(async () => {
      try {
        const newData = await getAreaPlantadaChartData(
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

  // Calcular crescimento total
  const calcularCrescimento = () => {
    if (data.length < 2) return "0.0";

    const primeiroAno = data[0];
    const ultimoAno = data[data.length - 1];

    if (primeiroAno.total === 0) return "0.0";

    const crescimento =
      ((ultimoAno.total - primeiroAno.total) / primeiroAno.total) * 100;
    return crescimento.toFixed(1);
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Evolução da Área Plantada por Cultura
                </CardTitle>
                <CardDescription className="text-white/80">
                  Nenhum dado de área plantada encontrado
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="w-full h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">
              Cadastre áreas de plantio para visualizar o gráfico
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const crescimentoTotal = calcularCrescimento();
  const culturasKeys = Object.keys(chartConfig);
  
  // Encontrar o índice onde deve aparecer a linha divisória
  const dividerIndex = data.findIndex(item => item.safra === "2025/26");

  // Função para renderizar labels customizados com porcentagem
  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value, payload } = props;
    
    if (!value || value < 50) return null;
    
    // Calcular porcentagem do total
    const total = payload?.total || 0;
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    
    // Mostrar porcentagem mesmo em segmentos pequenos (mínimo 1%)
    if (height < 15 || percentage < 1) {
      return null;
    }
    
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={percentage < 5 ? 10 : 12}
        fontWeight="600"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
      >
        {percentage}%
      </text>
    );
  };
  
  // Função para renderizar o valor total acima de cada barra
  const renderTotalLabel = (props: any) => {
    const { x, y, width, index } = props;
    
    if (index === undefined || !data[index]) return null;
    
    const total = data[index].total || 0;
    const formattedTotal = (total / 1000).toFixed(3).replace('.', ',');
    
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
  };

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <Leaf className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-white">
                Evolução da Área Plantada por Cultura (mil hectares){currentScenario && " - Projeção"}
                {isPending && " (Atualizando...)"}
              </CardTitle>
              <CardDescription className="text-white/80">
                {currentScenario 
                  ? `Cenário: ${currentScenario.scenarioName} - Área projetada por cultura`
                  : `Área plantada por cultura em hectares (${data[0]?.safra} - ${data[data.length - 1]?.safra})`}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="w-full h-[350px] sm:h-[400px] relative overflow-hidden">
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
          
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 45, right: 10, left: 0, bottom: 20 }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="0"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="red" />
                  </marker>
                </defs>
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
                  tickFormatter={(value) => (value / 1000).toFixed(0)}
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
                      <span key="value" className="font-medium">{Number(value).toLocaleString()} ha <span className="text-muted-foreground">({percentage}%)</span></span>,
                      <span key="name">{chartConfig[name as string]?.label || name}</span>,
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
                {culturasKeys.map((cultura, index) => {
                  const cor = chartConfig[cultura]?.color;
                  const isLastBar = index === culturasKeys.length - 1;
                  return (
                    <Bar
                      key={cultura}
                      dataKey={cultura}
                      stackId="area"
                      fill={cor}
                      name={String(chartConfig[cultura]?.label || cultura)}
                    >
                      <LabelList 
                        dataKey={cultura}
                        position="center"
                        content={renderCustomLabel}
                      />
                      {/* Renderizar o total apenas na última barra (topo do stack) */}
                      {isLastBar && (
                        <LabelList
                          dataKey="total"
                          position="top"
                          content={renderTotalLabel}
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