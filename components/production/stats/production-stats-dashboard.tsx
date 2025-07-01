"use client";

import { Suspense } from "react";
import { StatsCard } from "./stats-card";
import { StatsGroup } from "./stats-group";
import { DashboardCharts } from "./dashboard-charts";
import { PropertyFilterClient } from "@/components/production/property-filter-client";
import { ProductionKPICardsClient as ProductionKpiCards } from "./production-kpi-cards";
import { formatCurrency } from "@/lib/utils/formatters";
import { formatCompactCurrency, formatCompactNumber } from "@/lib/utils";
import { LandPlot, LineChart, Beef, DollarSign, Warehouse } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface Property {
  id: string;
  organizacao_id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  areaTotal?: number;
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

// Defina um tipo para os itens de produtividade:
export interface ProductivityByCultureAndSystem {
  produtividade: number;
  unidade: string;
  cultura: string;
  sistema: string;
  // adicione outros campos se necessário
}

// E use na interface principal:
export interface ProductionStats {
  totalPlantingArea: number;
  areasByCulture: Record<string, number>;
  areasBySystem: Record<string, number>;
  areasByCycle: Record<string, number>;
  productivityByCultureAndSystem: ProductivityByCultureAndSystem[];
  costsByCategory: Record<string, number>;
  costsByCulture: Record<string, number>;
  costsBySystem: Record<string, number>;
  totalCosts: number;
}

interface ProductionStatsDashboardProps {
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
  organizationId: string;
  safraId?: string;
  culturaId?: string;
}

export function ProductionStatsDashboard({
  stats,
  cultures,
  formattedProperties,
  defaultSelectedPropertyIds,
  totalAnimals,
  totalLivestockValue,
  trends,
  organizationId,
  safraId,
  culturaId,
}: ProductionStatsDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Estatísticas de Produção</h2>
          <p className="text-muted-foreground dark:text-gray-300">
            Resumo dos principais indicadores de produção
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PropertyFilterClient
            properties={formattedProperties}
            defaultSelectedIds={defaultSelectedPropertyIds}
          />
        </div>
      </div>

      {/* KPI Cards no estilo de propriedades */}
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="h-3 bg-muted rounded w-24 mb-2 animate-pulse" />
                    <div className="h-6 bg-muted rounded w-16 mb-2 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-20 animate-pulse" />
                  </div>
                  <div className="p-2 rounded-lg bg-muted animate-pulse">
                    <div className="h-5 w-5 bg-muted-foreground/20 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }>
        <ProductionKpiCards 
          organizationId={organizationId}
          propertyIds={defaultSelectedPropertyIds}
          safraId={safraId}
          cultures={cultures}
          safras={[]}
          initialStats={{}}
          defaultCultureIds={cultures.map(c => c.id)}
        />
      </Suspense>

      {/* Áreas de Plantio */}
      <StatsGroup
        title="Áreas de Plantio"
        viewMoreUrl="/dashboard/production/planting-areas"
      >
        <StatsCard
          title="Área Total Plantada"
          value={formatCompactNumber(stats.totalPlantingArea || 0) + " ha"}
          trend={trends.area}
          icon={<LandPlot className="h-5 w-5 text-muted-foreground/70 dark:text-gray-300" />}
        />

        <StatsCard
          title="Culturas Plantadas"
          value={Object.keys(stats.areasByCulture || {}).length}
          description={
            Object.entries(stats.areasByCulture || {})
              .map(([culture]) => culture)
              .slice(0, 2)
              .join(", ") +
            (Object.keys(stats.areasByCulture || {}).length > 2 ? "..." : "")
          }
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground/70 dark:text-gray-300"
            >
              <path d="M12 2v8"></path>
              <path d="M4 10v12"></path>
              <path d="M20 10v12"></path>
              <path d="M4 22h16"></path>
              <path d="M18 14c-1.5 0-3 .5-3 2s1.5 2 3 2 3-.5 3-2-1.5-2-3-2z"></path>
              <path d="M18 18c-1.5 0-3 .5-3 2s1.5 2 3 2 3-.5 3-2-1.5-2-3-2z"></path>
              <path d="M6 14c1.5 0 3 .5 3 2s-1.5 2-3 2-3-.5-3-2 1.5-2 3-2z"></path>
              <path d="M6 18c1.5 0 3 .5 3 2s-1.5 2-3 2-3-.5-3-2 1.5-2 3-2z"></path>
            </svg>
          }
        />

        <StatsCard
          title="Sistemas de Plantio"
          value={Object.keys(stats.areasBySystem || {}).length}
          description={Object.entries(stats.areasBySystem || {})
            .map(([system]) => system)
            .join(", ")}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground/70 dark:text-gray-300"
            >
              <path d="M12 2v8"></path>
              <path d="M2 12h20"></path>
              <path d="M12 18v4"></path>
            </svg>
          }
        />
      </StatsGroup>

      {/* Produtividade */}
      <StatsGroup
        title="Produtividade"
        viewMoreUrl="/dashboard/production/productivity"
      >
        <StatsCard
          title="Produtividade Média"
          value={
            stats.productivityByCultureAndSystem?.[0]?.produtividade?.toFixed(
              1
            ) || 0
          }
          description={`${
            stats.productivityByCultureAndSystem?.[0]?.unidade || "sc/ha"
          } - Cultura principal`}
          icon={<LineChart className="h-5 w-5 text-muted-foreground/70 dark:text-gray-300" />}
        />

        <StatsCard
          title="Maior Produtividade"
          value={
            stats.productivityByCultureAndSystem
              ?.sort((a: any, b: any) => b.produtividade - a.produtividade)?.[0]
              ?.produtividade?.toFixed(1) || 0
          }
          description={`${
            stats.productivityByCultureAndSystem?.sort(
              (a: any, b: any) => b.produtividade - a.produtividade
            )?.[0]?.cultura || "Cultura"
          } - 
          ${
            stats.productivityByCultureAndSystem?.sort(
              (a: any, b: any) => b.produtividade - a.produtividade
            )?.[0]?.sistema || "Sistema"
          }`}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground/70 dark:text-gray-300"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
          }
        />

        <StatsCard
          title="Registros de Produtividade"
          value={stats.productivityByCultureAndSystem?.length || 0}
          description="Combinações de cultura e sistema"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground/70 dark:text-gray-300"
            >
              <path d="M12.2 8.2L6.2 2h12l-6 6.2z"></path>
              <path d="M12 22V12"></path>
              <path d="M18.2 8.2L6.2 20"></path>
              <path d="M6.2 8.2l12 12"></path>
            </svg>
          }
        />
      </StatsGroup>

      {/* Custos */}
      <StatsGroup
        title="Custos de Produção"
        viewMoreUrl="/dashboard/production/costs"
      >
        <StatsCard
          title="Custo Total"
          value={formatCompactCurrency(stats.totalCosts || 0)}
          trend={{
            value: trends.costs.value,
            positive: trends.costs.positive,
          }}
          icon={<DollarSign className="h-5 w-5 text-muted-foreground/70 dark:text-gray-300" />}
        />

        <StatsCard
          title="Principal Categoria de Custo"
          value={
            Object.entries(stats.costsByCategory || {}).sort(
              (a, b) => b[1] - a[1]
            )[0]?.[0] || "N/A"
          }
          description={formatCompactCurrency(
            Object.entries(stats.costsByCategory || {}).sort(
              (a, b) => b[1] - a[1]
            )[0]?.[1] || 0
          )}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground/70 dark:text-gray-300"
            >
              <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"></path>
              <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1"></path>
            </svg>
          }
        />

        <StatsCard
          title="Categorias de Custo"
          value={Object.keys(stats.costsByCategory || {}).length}
          description="Diferentes categorias de custo"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground/70 dark:text-gray-300"
            >
              <rect width="6" height="16" x="4" y="4" rx="2"></rect>
              <rect width="6" height="9" x="14" y="11" rx="2"></rect>
            </svg>
          }
        />
      </StatsGroup>

      {/* Rebanho */}
      <StatsGroup title="Rebanho" viewMoreUrl="/dashboard/production/livestock">
        <StatsCard
          title="Total de Animais"
          value={formatCompactNumber(totalAnimals || 0)}
          trend={trends.livestock}
          icon={<Beef className="h-5 w-5 text-muted-foreground/70 dark:text-gray-300" />}
        />

        <StatsCard
          title="Valor Total do Rebanho"
          value={formatCompactCurrency(totalLivestockValue || 0)}
          description={`Valor médio por animal: ${formatCompactCurrency(
            (totalLivestockValue || 0) / (totalAnimals || 1)
          )}`}
          icon={<DollarSign className="h-5 w-5 text-muted-foreground/70 dark:text-gray-300" />}
        />

        <StatsCard
          title="Distribuição"
          value="Em propriedades"
          description={`Distribuídos em ${
            formattedProperties?.length || 0
          } propriedades`}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground/70 dark:text-gray-300"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              <path d="M2 12h20"></path>
            </svg>
          }
        />
      </StatsGroup>

      {/* Operações Pecuárias */}
      <StatsGroup
        title="Operações Pecuárias"
        viewMoreUrl="/dashboard/production/livestock-operations"
      >
        <StatsCard
          title="Operações Ativas"
          value={0} // Replace with actual data when available
          description="Em diferentes propriedades"
          icon={<Warehouse className="h-5 w-5 text-muted-foreground/70 dark:text-gray-300" />}
        />

        <StatsCard
          title="Ciclos de Produção"
          value="Diferentes ciclos"
          description="Confinamento e outros"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground/70 dark:text-gray-300"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
          }
        />

        <StatsCard
          title="Volume de Abate"
          value="Variável por safra"
          description="Conforme planejamento anual"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground/70 dark:text-gray-300"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
            </svg>
          }
        />
      </StatsGroup>

      {/* Charts Section */}
      <DashboardCharts
        stats={stats}
        formatCurrencyCompact={formatCurrencyCompact}
      />
    </div>
  );
}
