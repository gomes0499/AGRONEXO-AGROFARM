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

interface ReceitaChartClientProps {
  organizationId: string;
  propertyIds?: string[];
  cultureIds?: string[];
  projectionId?: string;
  initialData: ReceitaChartData;
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

  // Função para renderizar labels customizados
  const renderCustomLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    
    // Não mostrar se não há valor
    if (!value || value < 100000) return null; // Não mostrar valores menores que 100k
    
    // Só mostrar se o segmento tiver altura suficiente
    if (height < 30) {
      return null; // Não mostrar em segmentos muito pequenos para evitar sobreposição
    }
    
    // Formatar o valor
    const formattedValue = value >= 1000000 ? `${(value/1000000).toFixed(1)}M` : `${(value/1000).toFixed(1)}K`;
    
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
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">
                {projectionId ? "Projeção de Receita por Cultura" : "Evolução da Receita por Cultura"}
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
                  tickFormatter={(value) => formatCurrency(value)}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  fontSize={12}
                  width={70}
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
                  content={<ChartLegendMultirow itemsPerRow={3} />}
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
                    </Bar>
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm px-6 pt-4">
        {!projectionId ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-xs">
              {/* Período Realizado 2021-2024 */}
              <div className="space-y-1">
                <div className="font-medium text-muted-foreground">Realizado (2021-2024)</div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span>Receita Média: {mediasPeriodo.receitaRealizada}</span>
                </div>
              </div>
              
              {/* Período Projetado 2025-2030 */}
              <div className="space-y-1">
                <div className="font-medium text-muted-foreground">Projetado (2025-2030)</div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span>Receita Média: {mediasPeriodo.receitaProjetada}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 font-medium leading-none pt-2 border-t border-muted-foreground/20 w-full">
              {Number(mediasPeriodo.crescimentoMedio) >= 0 ? (
                <>
                  Crescimento total de {mediasPeriodo.crescimentoMedio}% na receita{" "}
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </>
              ) : (
                <>
                  Redução total de {Math.abs(Number(mediasPeriodo.crescimentoMedio))}% na receita{" "}
                  <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                </>
              )}
            </div>
            
            <div className="leading-none text-muted-foreground text-xs">
              {`Receitas médias por período e crescimento total entre ${data[0]?.safra} e ${data[data.length - 1]?.safra}`}
            </div>
          </>
        ) : (
          <>
            <div className="w-full">
              <div className="font-medium text-muted-foreground text-xs mb-2">
                Valores projetados por safra
              </div>
              {/* Mostrar resumo dos valores totais */}
              <div className="space-y-1">
                {data.slice(-3).map((item) => (
                  <div key={item.safra} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.safra}:</span>
                    <span className="font-medium">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 font-medium leading-none pt-2 border-t border-muted-foreground/20 w-full text-xs">
              <TrendingUp className="h-4 w-4 text-primary" />
              Projeção baseada em áreas, produtividades e preços estimados
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}