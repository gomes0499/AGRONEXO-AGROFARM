"use client";

import { TrendingDown } from "lucide-react";
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
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

// Dados da composição da dívida
const chartData = [
  { tipo: "bancos", valor: 79, descricao: "Bancos", fill: "#10b981" }, // Verde
  { tipo: "tradings", valor: 12, descricao: "Tradings", fill: "#f59e0b" }, // Amarelo
  {
    tipo: "fornecedores",
    valor: 9,
    descricao: "Fornecedores",
    fill: "#3b82f6",
  }, // Azul
];

// Configuração do gráfico com cores hard-coded
const chartConfig = {
  valor: {
    label: "Valor",
  },
  bancos: {
    label: "Bancos",
    color: "#10b981", // Verde
  },
  tradings: {
    label: "Tradings",
    color: "#f59e0b", // Amarelo
  },
  fornecedores: {
    label: "Fornecedores",
    color: "#3b82f6", // Azul
  },
} satisfies ChartConfig;

// Detalhamento dos bancos para exibir no rodapé
const detalhesBancos = [
  { nome: "Banco do Brasil S.A.", percentual: 29 },
  { nome: "Banco Santander Brasil SA", percentual: 14 },
  { nome: "Banco Bradesco S.A.", percentual: 10 },
  { nome: "Banco Daycoval S.A.", percentual: 10 },
  { nome: "Outros Bancos", percentual: 16 },
];

export function ComposicaoDividaChart() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle>Composição da Dívida</CardTitle>
        <CardDescription>Distribuição por tipo de credor</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value: number) => {
                      return `${value}%`;
                    }}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="valor"
                nameKey="tipo"
                cx="50%"
                cy="50%"
                outerRadius={70}
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-2 flex justify-center gap-4">
          {chartData.map((item) => (
            <div key={item.tipo} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-sm">
                {item.descricao}: <strong>{item.valor}%</strong>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-2">
        <div className="flex items-center gap-2 font-medium leading-none">
          <TrendingDown className="h-4 w-4 text-emerald-500" /> Redução de 7.8%
          na dívida total vs último ano
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          <p className="font-medium mb-1">Principais credores bancários:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {detalhesBancos.map((banco) => (
              <div key={banco.nome} className="flex justify-between">
                <span className="truncate">{banco.nome}</span>
                <span>{banco.percentual}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
