"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils/property-formatters"

interface PropertyValueChartProps {
  organizationId: string;
}

async function getPropertyChartData(organizationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("propriedades")
    .select("id, nome, valor_atual")
    .eq("organizacao_id", organizationId)
    .not("valor_atual", "is", null)
    .order("valor_atual", { ascending: false });

  if (error) {
    console.error("Erro ao buscar dados do gráfico:", error);
    return [];
  }

  return data || [];
}

const chartConfig = {
  valor: {
    label: "Valor",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

async function PropertyValueChartContent({ organizationId }: PropertyValueChartProps) {
  try {
    const properties = await getPropertyChartData(organizationId);

    if (properties.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Valor por Propriedade</CardTitle>
            <CardDescription>Ranking patrimonial das propriedades</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
            Nenhuma propriedade com valor cadastrado
          </CardContent>
        </Card>
      );
    }

    // Preparar dados para o gráfico
    const chartData = properties.map(property => ({
      nome: property.nome.length > 15 
        ? property.nome.substring(0, 15) + "..." 
        : property.nome,
      nomeCompleto: property.nome,
      valor: property.valor_atual,
      valorFormatado: formatCurrency(property.valor_atual)
    }));

    // Calcular total
    const totalValue = properties.reduce((acc, p) => acc + p.valor_atual, 0);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Valor por Propriedade</CardTitle>
          <CardDescription>Ranking patrimonial das propriedades</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <BarChart 
              accessibilityLayer 
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="nome"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold text-sm">{data.nomeCompleto}</p>
                        <p className="text-primary font-bold">{data.valorFormatado}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="valor" 
                fill="var(--color-valor)" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <div className="flex gap-2 font-medium leading-none">
            <TrendingUp className="h-4 w-4" />
            Total: {formatCurrency(totalValue)}
          </div>
          <div className="leading-none text-muted-foreground">
            {properties.length} {properties.length === 1 ? 'propriedade' : 'propriedades'} cadastradas
          </div>
        </CardFooter>
      </Card>
    );
  } catch (error) {
    console.error("Erro ao carregar gráfico de propriedades:", error);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Valor por Propriedade</CardTitle>
          <CardDescription>Ranking patrimonial das propriedades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="space-y-2 text-center">
              <div className="h-4 bg-muted rounded w-32 animate-pulse mx-auto"></div>
              <div className="h-4 bg-muted rounded w-24 animate-pulse mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
}

export async function PropertyValueChart({ organizationId }: PropertyValueChartProps) {
  return <PropertyValueChartContent organizationId={organizationId} />;
}