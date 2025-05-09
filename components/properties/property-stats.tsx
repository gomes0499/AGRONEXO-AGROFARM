"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCompactCurrency,
  formatCompactNumber,
  formatPercentage,
} from "@/lib/utils";
import { Building, LandPlotIcon, Landmark, Tractor } from "lucide-react";

interface PropertyStatsProps {
  stats: {
    totalProperties: number;
    totalArea: number;
    totalCultivatedArea: number;
    totalValue: number;
    ownedProperties: number;
    leasedProperties: number;
    totalLeases: number;
    leasedArea: number;
    totalImprovements: number;
    improvementsValue: number;
  };
}

export function PropertyStats({ stats }: PropertyStatsProps) {
  const cultivationPercentage =
    stats.totalArea > 0
      ? (stats.totalCultivatedArea / stats.totalArea) * 100
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total de Propriedades */}
      <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Propriedades
          </CardTitle>
          <Building className="h-5 w-5 text-muted-foreground/70" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">
            {stats.totalProperties}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.ownedProperties} própria
            {stats.ownedProperties !== 1 ? "s" : ""}, {stats.leasedProperties}{" "}
            arrendada
            {stats.leasedProperties !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Área Total */}
      <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Área Total
          </CardTitle>
          <LandPlotIcon className="h-5 w-5 text-muted-foreground/70" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">
            {formatCompactNumber(stats.totalArea)} ha
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.totalCultivatedArea} ha cultiváveis (
            {formatPercentage(cultivationPercentage)})
          </p>
        </CardContent>
      </Card>

      {/* Valor Patrimonial */}
      <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Valor Patrimonial
          </CardTitle>
          <Landmark className="h-5 w-5 text-muted-foreground/70" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">
            {formatCompactCurrency(stats.totalValue)}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Inclui {stats.totalImprovements} benfeitoria
            {stats.totalImprovements !== 1 ? "s" : ""} (
            {formatCompactCurrency(stats.improvementsValue)})
          </p>
        </CardContent>
      </Card>

      {/* Arrendamentos */}
      <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Arrendamentos
          </CardTitle>
          <Tractor className="h-5 w-5 text-muted-foreground/70" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">
            {stats.totalLeases}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.leasedArea} ha arrendados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
