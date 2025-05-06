"use client";

import { formatCurrency } from "@/lib/utils/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LandPlotIcon, Landmark, Tractor, Building, CalculatorIcon } from "lucide-react";

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
      ? Math.round((stats.totalCultivatedArea / stats.totalArea) * 100) 
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Propriedades</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProperties}</div>
          <p className="text-xs text-muted-foreground">
            {stats.ownedProperties} próprias, {stats.leasedProperties} arrendadas
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Área Total</CardTitle>
          <LandPlotIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalArea.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })} ha</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalCultivatedArea.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })} ha cultiváveis ({cultivationPercentage}%)
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Patrimonial</CardTitle>
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
          <p className="text-xs text-muted-foreground">
            Inclui {stats.totalImprovements} benfeitorias ({formatCurrency(stats.improvementsValue)})
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Arrendamentos</CardTitle>
          <Tractor className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalLeases}</div>
          <p className="text-xs text-muted-foreground">
            {stats.leasedArea.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })} ha arrendados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}