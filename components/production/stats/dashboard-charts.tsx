"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { formatArea } from "@/lib/utils/formatters";
import { ProductionStats } from "@/components/dashboard/production-dashboard";

interface DashboardChartsProps {
  stats: ProductionStats;
  formatCurrencyCompact: (value: number) => string;
}

export function DashboardCharts({ stats, formatCurrencyCompact }: DashboardChartsProps) {
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
    <div className="grid gap-6 md:grid-cols-2 mt-8">
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
  );
}