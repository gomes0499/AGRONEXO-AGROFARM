"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatArea, formatCurrency } from "@/lib/utils/property-formatters";
import { Map, BarChart3, Home, Building2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { BrazilMapSvg } from "./brazil-map-svg";
import { PropertyOwnershipBreakdown } from "./property-ownership-breakdown";
import { PropertyEnvironmentalSummaryClient } from "./property-environmental-summary-client";
import { PropertyKpiCardsFull } from "./property-kpi-cards-full";
import { useDashboardFilterContext } from "@/components/dashboard/dashboard-filter-provider";
import { useEffect, useState } from "react";
import { getPropertyGeoStats } from "@/lib/actions/property-geo-stats-actions";

interface PropertyMapBreakdownProps {
  organizationId: string;
}

function PropertyMapBreakdownContent({
  organizationId,
}: PropertyMapBreakdownProps) {
  const { getFilteredPropertyIds, filters, allPropertyIds } =
    useDashboardFilterContext();
  const [geoStats, setGeoStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGeoStats() {
      try {
        setLoading(true);
        setError(null);

        // Aplicar filtros usando os IDs já disponíveis no contexto
        const filteredPropertyIds = getFilteredPropertyIds(allPropertyIds);

        // Usar filtros se não estiver em estado "todos selecionados"
        const propertyIdsForFilter =
          filters.propertyIds.length > 0 ? filteredPropertyIds : undefined;

        const stats = await getPropertyGeoStats(
          organizationId,
          propertyIdsForFilter
        );
        setGeoStats(stats);
      } catch (err) {
        console.error("Erro ao carregar estatísticas geográficas:", err);
        setError("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }

    fetchGeoStats();
  }, [
    organizationId,
    filters.propertyIds,
    getFilteredPropertyIds,
    allPropertyIds,
  ]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* KPI Cards no topo */}
        <PropertyKpiCardsFull organizationId={organizationId} />

        {/* Segunda linha - Mapa e Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-white/20">
                    <Map className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      Mapa do Brasil
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      Visualização geográfica das propriedades
                    </CardDescription>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Visualização geográfica das propriedades por estado
                      brasileiro, mostrando distribuição territorial e
                      concentração patrimonial.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 bg-muted rounded animate-pulse"
                    />
                  ))}
                </div>
                <div className="h-32 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-white/20">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      Resumo por Estado
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      Análise detalhada por estado
                    </CardDescription>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Análise detalhada por estado mostrando área total, valor
                      patrimonial e distribuição entre propriedades próprias e
                      arrendadas.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted rounded w-24" />
                    <div className="space-y-1 pl-4">
                      <div className="h-3 bg-muted rounded w-32" />
                      <div className="h-3 bg-muted rounded w-28" />
                      <div className="h-3 bg-muted rounded w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Terceira linha - Valor por Propriedade + Próprias vs Arrendadas */}
        <div className="grid grid-cols-1 gap-6">
          <PropertyOwnershipBreakdown organizationId={organizationId} />
        </div>
      </div>
    );
  }

  if (error || !geoStats) {
    return (
      <div className="space-y-6">
        {/* KPI Cards no topo */}
        <PropertyKpiCardsFull organizationId={organizationId} />

        {/* Segunda linha - Mapa e Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-white/20">
                    <Map className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      Mapa do Brasil
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      Visualização geográfica das propriedades
                    </CardDescription>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Visualização geográfica das propriedades por estado
                      brasileiro, mostrando distribuição territorial e
                      concentração patrimonial.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
              {error || "Nenhuma propriedade cadastrada"}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-white/20">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      Resumo por Estado
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      Análise detalhada por estado
                    </CardDescription>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Análise detalhada por estado mostrando área total, valor
                      patrimonial e distribuição entre propriedades próprias e
                      arrendadas.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhum dado disponível
            </CardContent>
          </Card>
        </div>

        {/* Terceira linha - Valor por Propriedade + Próprias vs Arrendadas */}
        <div className="grid grid-cols-1 gap-6">
          <PropertyOwnershipBreakdown organizationId={organizationId} />
        </div>
      </div>
    );
  }

  if (geoStats.estadosData.length === 0) {
    return (
      <div className="space-y-6">
        {/* KPI Cards no topo */}
        <PropertyKpiCardsFull organizationId={organizationId} />

        {/* Segunda linha - Mapa e Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-white/20">
                    <Map className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      Mapa do Brasil
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      Visualização geográfica das propriedades
                    </CardDescription>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Visualização geográfica das propriedades por estado
                      brasileiro, mostrando distribuição territorial e
                      concentração patrimonial.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhuma propriedade cadastrada
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-white/20">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      Resumo por Estado
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      Análise detalhada por estado
                    </CardDescription>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Análise detalhada por estado mostrando área total, valor
                      patrimonial e distribuição entre propriedades próprias e
                      arrendadas.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
              Nenhum dado disponível
            </CardContent>
          </Card>
        </div>

        {/* Terceira linha - Valor por Propriedade + Próprias vs Arrendadas */}
        <div className="grid grid-cols-1 gap-6">
          <PropertyOwnershipBreakdown organizationId={organizationId} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards no topo */}
      <PropertyKpiCardsFull organizationId={organizationId} />

      {/* Segunda linha - Mapa e Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mapa do Brasil */}
        <Card>
          <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-white/20 ">
                  <Map className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    Mapa do Brasil
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    Visualização geográfica das propriedades
                  </CardDescription>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Visualização geográfica das propriedades por estado
                    brasileiro, mostrando distribuição territorial e
                    concentração patrimonial.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Legenda de cores para estados */}
              <div className="flex flex-wrap gap-3 mb-3 justify-center">
                {geoStats.estadosData.slice(0, 7).map((estado: any) => (
                  <div
                    key={estado.estado}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-[3px] border border-border/30"
                      style={{ backgroundColor: estado.color }}
                    />
                    <span className="text-sm font-medium">
                      {estado.estado} <span className="text-muted-foreground font-normal">({estado.totalPropriedades})</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Mapa SVG do Brasil */}
              <div>
                <BrazilMapSvg estadosData={geoStats.estadosData} />
              </div>
              
              {/* Mais estados na legenda (se houver) */}
              {geoStats.estadosData.length > 7 && (
                <div className="flex flex-wrap gap-3 mt-3 justify-center">
                  {geoStats.estadosData.slice(7).map((estado: any) => (
                    <div
                      key={estado.estado}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-[3px] border border-border/30"
                        style={{ backgroundColor: estado.color }}
                      />
                      <span className="text-sm font-medium">
                        {estado.estado} <span className="text-muted-foreground font-normal">({estado.totalPropriedades})</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Breakdown por Estado */}
        <Card>
          <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-white/20">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    Resumo por Estado
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    Análise detalhada por estado
                  </CardDescription>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-white/70 hover:text-white cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Análise detalhada por estado mostrando área total, valor
                    patrimonial e distribuição entre propriedades próprias e
                    arrendadas.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {geoStats.estadosData.map((estado: any) => (
                <div key={estado.estado} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm uppercase tracking-wide">
                      {estado.nomeEstado}
                    </h4>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: estado.color }}
                    />
                  </div>

                  <div className="pl-4 space-y-1 border-l-2 border-muted">
                    {/* Área */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        ├─ {formatArea(estado.areaTotal)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {estado.percentualArea.toFixed(1)}%
                      </Badge>
                    </div>

                    {/* Valor */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        ├─ {formatCurrency(estado.valorTotal)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {estado.percentualValor.toFixed(1)}%
                      </Badge>
                    </div>

                    {/* Tipo de propriedades */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">└─</span>
                        {estado.propriedadesProprias > 0 && (
                          <div className="flex items-center gap-1">
                            <Home className="h-3 w-3 text-green-600" />
                            <span className="text-xs">
                              {estado.propriedadesProprias}{" "}
                              {estado.propriedadesProprias === 1
                                ? "própria"
                                : "próprias"}
                            </span>
                          </div>
                        )}
                        {estado.propriedadesArrendadas > 0 && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-blue-600" />
                            <span className="text-xs">
                              {estado.propriedadesArrendadas}{" "}
                              {estado.propriedadesArrendadas === 1
                                ? "arrendada"
                                : "arrendadas"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Resumo total */}
              {geoStats.estadosData.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      Total: {geoStats.totalGeral.propriedades} propriedades
                    </div>
                    <div>Área: {formatArea(geoStats.totalGeral.area)}</div>
                    <div>
                      Valor: {formatCurrency(geoStats.totalGeral.valor)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Terceira linha - Próprias vs Arrendadas */}
      <div className="grid grid-cols-1 gap-6">
        <PropertyOwnershipBreakdown organizationId={organizationId} />
      </div>
    </div>
  );
}

export function PropertyMapBreakdown({
  organizationId,
}: PropertyMapBreakdownProps) {
  return (
    <TooltipProvider>
      <PropertyMapBreakdownContent organizationId={organizationId} />
    </TooltipProvider>
  );
}
