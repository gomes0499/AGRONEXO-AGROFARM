"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Label } from "recharts";
import { Home, Building2, MapPin } from "lucide-react";
import { formatArea } from "@/lib/utils/property-formatters";
import { createClient } from "@/lib/supabase/client";
import { useDashboardFilterContext } from "@/components/dashboard/dashboard-filter-provider";
import { useChartColors } from "@/contexts/chart-colors-context";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface PropertyAreaDonutCardsProps {
  organizationId: string;
}

export function PropertyAreaDonutCards({
  organizationId,
}: PropertyAreaDonutCardsProps) {
  const { getFilteredPropertyIds, filters, allPropertyIds } =
    useDashboardFilterContext();
  const { colors } = useChartColors();
  const [loading, setLoading] = useState(true);
  const [propriasData, setPropriasData] = useState<any[]>([]);
  const [arrendadasData, setArrendadasData] = useState<any[]>([]);
  const [totalData, setTotalData] = useState<any[]>([]);
  const [propriasTotal, setPropriasTotal] = useState(0);
  const [arrendadasTotal, setArrendadasTotal] = useState(0);

  useEffect(() => {
    async function fetchAreaDistribution() {
      try {
        setLoading(true);
        const supabase = createClient();
        const filteredPropertyIds = getFilteredPropertyIds(allPropertyIds);

        let query = supabase
          .from("propriedades")
          .select(
            `
            id,
            tipo,
            area_total,
            area_cultivada,
            area_pecuaria
          `
          )
          .eq("organizacao_id", organizationId);

        if (filters.propertyIds.length > 0) {
          query = query.in("id", filteredPropertyIds);
        }

        const { data: properties, error } = await query;
        if (error) throw error;

        // Processar dados para próprias e arrendadas
        const propriasStats = { agro: 0, pecuaria: 0, outros: 0, total: 0 };
        const arrendadasStats = { agro: 0, pecuaria: 0, outros: 0, total: 0 };
        let areaPropria = 0;
        let areaArrendada = 0;

        properties?.forEach((prop) => {
          const stats =
            prop.tipo === "PROPRIO" ? propriasStats : arrendadasStats;
          const areaTotal = prop.area_total || 0;
          const areaCultivada = prop.area_cultivada || 0;
          const areaPecuaria = prop.area_pecuaria || 0;

          stats.agro += areaCultivada;
          stats.pecuaria += areaPecuaria;
          stats.outros += Math.max(0, areaTotal - areaCultivada - areaPecuaria);
          stats.total += areaTotal;

          if (prop.tipo === "PROPRIO") {
            areaPropria += areaTotal;
          } else {
            areaArrendada += areaTotal;
          }
        });

        // Formatar dados para gráficos de rosca
        const formatDonutData = (stats: typeof propriasStats) => {
          if (stats.total === 0) return [];
          return [
            { name: "Agricultura", value: stats.agro, fill: colors.color1 },
            { name: "Pecuária", value: stats.pecuaria, fill: colors.color2 },
            { name: "Outros", value: stats.outros, fill: colors.color3 },
          ].filter((item) => item.value > 0);
        };

        setPropriasData(formatDonutData(propriasStats));
        setArrendadasData(formatDonutData(arrendadasStats));
        setPropriasTotal(propriasStats.total);
        setArrendadasTotal(arrendadasStats.total);

        // Dados para o gráfico total
        const totalDonutData = [];
        if (areaPropria > 0) {
          totalDonutData.push({
            name: "Própria",
            value: areaPropria,
            fill: colors.color1,
          });
        }
        if (areaArrendada > 0) {
          totalDonutData.push({
            name: "Arrendada",
            value: areaArrendada,
            fill: colors.color2,
          });
        }
        setTotalData(totalDonutData);
      } catch (err) {
        console.error("Erro ao buscar distribuição de áreas:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAreaDistribution();
  }, [
    organizationId,
    filters.propertyIds,
    getFilteredPropertyIds,
    allPropertyIds,
    colors,
  ]);

  const chartConfig: ChartConfig = {
    value: { label: "Área" },
    agricultura: { label: "Agricultura", color: colors.color1 },
    pecuaria: { label: "Pecuária", color: colors.color2 },
    outros: { label: "Outros", color: colors.color3 },
    propria: { label: "Própria", color: colors.color1 },
    arrendada: { label: "Arrendada", color: colors.color2 },
  };

  const DonutCard = ({
    title,
    icon: Icon,
    data,
    total,
    subtitle,
    centerLabel = "hectares",
  }: {
    title: string;
    icon: any;
    data: any[];
    total: number;
    subtitle?: string;
    centerLabel?: string;
  }) => {
    const formattedTotal = useMemo(() => {
      if (total >= 1000) {
        return `${(total / 1000).toFixed(1)}k`;
      }
      return total.toFixed(0);
    }, [total]);

    // Calcular porcentagens
    const dataWithPercentage = useMemo(() => {
      return data.map((item) => ({
        ...item,
        percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
      }));
    }, [data, total]);

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            {title}
          </CardTitle>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
        <CardContent className="pb-2">
          {data.length > 0 ? (
            <div className="space-y-2">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square h-[140px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value: any) =>
                          formatArea(
                            typeof value === "number" ? value : Number(value)
                          )
                        }
                      />
                    }
                  />
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={60}
                    strokeWidth={0}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-2xl font-bold"
                              >
                                {formattedTotal}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 20}
                                className="fill-muted-foreground text-xs"
                              >
                                {centerLabel}
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
              {/* Legendas com porcentagem */}
              <div className="space-y-1 px-2">
                {dataWithPercentage.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[140px] flex items-center justify-center">
              <p className="text-xs text-muted-foreground text-center">
                Sem dados disponíveis
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Carregando...
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[140px] flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalGeral = propriasTotal + arrendadasTotal;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Distribuição de Áreas</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DonutCard
          title="Imóveis Próprios"
          icon={Home}
          data={propriasData}
          total={propriasTotal}
          subtitle="Por tipo de uso"
        />
        <DonutCard
          title="Imóveis Arrendados"
          icon={Building2}
          data={arrendadasData}
          total={arrendadasTotal}
          subtitle="Por tipo de uso"
        />
        <DonutCard
          title="Total Geral"
          icon={MapPin}
          data={totalData}
          total={totalGeral}
          subtitle="Própria vs Arrendada"
        />
      </div>
    </div>
  );
}
