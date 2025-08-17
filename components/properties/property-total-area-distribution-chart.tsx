"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Loader2, Info, Home, Building2 } from "lucide-react";
import { formatArea } from "@/lib/utils/property-formatters";
import { createClient } from "@/lib/supabase/client";
import { useDashboardFilterContext } from "@/components/dashboard/dashboard-filter-provider";
import { useChartColors } from "@/contexts/chart-colors-context";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PropertyTotalAreaDistributionChartProps {
  organizationId: string;
}

interface AreaData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  icon: React.ReactNode;
}

export function PropertyTotalAreaDistributionChart({
  organizationId,
}: PropertyTotalAreaDistributionChartProps) {
  const { getFilteredPropertyIds, filters, allPropertyIds } = useDashboardFilterContext();
  const { colors } = useChartColors();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<AreaData[]>([]);
  const [totalArea, setTotalArea] = useState(0);

  useEffect(() => {
    async function fetchAreaDistribution() {
      try {
        setLoading(true);
        setError(null);

        const supabase = createClient();
        
        // Aplicar filtros
        const filteredPropertyIds = getFilteredPropertyIds(allPropertyIds);
        
        let query = supabase
          .from("propriedades")
          .select(`
            id,
            tipo,
            area_total
          `)
          .eq("organizacao_id", organizationId);

        // Aplicar filtros se não estiver em estado "todos selecionados"
        if (filters.propertyIds.length > 0) {
          query = query.in("id", filteredPropertyIds);
        }

        const { data: properties, error } = await query;

        if (error) throw error;

        // Processar dados
        let areaPropria = 0;
        let areaArrendada = 0;

        properties?.forEach((prop) => {
          const area = prop.area_total || 0;
          if (prop.tipo === "PROPRIO") {
            areaPropria += area;
          } else {
            areaArrendada += area;
          }
        });

        const total = areaPropria + areaArrendada;
        setTotalArea(total);

        // Formatar dados para o gráfico
        const data: AreaData[] = [];
        
        if (areaPropria > 0) {
          data.push({
            name: "Área Própria",
            value: areaPropria,
            percentage: total > 0 ? (areaPropria / total) * 100 : 0,
            color: colors.color1,
            icon: <Home className="h-4 w-4" />
          });
        }
        
        if (areaArrendada > 0) {
          data.push({
            name: "Área Arrendada",
            value: areaArrendada,
            percentage: total > 0 ? (areaArrendada / total) * 100 : 0,
            color: colors.color2,
            icon: <Building2 className="h-4 w-4" />
          });
        }

        setChartData(data);

      } catch (err) {
        console.error("Erro ao buscar distribuição de áreas:", err);
        setError("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }

    fetchAreaDistribution();
  }, [organizationId, filters.propertyIds, getFilteredPropertyIds, allPropertyIds, colors]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background dark:bg-gray-800 border border-border dark:border-gray-700 rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            {data.icon}
            <p className="font-semibold text-sm dark:text-white">{data.name}</p>
          </div>
          <div className="my-1 h-px bg-border dark:bg-gray-600" />
          <div className="space-y-1 mt-2">
            <p className="text-sm flex justify-between gap-4">
              <span className="text-muted-foreground dark:text-gray-400">
                Área:
              </span>
              <span className="font-medium dark:text-white">
                {formatArea(data.value)}
              </span>
            </p>
            <p className="text-sm flex justify-between gap-4">
              <span className="text-muted-foreground dark:text-gray-400">
                Participação:
              </span>
              <span className="font-medium dark:text-white">
                {data.percentage.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Configuração do gráfico
  const chartConfig: ChartConfig = {
    propria: {
      label: "Área Própria",
      color: colors.color1,
    },
    arrendada: {
      label: "Área Arrendada",
      color: colors.color2,
    },
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <CardTitle className="text-white">Carregando...</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <Home className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Distribuição Total de Área</CardTitle>
              <CardDescription className="text-white/80">
                Área própria vs área arrendada
              </CardDescription>
            </div>
          </div>
          <UITooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Distribuição total de hectares entre propriedades próprias e arrendadas,
                mostrando o percentual de cada tipo de posse.
              </p>
            </TooltipContent>
          </UITooltip>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {chartData.length > 0 ? (
          <div className="w-full h-[350px] sm:h-[400px]">
            <ChartContainer config={chartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(1)}%`
                    }
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string, entry: any) => (
                      <span className="text-sm font-medium flex items-center gap-2">
                        {entry.payload.icon}
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="text-center text-sm text-muted-foreground mt-0">
              Área Total: {formatArea(totalArea)}
            </div>
          </div>
        ) : (
          <div className="h-[350px] sm:h-[400px] flex flex-col items-center justify-center">
            <div className="text-muted-foreground mb-4">
              Nenhuma propriedade cadastrada
            </div>
            <div className="text-center text-sm text-muted-foreground max-w-md">
              Para visualizar este gráfico, cadastre propriedades
              no módulo de propriedades.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}