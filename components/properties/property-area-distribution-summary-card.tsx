"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, Label } from "recharts";
import { Home, Building2, MapPin, Info } from "lucide-react";
import { formatArea } from "@/lib/utils/property-formatters";
import { createClient } from "@/lib/supabase/client";
import { useDashboardFilterContext } from "@/components/dashboard/dashboard-filter-provider";
import { useChartColors } from "@/contexts/chart-colors-context";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface PropertyAreaDistributionSummaryCardProps {
  organizationId: string;
}

export function PropertyAreaDistributionSummaryCard({ organizationId }: PropertyAreaDistributionSummaryCardProps) {
  const { getFilteredPropertyIds, filters, allPropertyIds } = useDashboardFilterContext();
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
          .select(`
            id,
            tipo,
            area_total,
            area_cultivada,
            area_pecuaria
          `)
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
          const stats = prop.tipo === "PROPRIO" ? propriasStats : arrendadasStats;
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
          ].filter(item => item.value > 0);
        };

        setPropriasData(formatDonutData(propriasStats));
        setArrendadasData(formatDonutData(arrendadasStats));
        setPropriasTotal(propriasStats.total);
        setArrendadasTotal(arrendadasStats.total);

        // Dados para o gráfico total
        const totalDonutData = [];
        if (areaPropria > 0) {
          totalDonutData.push({ name: "Própria", value: areaPropria, fill: colors.color1 });
        }
        if (areaArrendada > 0) {
          totalDonutData.push({ name: "Arrendada", value: areaArrendada, fill: colors.color2 });
        }
        setTotalData(totalDonutData);

      } catch (err) {
        console.error("Erro ao buscar distribuição de áreas:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAreaDistribution();
  }, [organizationId, filters.propertyIds, getFilteredPropertyIds, allPropertyIds, colors]);

  const chartConfig: ChartConfig = {
    value: { label: "Área" },
    agricultura: { label: "Agricultura", color: colors.color1 },
    pecuaria: { label: "Pecuária", color: colors.color2 },
    outros: { label: "Outros", color: colors.color3 },
    propria: { label: "Própria", color: colors.color1 },
    arrendada: { label: "Arrendada", color: colors.color2 },
  };

  const DonutChart = ({ data, total }: { data: any[]; total: number }) => {
    const formattedTotal = useMemo(() => {
      if (total >= 1000) {
        return `${(total / 1000).toFixed(1)}k`;
      }
      return total.toFixed(0);
    }, [total]);

    if (data.length === 0) {
      return (
        <div className="h-[140px] flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Sem dados</p>
        </div>
      );
    }

    return (
      <ChartContainer config={chartConfig} className="h-[140px] w-[140px]">
        <PieChart>
          <ChartTooltip 
            cursor={false}
            content={
              <ChartTooltipContent 
                hideLabel 
                formatter={(value: any) => formatArea(typeof value === 'number' ? value : Number(value))}
              />
            }
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={35}
            outerRadius={55}
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
                        y={(viewBox.cy ?? 0) - 5}
                        className="fill-foreground text-xl font-bold"
                      >
                        {formattedTotal}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 12}
                        className="fill-muted-foreground text-xs"
                      >
                        ha
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
    );
  };

  const totalGeral = propriasTotal + arrendadasTotal;

  const renderLegend = (data: any[]) => {
    const dataWithPercentage = data.map(item => ({
      ...item,
      percentage: totalGeral > 0 ? (item.value / totalGeral * 100).toFixed(1) : 0
    }));

    return (
      <div className="space-y-1">
        {dataWithPercentage.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-sm" 
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span className="font-medium">{item.percentage}%</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-white">Distribuição de Áreas</CardTitle>
                <CardDescription className="text-white/80">
                  Análise de uso do solo por tipo de posse
                </CardDescription>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Distribuição detalhada das áreas por tipo de uso (agricultura, pecuária, outros)
                  e tipo de posse (própria ou arrendada).
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-[140px]">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-3 divide-x divide-border">
              {/* Imóveis Próprios */}
              <div className="p-4 flex items-center gap-4">
                <div className="flex-shrink-0">
                  <DonutChart data={propriasData} total={propriasTotal} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Imóveis Próprios</span>
                  </div>
                  {renderLegend(propriasData)}
                </div>
              </div>

              {/* Imóveis Arrendados */}
              <div className="p-4 flex items-center gap-4">
                <div className="flex-shrink-0">
                  <DonutChart data={arrendadasData} total={arrendadasTotal} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Imóveis Arrendados</span>
                  </div>
                  {renderLegend(arrendadasData)}
                </div>
              </div>

              {/* Total Geral */}
              <div className="p-4 flex items-center gap-4">
                <div className="flex-shrink-0">
                  <DonutChart data={totalData} total={totalGeral} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Geral</span>
                  </div>
                  {totalData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div 
                          className="w-2 h-2 rounded-sm" 
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-medium">
                        {totalGeral > 0 ? ((item.value / totalGeral) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}