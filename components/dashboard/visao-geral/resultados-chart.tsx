"use client";

import * as React from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import resultadosData from "@/mock/resultados-data.json";

// Calcular médias
const calcularMedias = () => {
  const primeiros3Anos = resultadosData.resultados.slice(0, 3);
  const ultimos6Anos = resultadosData.resultados.slice(3);

  const mediaEbitdaPrimeiros =
    (primeiros3Anos.reduce((sum, item) => sum + item.ebitda, 0) /
      primeiros3Anos.reduce((sum, item) => sum + item.receitaTotal, 0)) *
    100;

  const mediaLiquidoPrimeiros =
    (primeiros3Anos.reduce((sum, item) => sum + item.lucroLiquido, 0) /
      primeiros3Anos.reduce((sum, item) => sum + item.receitaTotal, 0)) *
    100;

  const mediaEbitdaUltimos =
    (ultimos6Anos.reduce((sum, item) => sum + item.ebitda, 0) /
      ultimos6Anos.reduce((sum, item) => sum + item.receitaTotal, 0)) *
    100;

  const mediaLiquidoUltimos =
    (ultimos6Anos.reduce((sum, item) => sum + item.lucroLiquido, 0) /
      ultimos6Anos.reduce((sum, item) => sum + item.receitaTotal, 0)) *
    100;

  return {
    mediaEbitdaPrimeiros: mediaEbitdaPrimeiros.toFixed(2),
    mediaLiquidoPrimeiros: mediaLiquidoPrimeiros.toFixed(2),
    mediaEbitdaUltimos: mediaEbitdaUltimos.toFixed(2),
    mediaLiquidoUltimos: mediaLiquidoUltimos.toFixed(2),
  };
};

const chartConfig = {
  receitaTotal: {
    label: "Receita Total",
    color: "#10b981", // Verde
  },
  custoTotal: {
    label: "Custo Total",
    color: "#f59e0b", // Amarelo
  },
  ebitda: {
    label: "Ebitda",
    color: "#3b82f6", // Azul
  },
  lucroLiquido: {
    label: "Lucro Líquido",
    color: "#8b5cf6", // Roxo
  },
} satisfies ChartConfig;

export function ResultadosChart() {
  const [periodo, setPeriodo] = React.useState("todas");
  const medias = calcularMedias();

  // Filtrar dados com base no período selecionado
  const dadosFiltrados =
    periodo === "todas"
      ? resultadosData.resultados
      : periodo === "2021-2024"
      ? resultadosData.resultados.slice(0, 3)
      : resultadosData.resultados.slice(3);

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0  sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Agricultura - Resultados</CardTitle>
          <CardDescription>
            Evolução financeira das safras de 2021/22 a 2029/30
          </CardDescription>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Selecionar período"
          >
            <SelectValue placeholder="Todas Safras" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="todas" className="rounded-lg">
              Todas Safras
            </SelectItem>
            <SelectItem value="2021-2024" className="rounded-lg">
              2021-2024
            </SelectItem>
            <SelectItem value="2024-2030" className="rounded-lg">
              2024-2030
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[350px] w-full"
        >
          <LineChart data={dadosFiltrados}>
            <defs>
              <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-receitaTotal)"
                  stopOpacity={0.1}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-receitaTotal)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-custoTotal)"
                  stopOpacity={0.1}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-custoTotal)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="colorEbitda" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-ebitda)"
                  stopOpacity={0.1}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-ebitda)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-lucroLiquido)"
                  stopOpacity={0.1}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-lucroLiquido)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="safra"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => {
                    const v = Array.isArray(value) ? value[0] : value;
                    const num = typeof v === "number" ? v : Number(v);
                    return new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(num);
                  }}
                  indicator="dot"
                />
              }
            />
            <Line
              type="monotone"
              dataKey="receitaTotal"
              stroke="var(--color-receitaTotal)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="custoTotal"
              stroke="var(--color-custoTotal)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="ebitda"
              stroke="var(--color-ebitda)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="lucroLiquido"
              stroke="var(--color-lucroLiquido)"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm border-t pt-5">
        <div className="grid grid-cols-2 w-full gap-8">
          <div>
            <div className="font-medium leading-none mb-2">
              Período 2021-2024
            </div>
            <div className="text-muted-foreground flex justify-between">
              <span>
                Média Ebitda:{" "}
                <strong className="text-blue-600">
                  {medias.mediaEbitdaPrimeiros}%
                </strong>
              </span>
              <span>
                Média L. Líquido:{" "}
                <strong className="text-purple-600">
                  {medias.mediaLiquidoPrimeiros}%
                </strong>
              </span>
            </div>
          </div>
          <div>
            <div className="font-medium leading-none mb-2">
              Período 2024-2030
            </div>
            <div className="text-muted-foreground flex justify-between">
              <span>
                Média Ebitda:{" "}
                <strong className="text-blue-600">
                  {medias.mediaEbitdaUltimos}%
                </strong>
              </span>
              <span>
                Média L. Líquido:{" "}
                <strong className="text-purple-600">
                  {medias.mediaLiquidoUltimos}%
                </strong>
              </span>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
