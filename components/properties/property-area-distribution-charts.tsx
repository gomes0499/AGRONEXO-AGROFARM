"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Home, Building2, Info, Loader2, Trees, Wheat, Beef } from "lucide-react";
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

interface PropertyAreaDistributionChartsProps {
  organizationId: string;
}

interface AreaData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export function PropertyAreaDistributionCharts({
  organizationId,
}: PropertyAreaDistributionChartsProps) {
  const { getFilteredPropertyIds, filters, allPropertyIds } = useDashboardFilterContext();
  const { colors } = useChartColors();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propriasData, setPropriasData] = useState<AreaData[]>([]);
  const [arrendadasData, setArrendadasData] = useState<AreaData[]>([]);
  const [propriasTotal, setPropriasTotal] = useState(0);
  const [arrendadasTotal, setArrendadasTotal] = useState(0);

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
            area_total,
            area_cultivada,
            area_pecuaria
          `)
          .eq("organizacao_id", organizationId);

        // Aplicar filtros se não estiver em estado "todos selecionados"
        if (filters.propertyIds.length > 0) {
          query = query.in("id", filteredPropertyIds);
        }

        const { data: properties, error } = await query;

        if (error) throw error;

        // Processar dados separadamente para próprias e arrendadas
        const propriasStats = {
          agro: 0,
          pecuaria: 0,
          outros: 0,
          total: 0,
        };

        const arrendadasStats = {
          agro: 0,
          pecuaria: 0,
          outros: 0,
          total: 0,
        };

        properties?.forEach((prop) => {
          const stats = prop.tipo === "PROPRIO" ? propriasStats : arrendadasStats;
          
          // Área agricultura (cultivada)
          stats.agro += prop.area_cultivada || 0;
          
          // Área pecuária
          stats.pecuaria += prop.area_pecuaria || 0;
          
          // Área outros (total - cultivada - pecuária)
          const areaTotal = prop.area_total || 0;
          const areaCultivada = prop.area_cultivada || 0;
          const areaPecuaria = prop.area_pecuaria || 0;
          stats.outros += Math.max(0, areaTotal - areaCultivada - areaPecuaria);
          
          stats.total += areaTotal;
        });

        // Formatar dados para os gráficos
        const formatChartData = (stats: typeof propriasStats): AreaData[] => {
          if (stats.total === 0) return [];
          
          return [
            {
              name: "Agricultura",
              value: stats.agro,
              percentage: (stats.agro / stats.total) * 100,
              color: colors.color1,
            },
            {
              name: "Pecuária",
              value: stats.pecuaria,
              percentage: (stats.pecuaria / stats.total) * 100,
              color: colors.color2,
            },
            {
              name: "Outros (Reservas + APP)",
              value: stats.outros,
              percentage: (stats.outros / stats.total) * 100,
              color: colors.color3,
            },
          ].filter(item => item.value > 0);
        };

        setPropriasData(formatChartData(propriasStats));
        setArrendadasData(formatChartData(arrendadasStats));
        setPropriasTotal(propriasStats.total);
        setArrendadasTotal(arrendadasStats.total);

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
          <p className="font-semibold text-sm dark:text-white">{data.name}</p>
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

  // Configuração dos gráficos
  const chartConfig: ChartConfig = {
    agricultura: {
      label: "Agricultura",
      color: colors.color1,
    },
    pecuaria: {
      label: "Pecuária",
      color: colors.color2,
    },
    outros: {
      label: "Outros (Reservas + APP)",
      color: colors.color3,
    },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
              <CardTitle className="text-white">Carregando...</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico Imóveis Próprios */}
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <Home className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Imóveis Próprios</CardTitle>
                <CardDescription className="text-white/80">
                  Distribuição de área por tipo de uso
                </CardDescription>
              </div>
            </div>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Distribuição percentual das áreas próprias entre agricultura,
                  pecuária e outros usos (reservas legais e APPs).
                </p>
              </TooltipContent>
            </UITooltip>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {propriasData.length > 0 ? (
            <div className="w-full h-[350px] sm:h-[400px]">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={propriasData}
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
                      {propriasData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value: string) => (
                        <span className="text-sm font-medium">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="text-center text-sm text-muted-foreground mt-0">
                Área Total: {formatArea(propriasTotal)}
              </div>
            </div>
          ) : (
            <div className="h-[350px] sm:h-[400px] flex flex-col items-center justify-center">
              <div className="text-muted-foreground mb-4">
                Nenhum imóvel próprio cadastrado
              </div>
              <div className="text-center text-sm text-muted-foreground max-w-md">
                Para visualizar este gráfico, cadastre propriedades próprias
                no módulo de propriedades.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico Imóveis Arrendados */}
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Imóveis Arrendados</CardTitle>
                <CardDescription className="text-white/80">
                  Distribuição de área por tipo de uso
                </CardDescription>
              </div>
            </div>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Distribuição percentual das áreas arrendadas entre agricultura,
                  pecuária e outros usos (reservas legais e APPs).
                </p>
              </TooltipContent>
            </UITooltip>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {arrendadasData.length > 0 ? (
            <div className="w-full h-[350px] sm:h-[400px]">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={arrendadasData}
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
                      {arrendadasData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value: string) => (
                        <span className="text-sm font-medium">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="text-center text-sm text-muted-foreground mt-0">
                Área Total: {formatArea(arrendadasTotal)}
              </div>
            </div>
          ) : (
            <div className="h-[350px] sm:h-[400px] flex flex-col items-center justify-center">
              <div className="text-muted-foreground mb-4">
                Nenhum imóvel arrendado cadastrado
              </div>
              <div className="text-center text-sm text-muted-foreground max-w-md">
                Para visualizar este gráfico, cadastre propriedades arrendadas
                no módulo de propriedades.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}