"use client";

import { ScenarioProvider } from "@/contexts/scenario-context-v2";
import { DashboardFilterProvider } from "@/components/dashboard/dashboard-filter-provider";
import { Tabs, TabsContent, TabsList, TabsTriggerPrimary } from "@/components/ui/tabs";
import { ChartColorsConfig } from "@/components/dashboard/chart-colors-config";
import { PropertyMapBreakdown } from "@/components/properties/property-map-breakdown";
import { UnderConstruction } from "@/components/shared/under-construction";
import { Suspense, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { DashboardData } from "@/lib/actions/dashboard/dashboard-actions";

// Import components that will receive data
import { OverviewKpiCards } from "@/components/dashboard/visao-geral/overview-kpi-cards";
import { FinancialKpiCards } from "@/components/dashboard/visao-geral/financial-kpi-cards";
import { ProductionKPICardsClient as ProductionKpiCards } from "@/components/production/stats/production-kpi-cards";
import { AreaPlantadaChartClient as AreaPlantadaChart } from "@/components/production/stats/area-plantada-chart";
import { ProdutividadeChartClient as ProdutividadeChart } from "@/components/production/stats/produtividade-chart";
import { ReceitaChartClient as ReceitaChart } from "@/components/production/stats/receita-chart";
import { FinancialChartClient as FinancialChart } from "@/components/production/stats/financial-chart";
import { DREStyled } from "@/components/projections/dre/dre-styled";
import { BalancoStyled } from "@/components/projections/balanco/balanco-styled";
import { CultureProjectionsTable } from "@/components/projections/cultures/culture-projections-table";
import { DebtPositionTable } from "@/components/projections/debts/debt-position-table";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import { WeatherTickerBar } from "@/components/dashboard/weather-ticker-bar";
import { CashPolicyConfig } from "@/components/dashboard/visao-geral/cash-policy-config";
import { ProjectionsOverview } from "@/components/dashboard/projections/projections-overview";
import { DebtEvolutionChart } from "@/components/dashboard/visao-geral/debt-evolution-chart";
import { BankDebtWaterfallChart } from "@/components/dashboard/visao-geral/bank-debt-waterfall-chart";
import { BankRankingChart } from "@/components/dashboard/visao-geral/bank-ranking-chart";
import { DebtBySafraCharts } from "@/components/dashboard/visao-geral/debt-by-safra-charts";
import { FinancialIndicatorsEvolutionChart } from "@/components/dashboard/visao-geral/financial-indicators-evolution-chart";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

interface DashboardClientProps {
  organizationId: string;
  organizationName: string;
  projectionId?: string;
  initialData: DashboardData;
  isSuperAdmin: boolean;
  cashPolicy?: any;
}

export function DashboardClient({
  organizationId,
  organizationName,
  projectionId,
  initialData,
  isSuperAdmin,
  cashPolicy,
}: DashboardClientProps) {
  const { productionConfig } = initialData;
  
  // State para safra selecionada na aba financeiro
  const defaultFinancialSafraId = productionConfig.safras?.find(s => s.nome === "2025/26")?.id || "";
  const [selectedFinancialSafraId, setSelectedFinancialSafraId] = useState<string>(defaultFinancialSafraId);
  
  // State para configuração de política de caixa
  const [isCashPolicyOpen, setIsCashPolicyOpen] = useState(false);
  
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
                  Indicadores
                </TabsTriggerPrimary>
                <TabsTriggerPrimary value="projections-overview">
                  Projeções
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
                projectionId={projectionId}
                cultures={initialData.productionConfig.cultures}
                safras={initialData.productionConfig.safras}
                initialStats={initialData.productionStats}
                defaultCultureIds={initialData.productionConfig.cultures.map(c => c.id)}
              />
              
              <AreaPlantadaChart
                organizationId={organizationId}
                projectionId={projectionId}
                initialData={{ 
                  chartData: [],
                  culturaColors: {},
                  safras: initialData.productionConfig.safras 
                }}
              />
              
              <ProdutividadeChart
                organizationId={organizationId}
                projectionId={projectionId}
                initialData={{
                  chartData: [],
                  culturaColors: {},
                  safras: initialData.productionConfig.safras
                }}
              />
              
              <ReceitaChart
                organizationId={organizationId}
                projectionId={projectionId}
                initialData={{
                  chartData: [],
                  culturaColors: {},
                  safras: initialData.productionConfig.safras
                }}
              />
              
              <FinancialChart
                organizationId={organizationId}
                projectionId={projectionId}
                initialData={{
                  chartData: [],
                  safras: initialData.productionConfig.safras
                }}
              />
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-6">
              <FinancialKpiCards
                organizationId={organizationId}
                projectionId={projectionId}
                initialData={initialData.financialKpis}
                selectedSafraId={selectedFinancialSafraId}
                onSafraChange={setSelectedFinancialSafraId}
              />

              <DebtEvolutionChart
                organizationId={organizationId}
                projectionId={projectionId}
              />

              <BankDebtWaterfallChart
                organizationId={organizationId}
                projectionId={projectionId}
              />

              <BankRankingChart
                organizationId={organizationId}
                projectionId={projectionId}
              />

              <DebtBySafraCharts
                organizationId={organizationId}
                selectedSafraId={selectedFinancialSafraId}
                projectionId={projectionId}
              />

              <FinancialIndicatorsEvolutionChart
                organizationId={organizationId}
                projectionId={projectionId}
              />
            </TabsContent>

            {/* Projections Overview Tab */}
            <TabsContent value="projections-overview" className="space-y-6">
              <ProjectionsOverview
                organizationId={organizationId}
                projectionId={projectionId}
                safras={filterData.safras}
                cultures={filterData.cultures}
                properties={filterData.properties}
              />
            </TabsContent>


            {/* DRE Tab */}
            <TabsContent value="dre" className="space-y-6">
              <DREStyled
                organizationId={organizationId}
                projectionId={projectionId}
              />
            </TabsContent>

            {/* Balance Sheet Tab */}
            <TabsContent value="balanco" className="space-y-6">
              <BalancoStyled
                organizationId={organizationId}
                projectionId={projectionId}
              />
            </TabsContent>
          </main>
        </Tabs>
      </DashboardFilterProvider>
    </ScenarioProvider>
  );
}