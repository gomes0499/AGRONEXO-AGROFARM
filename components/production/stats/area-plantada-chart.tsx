"use client";

import { TrendingUp, Leaf } from "lucide-react";
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
  getAreaPlantadaChart,
  getCulturaColors,
  type CultureAreaData,
} from "@/lib/actions/production-chart-actions";

interface AreaPlantadaChartProps {
  organizationId: string;
  propertyIds?: string[];
  cultureIds?: string[];
}

export function AreaPlantadaChart({
  organizationId,
  propertyIds,
  cultureIds,
}: AreaPlantadaChartProps) {
  const [data, setData] = useState<CultureAreaData[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [chartData, cores] = await Promise.all([
          getAreaPlantadaChart(organizationId, propertyIds, cultureIds),
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

          // Lista de palavras que devem ser capitalizadas individualmente
          const culturas = ["soja", "milho", "algodao", "arroz", "trigo", "feijao", "cafe", "sorgo", "girassol", "canola"];
          const tipos = ["sequeiro", "irrigado", "safrinha", "primeira", "segunda", "terceira"];
          const palavrasEspeciais = [...culturas, ...tipos];
          
          // 1. Primeiro, quebramos a string em CamelCase
          let label = cultura
            .replace(/([a-z])([A-Z])/g, '$1 $2') // Adiciona espaço entre minúscula e maiúscula
            .toLowerCase() // Converte tudo para minúsculo para padronização
            .trim();
          
          // 2. Identificar e capitalizar todas as palavras especiais
          palavrasEspeciais.forEach(palavra => {
            // Regex que encontra a palavra como uma palavra completa, não parte de outra
            const regex = new RegExp(`\\b${palavra}\\b`, "gi");
            const palavraCapitalizada = palavra.charAt(0).toUpperCase() + palavra.slice(1);
            label = label.replace(regex, palavraCapitalizada);
          });
          
          // 3. Garantir que termos compostos como "SojaIrrigado" sejam separados corretamente
          // Primeiro identificamos padrões de cultura+tipo que podem estar juntos
          culturas.forEach(cultura => {
            const culturaCapitalizada = cultura.charAt(0).toUpperCase() + cultura.slice(1);
            
            tipos.forEach(tipo => {
              const tipoCapitalizado = tipo.charAt(0).toUpperCase() + tipo.slice(1);
              
              // Padrão: "CulturaTipo" -> "Cultura Tipo"
              const padraoJunto = new RegExp(`\\b${culturaCapitalizada}${tipoCapitalizado}\\b`, "g");
              label = label.replace(padraoJunto, `${culturaCapitalizada} ${tipoCapitalizado}`);
              
              // Caso especial para "Safrinha" que pode estar entre cultura e tipo
              // Ex: "MilhoSafrinhaIrrigado" -> "Milho Safrinha Irrigado"
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
      } catch (err) {
        console.error("Erro ao carregar gráfico de área plantada:", err);
        setError("Erro ao carregar dados do gráfico");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [organizationId, propertyIds, cultureIds]);

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

  if (loading) {
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
                  Carregando dados de área plantada...
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
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">
                  Evolução da Área Plantada por Cultura
                </CardTitle>
                <CardDescription className="text-white/80">
                  {error || "Nenhum dado de área plantada encontrado"}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="w-full h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">
              {error || "Cadastre áreas de plantio para visualizar o gráfico"}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const crescimentoTotal = calcularCrescimento();
  const culturasKeys = Object.keys(chartConfig);

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
                Área plantada por cultura em hectares ({data[0]?.safra} -{" "}
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
                      <span className="font-medium">{Number(value).toLocaleString()} ha <span className="text-muted-foreground">({percentage}%)</span></span>,
                      <span>{chartConfig[name as string]?.label || name}</span>,
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
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm px-6 pt-4 bg-muted/30">
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
          Mostrando evolução da área plantada por cultura entre {data[0]?.safra}{" "}
          e {data[data.length - 1]?.safra}
        </div>
      </CardFooter>
    </Card>
  );
}
