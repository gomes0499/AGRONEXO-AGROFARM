"use client";

import { TrendingUp, Loader2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils/property-formatters";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDashboardFilterContext } from "@/components/dashboard/dashboard-filter-provider";

interface PropertyValueChartClientProps {
  organizationId: string;
}

interface PropertyData {
  id: string;
  nome: string;
  valor_atual: number;
}

const chartConfig = {
  valor: {
    label: "Valor",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function PropertyValueChartClient({
  organizationId,
}: PropertyValueChartClientProps) {
  const { getFilteredPropertyIds, filters, allPropertyIds } =
    useDashboardFilterContext();
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        setError(null);

        // Aplicar filtros usando os IDs já disponíveis no contexto
        const filteredPropertyIds = getFilteredPropertyIds(allPropertyIds);

        const supabase = createClient();
        let query = supabase
          .from("propriedades")
          .select("id, nome, valor_atual")
          .eq("organizacao_id", organizationId)
          .not("valor_atual", "is", null);

        // Aplicar filtros se não estiver em estado "todos selecionados"
        if (filters.propertyIds.length > 0) {
          query = query.in("id", filteredPropertyIds);
        }

        const { data, error } = await query.order("valor_atual", {
          ascending: false,
        });

        if (error) {
          throw new Error(error.message);
        }

        setProperties(data || []);
      } catch (err) {
        console.error("Erro ao buscar dados do gráfico:", err);
        setError("Erro ao carregar propriedades");
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [
    organizationId,
    filters.propertyIds,
    getFilteredPropertyIds,
    allPropertyIds,
  ]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            Valor por Propriedade
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help ml-auto" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Ranking patrimonial das propriedades ordenadas por valor de mercado, permitindo identificar os ativos de maior valor.</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription className="text-white/80">
            Ranking patrimonial das propriedades
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Carregando gráfico...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || properties.length === 0) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            Valor por Propriedade
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help ml-auto" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Ranking patrimonial das propriedades ordenadas por valor de mercado, permitindo identificar os ativos de maior valor.</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription className="text-white/80">
            Ranking patrimonial das propriedades
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          {error ? error : "Nenhuma propriedade com valor cadastrado"}
        </CardContent>
      </Card>
    );
  }

  // Preparar dados para o gráfico
  const chartData = properties.map((property) => ({
    nome:
      property.nome.length > 20
        ? property.nome.substring(0, 20) + "..."
        : property.nome,
    nomeCompleto: property.nome,
    valor: property.valor_atual,
    valorFormatado: formatCurrency(property.valor_atual),
  }));

  // Calcular total
  const totalValue = properties.reduce((acc, p) => acc + p.valor_atual, 0);

  return (
    <TooltipProvider>
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          Valor por Propriedade
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help ml-auto" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Ranking patrimonial das propriedades ordenadas por valor de mercado, permitindo identificar os ativos de maior valor.</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
        <CardDescription className="text-white/80">Ranking patrimonial das propriedades</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[320px]">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 80,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="nome"
              tickLine={false}
              tickMargin={15}
              axisLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={11}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold text-sm">
                        {data.nomeCompleto}
                      </p>
                      <p className="text-primary font-bold">
                        {data.valorFormatado}
                      </p>
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
          {properties.length}{" "}
          {properties.length === 1 ? "propriedade" : "propriedades"} cadastradas
        </div>
      </CardFooter>
    </Card>
    </TooltipProvider>
  );
}
