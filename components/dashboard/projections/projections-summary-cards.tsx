"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  BarChart3,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils/formatters";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectionsSummaryCardsProps {
  organizationId: string;
  selectedSafras: string[];
  selectedCultures: string[];
}

interface ProjectionMetrics {
  totalRevenue: number;
  totalCost: number;
  totalEbitda: number;
  ebitdaMargin: number;
  totalArea: number;
  avgProductivity: number;
  revenueGrowth: number;
  costGrowth: number;
}

export function ProjectionsSummaryCards({
  organizationId,
  selectedSafras,
  selectedCultures,
}: ProjectionsSummaryCardsProps) {
  const [metrics, setMetrics] = useState<ProjectionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Implementar chamada para API de projeções
    // Por enquanto, vamos usar dados mockados
    setTimeout(() => {
      setMetrics({
        totalRevenue: 137768830,
        totalCost: 84652500,
        totalEbitda: 53116330,
        ebitdaMargin: 38.56,
        totalArea: 17966,
        avgProductivity: 72.5,
        revenueGrowth: 23.4,
        costGrowth: 12.8,
      });
      setIsLoading(false);
    }, 1000);
  }, [organizationId, selectedSafras, selectedCultures]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Receita Total Projetada */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Receita Total Projetada
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(metrics.totalRevenue, 0)}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            {metrics.revenueGrowth > 0 ? (
              <>
                <ArrowUp className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">+{formatPercent(metrics.revenueGrowth)}</span>
              </>
            ) : (
              <>
                <ArrowDown className="h-3 w-3 text-red-600 mr-1" />
                <span className="text-red-600">{formatPercent(metrics.revenueGrowth)}</span>
              </>
            )}
            <span className="ml-1">vs safra anterior</span>
          </div>
        </CardContent>
      </Card>

      {/* Custo Total Projetado */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Custo Total Projetado
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(metrics.totalCost, 0)}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            {metrics.costGrowth > 0 ? (
              <>
                <ArrowUp className="h-3 w-3 text-red-600 mr-1" />
                <span className="text-red-600">+{formatPercent(metrics.costGrowth)}</span>
              </>
            ) : (
              <>
                <ArrowDown className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">{formatPercent(metrics.costGrowth)}</span>
              </>
            )}
            <span className="ml-1">vs safra anterior</span>
          </div>
        </CardContent>
      </Card>

      {/* EBITDA Projetado */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            EBITDA Projetado
          </CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(metrics.totalEbitda, 0)}
          </div>
          <div className="text-xs text-muted-foreground">
            Margem: {formatPercent(metrics.ebitdaMargin)}
          </div>
        </CardContent>
      </Card>

      {/* Área Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Área Projetada
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(metrics.totalArea)} ha
          </div>
          <div className="text-xs text-muted-foreground">
            Produtividade média: {metrics.avgProductivity} sc/ha
          </div>
        </CardContent>
      </Card>
    </div>
  );
}