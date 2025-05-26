"use client";

import { useState, useEffect } from "react";
import { ProjectionMetricsCard } from "./projection-metrics-card";
import { useProjectionFiltersRead } from "@/hooks/use-projection-filters-read";
import { getProductionCalculations, type ProductionCalculations } from "@/lib/actions/projections-actions/calculations";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Calculator } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProjectionCalculationsDashboardProps {
  organizationId: string;
}

export function ProjectionCalculationsDashboard({
  organizationId,
}: ProjectionCalculationsDashboardProps) {
  const [calculations, setCalculations] = useState<ProductionCalculations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const filters = useProjectionFiltersRead();

  useEffect(() => {
    async function loadCalculations() {
      try {
        setLoading(true);
        setError(null);
        
        const filtersData = {
          propertyIds: filters.propertyIds.length > 0 ? filters.propertyIds : undefined,
          cultureIds: filters.cultureIds.length > 0 ? filters.cultureIds : undefined,
          systemIds: filters.systemIds.length > 0 ? filters.systemIds : undefined,
          cycleIds: filters.cycleIds.length > 0 ? filters.cycleIds : undefined,
          safraIds: filters.safraIds.length > 0 ? filters.safraIds : undefined,
        };

        const result = await getProductionCalculations(organizationId, filtersData);
        setCalculations(result);
      } catch (err) {
        console.error('Error loading calculations:', err);
        setError('Erro ao carregar cálculos de projeção');
      } finally {
        setLoading(false);
      }
    }

    loadCalculations();
  }, [organizationId, filters]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            <CardTitle>Cálculos de Projeção</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!calculations) {
    return null;
  }

  const {
    totalArea,
    averageProductivity,
    productivityUnit,
    totalProduction,
    averageCostPerHa,
    totalCost,
    averagePrice,
    totalRevenue,
    ebitda,
    ebitdaPercentage,
    sourcesUsed,
  } = calculations;

  const metricsData = [
    {
      title: "Área Plantada",
      value: totalArea,
      unit: "ha",
      description: "Área total baseada nos filtros",
      source: "Dados do módulo produção",
      trend: totalArea > 0 ? "up" : "neutral" as const,
    },
    {
      title: "Produtividade",
      value: averageProductivity,
      unit: productivityUnit,
      description: "Produtividade média ponderada",
      source: "Dados do módulo produção",
      trend: sourcesUsed.hasProductionData ? "up" : "neutral" as const,
    },
    {
      title: "Preço",
      value: averagePrice,
      description: "Preço por unidade de produção",
      source: "Dados do módulo indicadores",
      trend: sourcesUsed.hasPriceData ? "up" : "neutral" as const,
    },
    {
      title: "Produção Total",
      value: totalProduction,
      unit: productivityUnit.split('/')[0], // Ex: "Sc" de "Sc/ha"
      description: "Produção total estimada",
      source: "Calculado",
      formula: "Área × Produtividade",
      trend: totalProduction > 0 ? "up" : "neutral" as const,
    },
    {
      title: "Receita",
      value: totalRevenue,
      description: "Receita bruta estimada",
      source: "Calculado",
      formula: "Área × Produtividade × Preço",
      trend: totalRevenue > 0 ? "up" : "neutral" as const,
    },
    {
      title: "Custo/ha",
      value: averageCostPerHa,
      description: "Custo médio por hectare",
      source: "Dados do módulo produção",
      trend: sourcesUsed.hasCostData ? (averageCostPerHa > 0 ? "down" : "neutral") : "neutral" as const,
    },
    {
      title: "Custo Total",
      value: totalCost,
      description: "Custo total de produção",
      source: "Calculado",
      formula: "Custo/ha × Área",
      trend: totalCost > 0 ? "down" : "neutral" as const,
    },
    {
      title: "EBITDA R$",
      value: ebitda,
      description: "Lucro antes de juros, impostos, depreciação",
      source: "Calculado",
      formula: "Receita - Custo Total",
      trend: ebitda > 0 ? "up" : ebitda < 0 ? "down" : "neutral" as const,
    },
  ];

  // Card especial para EBITDA %
  const ebitdaPercentCard = {
    title: "EBITDA %",
    value: ebitdaPercentage,
    unit: "%",
    description: "Margem EBITDA",
    source: "Calculado",
    formula: "EBITDA ÷ Receita",
    trend: ebitdaPercentage > 0 ? "up" : ebitdaPercentage < 0 ? "down" : "neutral" as const,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            <CardTitle>Cálculos de Projeção</CardTitle>
          </div>
          {!sourcesUsed.hasProductionData && (
            <Alert className="max-w-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Alguns dados de produção podem estar ausentes
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {metricsData.map((metric, index) => (
            <ProjectionMetricsCard
              key={index}
              title={metric.title}
              value={metric.value}
              unit={metric.unit}
              description={metric.description}
              source={metric.source}
              formula={metric.formula}
              trend={metric.trend}
            />
          ))}
          
          {/* Card especial para EBITDA % */}
          <ProjectionMetricsCard
            title={ebitdaPercentCard.title}
            value={ebitdaPercentCard.value}
            unit={ebitdaPercentCard.unit}
            description={ebitdaPercentCard.description}
            source={ebitdaPercentCard.source}
            formula={ebitdaPercentCard.formula}
            trend={ebitdaPercentCard.trend}
            className="md:col-span-2 lg:col-span-1"
          />
        </div>

        {/* Alertas sobre fontes de dados */}
        <div className="mt-6 space-y-2">
          {!sourcesUsed.hasProductionData && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Dados de produtividade não encontrados para a seleção atual. 
                Valores podem estar zerados ou estimados.
              </AlertDescription>
            </Alert>
          )}
          
          {!sourcesUsed.hasPriceData && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Preços não encontrados no módulo de indicadores. 
                Usando valores padrão estimados.
              </AlertDescription>
            </Alert>
          )}
          
          {!sourcesUsed.hasCostData && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Atenção:</strong> Dados de custos de produção não encontrados para a seleção atual. 
                Custos podem estar zerados.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}