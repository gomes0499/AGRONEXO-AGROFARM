"use client";

import { TrendingUp, Loader2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, LabelList } from "recharts";
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
import { cleanPropertyName } from "@/lib/utils/property-name-cleaner";
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
          ascending: true, // Modificado para ordenar do menor para o maior
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
              <TooltipContent className="bg-background dark:bg-gray-800 border dark:border-gray-700 dark:text-white">
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
              <TooltipContent className="bg-background dark:bg-gray-800 border dark:border-gray-700 dark:text-white">
                <p>Ranking patrimonial das propriedades ordenadas por valor de mercado, permitindo identificar os ativos de maior valor.</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <CardDescription className="text-white/80">
            Ranking patrimonial das propriedades
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="w-full h-[350px] sm:h-[400px] flex items-center justify-center">
            <div className="text-muted-foreground">
              {error ? error : "Nenhuma propriedade com valor cadastrado"}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Dados já estão ordenados do menor para o maior pela query
  const chartData = properties
    .map((property) => {
      const cleanName = cleanPropertyName(property.nome);
      return {
        nome: "", // Removendo os nomes para não aparecerem na label do eixo X
        nomeCompleto: cleanName,
        valor: property.valor_atual,
        valorFormatado: formatCurrency(property.valor_atual),
      };
    });

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
      <CardContent className="p-4">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 35,
              right: 0,
              left: 0,
              bottom: 5,
            }}
            barSize={24}
            maxBarSize={30}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="nome"
              tickLine={false}
              axisLine={false}
              tick={false}
              height={0}
            />
            <YAxis 
              type="number"
              tickLine={true}
              axisLine={true}
              tickFormatter={(value) => value >= 1000000 ? `${(value/1000000).toFixed(0)}M` : value >= 1000 ? `${(value/1000).toFixed(0)}K` : value}
              fontSize={9}
              width={30}
            />
            <ChartTooltip content={<ChartTooltipContent 
              formatter={(value, name, entry) => {
                const data = entry.payload;
                return (
                  <div className="flex justify-between items-center w-full">
                    <span className="font-medium">{data.nomeCompleto}</span>
                    <span className="ml-4 font-mono tabular-nums font-medium">
                      {data.valorFormatado}
                    </span>
                  </div>
                );
              }}
            />} />
            <Bar
              dataKey="valor"
              fill="var(--color-valor)"
              radius={[3, 3, 0, 0]}
              minPointSize={2}
            >
              <LabelList
                dataKey="valor"
                position="top"
                formatter={(value: number) => {
                  if (value >= 1000000000) return `${(value/1000000000).toFixed(1)}B`;
                  if (value >= 1000000) return `${(value/1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value/1000).toFixed(1)}K`;
                  return value.toFixed(0);
                }}
                fill="var(--color-valor)"
                fontSize={11}
                fontWeight="600"
                offset={8}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex justify-between items-center py-2 px-4 border-t">
        <div className="text-xs text-muted-foreground">
          {properties.length}{" "}
          {properties.length === 1 ? "propriedade" : "propriedades"}
        </div>
        <div className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          {formatCurrency(totalValue)}
        </div>
      </CardFooter>
    </Card>
    </TooltipProvider>
  );
}
