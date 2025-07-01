"use client";

import { ScenarioProvider } from "@/contexts/scenario-context-v2";
import { DashboardFilterProvider } from "@/components/dashboard/dashboard-filter-provider";
import { Tabs, TabsContent, TabsList, TabsTriggerPrimary } from "@/components/ui/tabs";
import { ChartColorsConfig } from "@/components/dashboard/chart-colors-config";
import { PropertyMapBreakdown } from "@/components/properties/property-map-breakdown";
import { UnderConstruction } from "@/components/shared/under-construction";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { DashboardData } from "@/lib/actions/dashboard/dashboard-actions";

// Import components that will receive data
import { OverviewKpiCards } from "@/components/dashboard/visao-geral/overview-kpi-cards";
import { FinancialKpiCards } from "@/components/dashboard/visao-geral/financial-kpi-cards";
import { FinancialBankDistributionChartClient } from "@/components/dashboard/visao-geral/financial-bank-distribution-chart";
import { FinancialDebtTypeDistributionChart } from "@/components/dashboard/visao-geral/financial-debt-type-distribution-chart";
import { FinancialBankDistributionAllSafrasChart } from "@/components/dashboard/visao-geral/financial-bank-distribution-all-safras-chart";
import { FinancialDebtTypeDistributionAllSafrasChart } from "@/components/dashboard/visao-geral/financial-debt-type-distribution-all-safras-chart";
import { FinancialTotalLiabilitiesChart } from "@/components/dashboard/visao-geral/financial-total-liabilities-chart";
import { ProductionKPICardsClient as ProductionKpiCards } from "@/components/production/stats/production-kpi-cards";
import { AreaPlantadaChartClient as AreaPlantadaChart } from "@/components/production/stats/area-plantada-chart";
import { ProdutividadeChartClient as ProdutividadeChart } from "@/components/production/stats/produtividade-chart";
import { ReceitaChartClient as ReceitaChart } from "@/components/production/stats/receita-chart";
import { FinancialChartClient as FinancialChart } from "@/components/production/stats/financial-chart";
import { FluxoCaixaClient } from "@/components/projections/cash-flow/fluxo-caixa-client";
import { DRETable } from "@/components/projections/dre/dre-table";
import { BalancoPatrimonialTable } from "@/components/projections/balanco/balanco-patrimonial-table";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import { WeatherTickerBar } from "@/components/dashboard/weather-ticker-bar";

interface DashboardClientProps {
  organizationId: string;
  organizationName: string;
  projectionId?: string;
  initialData: DashboardData;
  isSuperAdmin: boolean;
}

export function DashboardClient({
  organizationId,
  organizationName,
  projectionId,
  initialData,
  isSuperAdmin,
}: DashboardClientProps) {
  const { productionConfig } = initialData;
  
  // Extract filter data from production config
  const filterData = {
    properties: productionConfig.properties || [],
    cultures: productionConfig.cultures || [],
    systems: productionConfig.systems || [],
    cycles: productionConfig.cycles || [],
    safras: productionConfig.safras || [],
  };

  return (
    <ScenarioProvider>
      <DashboardFilterProvider
        totalProperties={filterData.properties.length}
        totalCultures={filterData.cultures.length}
        totalSystems={filterData.systems.length}
        totalCycles={filterData.cycles.length}
        totalSafras={filterData.safras.length}
        allPropertyIds={filterData.properties.map((p) => p.id || "")}
        allCultureIds={filterData.cultures.map((c) => c.id || "")}
        allSystemIds={filterData.systems.map((s) => s.id || "")}
        allCycleIds={filterData.cycles.map((c) => c.id || "")}
        allSafraIds={filterData.safras.map((s) => s.id || "")}
      >
        <Tabs defaultValue="properties">
          <div className="border-b">
            <div className="w-full px-6 py-3 flex justify-between items-center">
              <TabsList>
                <TabsTriggerPrimary value="properties">
                  Propriedades
                </TabsTriggerPrimary>
                <TabsTriggerPrimary value="production">
                  Produção
                </TabsTriggerPrimary>
                <TabsTriggerPrimary value="financial">
                  Financeiro
                </TabsTriggerPrimary>
                <TabsTriggerPrimary value="projections">
                  Fluxo de Caixa
                </TabsTriggerPrimary>
                <TabsTriggerPrimary value="dre">
                  DRE
                </TabsTriggerPrimary>
                <TabsTriggerPrimary value="balanco">
                  Balanço Patrimonial
                </TabsTriggerPrimary>
              </TabsList>
              <ChartColorsConfig />
            </div>
          </div>

          <main className="flex-1 p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <OverviewKpiCards
                organizationId={organizationId}
                projectionId={projectionId}
                initialData={{
                  properties: [],
                  propertyStats: [],
                  sicarData: {
                    totalArea: 0,
                    totalModulosFiscais: 0,
                    totalReservaLegal: 0,
                    totalRecursosHidricos: 0,
                    totalAreaProtegida: 0,
                    percentualReservaLegal: 0,
                    percentualRecursosHidricos: 0,
                    percentualAreaProtegida: 0
                  },
                  productionData: null,
                  financialData: null,
                  extendedFinancialData: {
                    lucroLiquido: 0,
                    dividaTotal: 0,
                    dividaPorSafra: 0,
                    dividaReceita: null,
                    dividaEbitda: null,
                    dividaLucroLiquido: null,
                    dividaLiquidaReceita: null,
                    dividaLiquidaEbitda: null,
                    dividaLiquidaLucroLiquido: null
                  }
                }}
              />
            </TabsContent>

            {/* Properties Tab */}
            <TabsContent value="properties" className="space-y-6">
              <PropertyMapBreakdown 
                organizationId={organizationId}
              />
            </TabsContent>

            {/* Production Tab */}
            <TabsContent value="production" className="space-y-6">
              <ProductionKpiCards
                organizationId={organizationId}
                cultures={initialData.productionConfig.cultures}
                safras={initialData.productionConfig.safras}
                initialStats={initialData.productionStats}
                defaultCultureIds={initialData.productionConfig.cultures.map(c => c.id)}
              />
              
              <div className="grid gap-4 md:grid-cols-2">
                <AreaPlantadaChart
                  organizationId={organizationId}
                  initialData={{ 
                    chartData: [],
                    culturaColors: {},
                    safras: initialData.productionConfig.safras 
                  }}
                />
                <ProdutividadeChart
                  organizationId={organizationId}
                  initialData={{
                    chartData: [],
                    culturaColors: {},
                    safras: initialData.productionConfig.safras
                  }}
                />
                <ReceitaChart
                  organizationId={organizationId}
                  initialData={{
                    chartData: [],
                    culturaColors: {},
                    safras: initialData.productionConfig.safras
                  }}
                />
                <FinancialChart
                  organizationId={organizationId}
                  initialData={{
                    chartData: [],
                    safras: initialData.productionConfig.safras
                  }}
                />
              </div>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-6">
              <FinancialKpiCards
                organizationId={organizationId}
                initialData={initialData.financialKpis}
              />

              <div className="grid gap-4 lg:grid-cols-2">
                <FinancialBankDistributionChartClient
                  organizationId={organizationId}
                  projectionId={projectionId}
                  initialData={initialData.bankDistribution.data}
                  initialYearUsed={initialData.bankDistribution.yearUsed}
                  initialSafraName={initialData.bankDistribution.safraName}
                />
                <FinancialDebtTypeDistributionChart
                  organizationId={organizationId}
                  projectionId={projectionId}
                  initialData={initialData.debtTypeDistribution}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <FinancialBankDistributionAllSafrasChart
                  organizationId={organizationId}
                  projectionId={projectionId}
                  initialData={initialData.bankDistributionAllSafras}
                />
                <FinancialDebtTypeDistributionAllSafrasChart
                  organizationId={organizationId}
                  projectionId={projectionId}
                  initialData={initialData.debtTypeDistributionAllSafras}
                />
              </div>

              <FinancialTotalLiabilitiesChart
                organizationId={organizationId}
                projectionId={projectionId}
                initialData={initialData.totalLiabilities}
              />
            </TabsContent>

            {/* Cash Flow Tab */}
            <TabsContent value="projections" className="space-y-6">
              <FluxoCaixaClient
                organizationId={organizationId}
                cashFlowData={initialData.cashFlowSummary as any}
                cashPolicy={null}
              />
            </TabsContent>

            {/* DRE Tab */}
            <TabsContent value="dre" className="space-y-6">
              <DRETable
                organizationId={organizationId}
                initialData={initialData.dreSummary}
              />
            </TabsContent>

            {/* Balance Sheet Tab */}
            <TabsContent value="balanco" className="space-y-6">
              <BalancoPatrimonialTable
                organizationId={organizationId}
                initialData={initialData.balanceSummary as any}
              />
            </TabsContent>
          </main>
        </Tabs>
      </DashboardFilterProvider>
    </ScenarioProvider>
  );
}