"use client";

import { TrendingUp, BarChart3 } from "lucide-react";
import {
  Line,
  LineChart,
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
        if (key !== "safra") {
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
            <div>
              <CardTitle className="text-white">
                Evolução da Produtividade por Cultura{(currentScenario || activeScenario) && " - Projeção"}
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
        <div className="w-full h-[350px] sm:h-[400px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
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
                <ChartLegend content={<ChartLegendMultirow itemsPerRow={3} />} />
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
                      label={{
                        position: "top",
                        fill: cor,
                        fontSize: 12,
                        offset: 10,
                        formatter: (value: number) => value ? value.toLocaleString() : ""
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm px-6 pt-4">
        <div className="flex gap-2 font-medium leading-none">
          {Number(crescimentoMedio) >= 0 ? (
            <>
              Crescimento médio de {crescimentoMedio}% na produtividade{" "}
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </>
          ) : (
            <>
              Redução média de {Math.abs(Number(crescimentoMedio))}% na produtividade{" "}
              <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
            </>
          )}
        </div>
        <div className="leading-none text-muted-foreground text-xs">
          {activeScenario
            ? `Projeção baseada no cenário de produtividade "${activeScenario.nome}" - Safras ${data[0]?.safra} a ${data[data.length - 1]?.safra}`
            : currentScenario 
            ? `Projeção baseada no cenário "${currentScenario.scenarioName}" - Safras ${data[0]?.safra} a ${data[data.length - 1]?.safra}`
            : `Mostrando evolução da produtividade média por cultura entre ${data[0]?.safra} e ${data[data.length - 1]?.safra}`}
        </div>
      </CardFooter>
    </Card>
  );
}