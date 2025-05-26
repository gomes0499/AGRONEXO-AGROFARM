"use client";

import { TrendingUp, DollarSign } from "lucide-react";
import {
  Bar,
  BarChart,
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
import { useEffect, useState } from "react";
import {
  getReceitaChart,
  getCulturaColors,
  type RevenueData,
} from "@/lib/actions/production-chart-actions";

interface ReceitaChartProps {
  organizationId: string;
  propertyIds?: string[];
}

export function ReceitaChart({
  organizationId,
  propertyIds,
}: ReceitaChartProps) {
  const [data, setData] = useState<RevenueData[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [chartData, cores] = await Promise.all([
          getReceitaChart(organizationId, propertyIds),
          getCulturaColors(organizationId),
        ]);

        setData(chartData);

        // Criar configuração do gráfico baseada nas culturas encontradas
        const config: ChartConfig = {};

        // Paleta expandida baseada no tom da marca como fallback
        const variacoesCores = [
          // Tons primários da marca
          "#1B124E", "#2D1F6B", "#3F2C88", "#5139A5",
          // Tons secundários
          "#6346C2", "#7553DF", "#8760FC", "#9A6DFF",
          // Tons terciários
          "#AC7AFF", "#BE87FF", "#D094FF", "#E2A1FF",
          // Tons complementares
          "#1E3A8A", "#3B82F6", "#60A5FA", "#93C5FD",
          // Tons análogos
          "#7C3AED", "#A855F7", "#C084FC", "#E879F9",
          // Tons neutros
          "#475569", "#64748B", "#94A3B8", "#CBD5E1",
          // Tons de destaque
          "#059669", "#10B981", "#34D399", "#6EE7B7",
          // Tons adicionais
          "#EA580C", "#F97316", "#FB923C", "#FDD3A5",
          // Tons finais
          "#DC2626", "#EF4444", "#F87171", "#FCA5A5",
        ];

        // Extrair todas as culturas únicas dos dados
        const culturasUnicas = new Set<string>();
        chartData.forEach((item) => {
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
            cores[chaveNormalizada] ||
            variacoesCores[corIndex % variacoesCores.length];

          // Formatar label em normal case
          let label = cultura
            .toLowerCase() // Converter para minúsculas primeiro
            .replace(/([a-z])([A-Z])/g, '$1 $2') // Adicionar espaço entre palavras
            .replace(/^./, (char) => char.toUpperCase()) // Primeira letra maiúscula
            .trim();

          // Casos especiais
          if (label.includes("sequeiro")) {
            label = label.replace("sequeiro", "Sequeiro");
          }
          if (label.includes("irrigado")) {
            label = label.replace("irrigado", "Irrigado");
          }
          if (label.includes("safrinha")) {
            label = label.replace("safrinha", "Safrinha");
          }

          config[cultura] = {
            label: label,
            color: cor,
          };

          corIndex++;
        });

        setChartConfig(config);
      } catch (err) {
        console.error("Erro ao carregar gráfico de receita:", err);
        setError("Erro ao carregar dados do gráfico");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [organizationId, propertyIds]);

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

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: value >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
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
                  Carregando dados de receita...
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="w-full h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">Carregando gráfico...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || data.length === 0) {
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
                  {error || "Nenhum dado de receita encontrado"}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="w-full h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">
              {error || "Cadastre dados de produção e preços para visualizar o gráfico"}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mediasPeriodo = calcularMediasPeriodo();
  const culturasKeys = Object.keys(chartConfig);

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
                Receita projetada por cultura em reais ({data[0]?.safra} -{" "}
                {data[data.length - 1]?.safra})
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
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
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
                      `${formatCurrency(Number(value))} (${percentage}%)`,
                      chartConfig[name as string]?.label || name,
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
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm px-6 pt-4 bg-muted/30">
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
          Receitas médias por período e crescimento total entre {data[0]?.safra} e {data[data.length - 1]?.safra}
        </div>
      </CardFooter>
    </Card>
  );
}