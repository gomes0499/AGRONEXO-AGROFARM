"use client";

import { Tabs, TabsContent, TabsList, TabsTriggerPrimary } from "@/components/ui/tabs";
import { UnderConstruction } from "@/components/shared/under-construction";
import { PropertyMapBreakdown } from "@/components/properties/property-map-breakdown";
import { FinancialDashboardSection } from "@/components/dashboard/visao-geral/financial-dashboard-section";
import { OverviewKpiCards } from "@/components/dashboard/visao-geral/overview-kpi-cards";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FluxoCaixaClient } from "@/components/projections/cash-flow/fluxo-caixa-client";
import { useScenario } from "@/contexts/scenario-context-v2";
import { DRESectionRefactored } from "@/components/dashboard/visao-geral/dre-section";
import { BalancoSectionRefactored } from "@/components/dashboard/visao-geral/balanco-section";
import { ProductionKPICardsClient } from "@/components/production/stats/production-kpi-cards";
import { ChartColorsConfig } from "@/components/dashboard/chart-colors-config";

interface DashboardWithScenariosProps {
  organizationId: string;
  organizationName: string;
  filterData: any;
  latestPrice: any;
  projectionId?: string;
}

export function DashboardWithScenarios({
  organizationId,
  organizationName,
  filterData,
  latestPrice,
  projectionId,
}: DashboardWithScenariosProps) {
  return (
    <div>
      {/* Tabs Navigation - logo abaixo do site header */}
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
          <TabsContent value="overview" className="space-y-4">
            <Suspense
              fallback={
                <Card>
                  <div className="h-80 bg-muted rounded-lg animate-pulse" />
                </Card>
              }
            >
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
            </Suspense>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <Suspense
              fallback={
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-80 bg-muted rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              }
            >
              <PropertyMapBreakdown organizationId={organizationId} />
            </Suspense>
          </TabsContent>

          <TabsContent value="production" className="space-y-6">
            <Suspense
              fallback={
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="h-6 bg-muted rounded w-48 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-64 animate-pulse" />
                    </div>
                    <div className="h-10 w-48 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                </div>
              }
            >
              <ProductionKPICardsClient
                organizationId={organizationId}
                cultures={filterData.cultures || []}
                safras={filterData.safras || []}
                initialStats={{}}
                defaultCultureIds={filterData.cultures?.map((c: any) => c.id) || []}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <Suspense
              fallback={
                <div className="space-y-6">
                  <Card>
                    <div className="h-80 bg-muted rounded-lg animate-pulse" />
                  </Card>
                </div>
              }
            >
              <FinancialDashboardSection
                organizationId={organizationId}
                projectionId={projectionId}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <h2 className="text-2xl font-bold">Patrimonial</h2>
            <UnderConstruction
              variant="coming-soon"
              showBackButton={false}
              message="Permitira a visualização de dados estatísticos de todos os máquinas, equipamentos, veículos e outros ativos."
            />
          </TabsContent>

          <TabsContent value="projections" className="space-y-6">
            <Suspense
              fallback={
                <Card>
                  <div className="h-80 bg-muted rounded-lg animate-pulse" />
                </Card>
              }
            >
              <div className="mb-4">
                {organizationId && (
                  <FluxoCaixaClient
                    organizationId={organizationId}
                    projectionId={projectionId}
                    cashFlowData={undefined}
                    cashPolicy={null}
                  />
                )}
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="dre" className="space-y-6">
            <Suspense
              fallback={
                <Card>
                  <div className="h-80 bg-muted rounded-lg animate-pulse" />
                </Card>
              }
            >
              <DRESectionRefactored
                organizationId={organizationId}
                projectionId={projectionId}
                initialData={null}
                error={null}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="balanco" className="space-y-6">
            <Suspense
              fallback={
                <Card>
                  <div className="h-80 bg-muted rounded-lg animate-pulse" />
                </Card>
              }
            >
              <BalancoSectionRefactored
                organizationId={organizationId}
                projectionId={projectionId}
                initialData={null}
                error={null}
              />
            </Suspense>
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}
