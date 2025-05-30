"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatArea, formatCurrency } from "@/lib/utils/formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PropertyFilterClient } from "@/components/production/property-filter-client";

export interface Property {
  id: string;
  organizacao_id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  areaTotal?: number;
}

export interface ProductionStats {
  totalPlantingArea: number;
  areasByCulture: Record<string, number>;
  areasBySystem: Record<string, number>;
  areasByCycle: Record<string, number>;
  productivityByCultureAndSystem: unknown[];
  costsByCategory: Record<string, number>;
  costsByCulture: Record<string, number>;
  costsBySystem: Record<string, number>;
  totalCosts: number;
}

// Função de formatação compacta
function formatCurrencyCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `R$ ${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1)}K`;
  } else {
    return formatCurrency(value);
  }
}

interface ProductionDashboardProps {
  stats: ProductionStats;
  cultures: any[];
  formattedProperties: Property[];
  defaultSelectedPropertyIds: string[];
  totalAnimals: number;
  totalLivestockValue: number;
  trends: {
    area: { value: number; positive: boolean };
    cultures: { value: number; positive: boolean };
    livestock: { value: number; positive: boolean };
    costs: { value: number; positive: boolean };
  };
}

export function ProductionDashboard({
  stats,
  cultures,
  formattedProperties,
  defaultSelectedPropertyIds,
  totalAnimals,
  totalLivestockValue,
  trends
}: ProductionDashboardProps) {
  
  // Ordenar culturas por área (decrescente)
  const sortedCultures = Object.entries(stats.areasByCulture || {})
    .map(([name, area]) => ({
      name,
      area: Number(area),
      percentage: stats.totalPlantingArea
        ? (Number(area) / stats.totalPlantingArea) * 100
        : 0,
    }))
    .sort((a, b) => b.area - a.area);

  // Ordenar sistemas por área (decrescente)
  const sortedSystems = Object.entries(stats.areasBySystem || {})
    .map(([name, area]) => ({
      name,
      area: Number(area),
      percentage: stats.totalPlantingArea
        ? (Number(area) / stats.totalPlantingArea) * 100
        : 0,
    }))
    .sort((a, b) => b.area - a.area);

  // Ordenar categorias de custo (decrescente)
  const sortedCostCategories = Object.entries(stats.costsByCategory || {})
    .map(([name, cost]) => ({
      name,
      cost: Number(cost),
      percentage: stats.totalCosts
        ? (Number(cost) / stats.totalCosts) * 100
        : 0,
    }))
    .sort((a, b) => b.cost - a.cost);

  // Calcular custo médio por hectare
  const costPerHectare = stats.totalPlantingArea
    ? stats.totalCosts / stats.totalPlantingArea
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Produção</h2>
          <p className="text-muted-foreground">
            Visão geral da produção agrícola e pecuária
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PropertyFilterClient 
            properties={formattedProperties} 
            defaultSelectedIds={defaultSelectedPropertyIds}
          />
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Área Total de Plantio
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardTitle>
            <CardDescription>Área total em produção</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatArea(stats.totalPlantingArea || 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              +{trends.area.value}% em relação ao período anterior
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Culturas
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardTitle>
            <CardDescription>Culturas cadastradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cultures.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {Object.keys(stats.areasByCulture || {}).length} em produção atual
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Rebanho
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardTitle>
            <CardDescription>Total de animais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAnimals}</div>
            <div className="text-xs text-muted-foreground mt-1">
              +{trends.livestock.value}% em relação ao período anterior
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Custos Totais
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </CardTitle>
            <CardDescription>Custos de produção</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrencyCompact(stats.totalCosts || 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              -{Math.abs(trends.costs.value)}% em relação ao período anterior
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e detalhamentos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Distribuição de Áreas</CardTitle>
            </div>
            <CardDescription>
              Distribuição de áreas por cultura e sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cultures">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="cultures">Por Cultura</TabsTrigger>
                <TabsTrigger value="systems">Por Sistema</TabsTrigger>
              </TabsList>
              <TabsContent value="cultures">
                <div className="space-y-4">
                  {sortedCultures.slice(0, 5).map((culture) => (
                    <div key={culture.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{culture.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {formatArea(culture.area)}
                          </span>
                          <span className="text-sm font-medium">
                            {culture.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <Progress value={culture.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="systems">
                <div className="space-y-4">
                  {sortedSystems.slice(0, 5).map((system) => (
                    <div key={system.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{system.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {formatArea(system.area)}
                          </span>
                          <span className="text-sm font-medium">
                            {system.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <Progress value={system.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Custos</CardTitle>
            </div>
            <CardDescription>
              Distribuição de custos por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrencyCompact(stats.totalCosts || 0)}
                </div>
                <div className="text-xs text-muted-foreground">Custo total</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrencyCompact(costPerHectare)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Custo por hectare
                </div>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              {sortedCostCategories.slice(0, 5).map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm">
                      {formatCurrencyCompact(category.cost)}
                    </span>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    {category.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}