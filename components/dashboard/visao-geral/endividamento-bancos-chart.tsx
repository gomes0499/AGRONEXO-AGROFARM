"use client";

import { TrendingDown } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// Dados de endividamento por banco baseados na imagem
const chartData = [
  { banco: "BANCO DO BRASIL S.A.", percentual: 29 },
  { banco: "BANCO SANTANDER BRASIL SA", percentual: 14 },
  { banco: "BANCO BRADESCO S.A.", percentual: 10 },
  { banco: "BANCO DAYCOVAL S.A.", percentual: 10 },
  { banco: "CAIXA ECONÔMICA FEDERAL", percentual: 9 },
  { banco: "BANCO CNH INDUSTRIAL CAPITAL SA", percentual: 7 },
  { banco: "SICREDI", percentual: 5 },
  { banco: "BANCO PINE S.A", percentual: 5 },
  { banco: "BANCO CARGILL SA", percentual: 4 },
  { banco: "DESENBAHIA-AGENCIA DE FOMENTO", percentual: 3 },
  { banco: "OUTROS BANCOS", percentual: 4 }, // Agrupei os bancos com 1% em "OUTROS BANCOS"
];

// Configuração do gráfico com cores hard-coded
const chartConfig = {
  percentual: {
    label: "Percentual",
    color: "#10b981", // Verde
  },
  label: {
    color: "#ffffff", // Branco para o texto dentro das barras
  },
} satisfies ChartConfig;

export function EndividamentoBancosChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Endividamento por Banco</CardTitle>
        <CardDescription>
          Distribuição percentual da dívida por instituição financeira
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              top: 5,
              right: 50,
              left: 5,
              bottom: 5,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="banco"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              hide
            />
            <XAxis dataKey="percentual" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value: number) => {
                    return `${value}%`;
                  }}
                  indicator="line"
                />
              }
            />
            <Bar
              dataKey="percentual"
              layout="vertical"
              fill="#10b981"
              radius={4}
            >
              <LabelList
                dataKey="banco"
                position="insideLeft"
                offset={8}
                className="fill-white text-xs font-medium"
                fontSize={12}
              />
              <LabelList
                dataKey="percentual"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: number) => `${value}%`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          <TrendingDown className="h-4 w-4 text-emerald-500" /> Redução de 7.8%
          na dívida total vs último ano
        </div>
        <div className="leading-none text-muted-foreground">
          79% da dívida está concentrada nos 5 principais bancos
        </div>
      </CardFooter>
    </Card>
  );
}
