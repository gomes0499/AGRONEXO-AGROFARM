"use client";

import { TrendingUp, Leaf } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import plantioData from "@/mock/plantio-data.json";

// Configuração do gráfico com cores hard coded baseadas na imagem
const chartConfig = {
  SojaSequeiro: {
    label: "Soja Sequeiro",
    color: "#006400", // Verde escuro
  },
  SojaIrrigado: {
    label: "Soja Irrigado",
    color: "#FFA500", // Laranja
  },
  MilhoSequeiro: {
    label: "Milho Sequeiro",
    color: "#004d00", // Verde mais escuro
  },
  MilhoSafrinha: {
    label: "Milho Safrinha",
    color: "#90EE90", // Verde claro
  },
  Algodao: {
    label: "Algodão",
    color: "#000000", // Preto
  },
  ArrozIrrigado: {
    label: "Arroz Irrigado",
    color: "#00CC00", // Verde médio
  },
  Sorgo: {
    label: "Sorgo",
    color: "#B22222", // Vermelho escuro
  },
  Feijao: {
    label: "Feijão",
    color: "#808080", // Cinza
  },
} satisfies ChartConfig;

// Calcular o crescimento total da área plantada
const calcularCrescimento = () => {
  const primeiroAno = plantioData.areaPlantio[0];
  const ultimoAno = plantioData.areaPlantio[plantioData.areaPlantio.length - 1];

  const crescimento =
    ((ultimoAno.total - primeiroAno.total) / primeiroAno.total) * 100;
  return crescimento.toFixed(1);
};

export function AreaPlantioChart() {
  const crescimentoTotal = calcularCrescimento();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Evolução da Área Plantada</CardTitle>
        </div>
        <CardDescription>
          Área plantada por cultura em hectares (2021/22 - 2029/30)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <BarChart accessibilityLayer data={plantioData.areaPlantio}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="safra"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
              }
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="SojaSequeiro"
              stackId="a"
              fill="#006400"
              name="Soja Sequeiro"
            />
            <Bar
              dataKey="SojaIrrigado"
              stackId="a"
              fill="#FFA500"
              name="Soja Irrigado"
            />
            <Bar
              dataKey="MilhoSequeiro"
              stackId="a"
              fill="#004d00"
              name="Milho Sequeiro"
            />
            <Bar
              dataKey="MilhoSafrinha"
              stackId="a"
              fill="#90EE90"
              name="Milho Safrinha"
            />
            <Bar dataKey="Algodao" stackId="a" fill="#000000" name="Algodão" />
            <Bar
              dataKey="ArrozIrrigado"
              stackId="a"
              fill="#00CC00"
              name="Arroz Irrigado"
            />
            <Bar dataKey="Sorgo" stackId="a" fill="#B22222" name="Sorgo" />
            <Bar dataKey="Feijao" stackId="a" fill="#808080" name="Feijão" />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Crescimento total de {crescimentoTotal}% em área plantada{" "}
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="leading-none text-muted-foreground">
          Mostrando evolução da área plantada por cultura de 2021/22 a 2029/30
        </div>
      </CardFooter>
    </Card>
  );
}
