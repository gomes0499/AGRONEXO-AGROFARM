"use client";

import { TrendingUp, Leaf } from "lucide-react";
import { useMemo } from "react";
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
import plantioData from "@/mock/plantio-data.json";
import { useOrganizationColors } from "@/lib/hooks/use-organization-colors";

// Cores padrão caso não haja cores personalizadas
const DEFAULT_CHART_COLORS = {
  SojaSequeiro: "#006400", // Verde escuro
  SojaIrrigado: "#FFA500", // Laranja
  MilhoSequeiro: "#004d00", // Verde mais escuro
  MilhoSafrinha: "#90EE90", // Verde claro
  Algodao: "#000000", // Preto
  ArrozIrrigado: "#00CC00", // Verde médio
  Sorgo: "#B22222", // Vermelho escuro
  Feijao: "#808080", // Cinza
};

// Calcular o crescimento total da área plantada
const calcularCrescimento = () => {
  const primeiroAno = plantioData.areaPlantio[0];
  const ultimoAno = plantioData.areaPlantio[plantioData.areaPlantio.length - 1];

  const crescimento =
    ((ultimoAno.total - primeiroAno.total) / primeiroAno.total) * 100;
  return crescimento.toFixed(1);
};

export function AreaPlantioChart({ organizationId }: { organizationId?: string }) {
  const crescimentoTotal = calcularCrescimento();
  const { palette, isLoading } = useOrganizationColors(organizationId);
  
  // Criar configuração dinâmica do gráfico com cores da organização ou padrão
  const chartConfig = useMemo(() => {
    const culturas = ["SojaSequeiro", "SojaIrrigado", "MilhoSequeiro", "MilhoSafrinha", "Algodao", "ArrozIrrigado", "Sorgo", "Feijao"];
    const labels = ["Soja Sequeiro", "Soja Irrigado", "Milho Sequeiro", "Milho Safrinha", "Algodão", "Arroz Irrigado", "Sorgo", "Feijão"];
    
    const config: ChartConfig = {};
    
    culturas.forEach((cultura, index) => {
      config[cultura] = {
        label: labels[index],
        color: palette[index] || DEFAULT_CHART_COLORS[cultura as keyof typeof DEFAULT_CHART_COLORS],
      };
    });
    
    return config;
  }, [palette]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>Evolução da Área Plantada</CardTitle>
        </div>
        <CardDescription>
          Área plantada por cultura em hectares (2021/22 - 2029/30)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="w-full h-[350px] sm:h-[400px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={plantioData.areaPlantio}
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
                  width={30}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendMultirow itemsPerRow={3} />} />
                <Bar
                  dataKey="SojaSequeiro"
                  stackId="a"
                  fill={chartConfig.SojaSequeiro?.color}
                  name="Soja Sequeiro"
                />
                <Bar
                  dataKey="SojaIrrigado"
                  stackId="a"
                  fill={chartConfig.SojaIrrigado?.color}
                  name="Soja Irrigado"
                />
                <Bar
                  dataKey="MilhoSequeiro"
                  stackId="a"
                  fill={chartConfig.MilhoSequeiro?.color}
                  name="Milho Sequeiro"
                />
                <Bar
                  dataKey="MilhoSafrinha"
                  stackId="a"
                  fill={chartConfig.MilhoSafrinha?.color}
                  name="Milho Safrinha"
                />
                <Bar
                  dataKey="Algodao"
                  stackId="a"
                  fill={chartConfig.Algodao?.color}
                  name="Algodão"
                />
                <Bar
                  dataKey="ArrozIrrigado"
                  stackId="a"
                  fill={chartConfig.ArrozIrrigado?.color}
                  name="Arroz Irrigado"
                />
                <Bar dataKey="Sorgo" stackId="a" fill={chartConfig.Sorgo?.color} name="Sorgo" />
                <Bar
                  dataKey="Feijao"
                  stackId="a"
                  fill={chartConfig.Feijao?.color}
                  name="Feijão"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm px-6 pt-0">
        <div className="flex gap-2 font-medium leading-none">
          Crescimento total de {crescimentoTotal}% em área plantada{" "}
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="leading-none text-muted-foreground text-xs">
          Mostrando evolução da área plantada por cultura de 2021/22 a 2029/30
        </div>
      </CardFooter>
    </Card>
  );
}
