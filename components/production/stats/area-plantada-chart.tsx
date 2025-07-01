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

// Função helper para ajustar brilho das cores
function adjustColorBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
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
  const { colors } = useChartColors();

  // Process chart configuration based on data and colors
  useEffect(() => {
    const config: ChartConfig = {};
    
    // Usar cores do contexto
    const colorArray = Object.values(colors);
    const variacoesCores = [
      ...colorArray,
      // Adicionar variações das cores do contexto
      ...colorArray.map(c => adjustColorBrightness(c, 0.2)),
      ...colorArray.map(c => adjustColorBrightness(c, -0.2)),
      ...colorArray.map(c => adjustColorBrightness(c, 0.4)),
      ...colorArray.map(c => adjustColorBrightness(c, -0.4)),
    ];

    // Extrair todas as culturas únicas dos dados
    const culturasUnicas = new Set<string>();
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== "safra" && key !== "total") {
          culturasUnicas.add(key);
        }
      });
    });

    // Configurar cada cultura
    let corIndex = 0;
    culturasUnicas.forEach((cultura) => {
      const chaveNormalizada = cultura.toUpperCase().replace(/\s+/g, "");
      const cor =
        initialData?.culturaColors?.[chaveNormalizada] ||
        variacoesCores[corIndex % variacoesCores.length];

      // Lista de palavras que devem ser capitalizadas individualmente
      const culturas = ["soja", "milho", "algodao", "arroz", "trigo", "feijao", "cafe", "sorgo", "girassol", "canola"];
      const tipos = ["sequeiro", "irrigado", "safrinha", "primeira", "segunda", "terceira"];
      const palavrasEspeciais = [...culturas, ...tipos];
      
      // 1. Primeiro, quebramos a string em CamelCase
      let label = cultura
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .trim();
      
      // 2. Identificar e capitalizar todas as palavras especiais
      palavrasEspeciais.forEach(palavra => {
        const regex = new RegExp(`\\b${palavra}\\b`, "gi");
        const palavraCapitalizada = palavra.charAt(0).toUpperCase() + palavra.slice(1);
        label = label.replace(regex, palavraCapitalizada);
      });
      
      // 3. Garantir que termos compostos sejam separados corretamente
      culturas.forEach(cultura => {
        const culturaCapitalizada = cultura.charAt(0).toUpperCase() + cultura.slice(1);
        
        tipos.forEach(tipo => {
          const tipoCapitalizado = tipo.charAt(0).toUpperCase() + tipo.slice(1);
          
          const padraoJunto = new RegExp(`\\b${culturaCapitalizada}${tipoCapitalizado}\\b`, "g");
          label = label.replace(padraoJunto, `${culturaCapitalizada} ${tipoCapitalizado}`);
          
          const padraoSafrinha = new RegExp(`\\b${culturaCapitalizada}Safrinha${tipoCapitalizado}\\b`, "g");
          label = label.replace(padraoSafrinha, `${culturaCapitalizada} Safrinha ${tipoCapitalizado}`);
        });
      });
      
      // 4. Garantir a primeira letra maiúscula para toda a string
      label = label.replace(/^./, (char) => char.toUpperCase());

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

  // Função para renderizar labels customizados
  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    
    if (!value || value < 100) return null;
    
    const formattedValue = value.toLocaleString('pt-BR');
    
    if (height < 30) {
      return null;
    }
    
    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill="white"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={10}
        fontWeight="600"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
      >
        {formattedValue}
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
            <div>
              <CardTitle className="text-white">
                Evolução da Área Plantada por Cultura{currentScenario && " - Projeção"}
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
        <div className="w-full h-[350px] sm:h-[400px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 30, right: 10, left: 0, bottom: 20 }}
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
                  tickFormatter={(value) =>
                    value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
                  }
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
                  content={<ChartLegendMultirow itemsPerRow={3} />}
                />
                {culturasKeys.map((cultura, index) => {
                  const cor = chartConfig[cultura]?.color;
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
                    </Bar>
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm px-6 pt-4">
        <div className="flex gap-2 font-medium leading-none">
          {Number(crescimentoTotal) >= 0 ? (
            <>
              Crescimento total de {crescimentoTotal}% em área plantada{" "}
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </>
          ) : (
            <>
              Redução total de {Math.abs(Number(crescimentoTotal))}% em área
              plantada{" "}
              <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
            </>
          )}
        </div>
        <div className="leading-none text-muted-foreground text-xs">
          {currentScenario 
            ? `Projeção baseada no cenário "${currentScenario.scenarioName}" - Safras ${data[0]?.safra} a ${data[data.length - 1]?.safra}`
            : `Mostrando evolução da área plantada por cultura entre ${data[0]?.safra} e ${data[data.length - 1]?.safra}`}
        </div>
      </CardFooter>
    </Card>
  );
}