"use client";

import { Tabs, TabsContent, TabsList, TabsTriggerPrimary } from "@/components/ui/tabs";
import { Suspense } from "react";
import { Loader2, Settings, DollarSign, Map, TrendingUp, Receipt, Beef, Activity } from "lucide-react";
import { MobileTabs } from "@/components/ui/mobile-tabs";
import { useIsMobile } from "@/hooks/use-mobile";

// Componentes
import { UnifiedPlantingAreaListing } from "@/components/production/planting-areas/unified-planting-area-listing";
import { UnifiedProductionCostListing } from "@/components/production/costs/unified-production-cost-listing";
import { UnifiedProductivityListing } from "@/components/production/productivity/unified-productivity-listing";
import { UnifiedConfig } from "@/components/production/config/unified-config";
import { LivestockList } from "@/components/production/livestock/livestock-list";
import { LivestockOperationList } from "@/components/production/livestock/livestock-operation-list";
import { UnifiedPricesTab } from "@/components/production/prices/unified-prices-tab";
import type { ProductionPageData } from "@/lib/actions/production/unified-production-actions";

interface ProductionPageClientProps {
  organizationId: string;
  projectionId?: string;
  initialData: ProductionPageData;
}

export function ProductionPageClient({ 
  organizationId,
  projectionId,
  initialData 
}: ProductionPageClientProps) {
  const isMobile = useIsMobile();

  const {
    cultures,
    systems,
    cycles,
    safras,
    plantingAreas,
    productivities,
    productionCosts,
    commodityPrices,
    exchangeRates,
  } = initialData;

  // Extract properties from plantingAreas if available
  const properties = (plantingAreas as any).properties || [];

  // Placeholder data for livestock (if not included in unified action)
  const livestock: any[] = [];
  const operations: any[] = [];

  const tabs = [
    {
      value: "config",
      label: isMobile ? "Config" : "Configurações",
      icon: Settings,
      content: (
        <UnifiedConfig
          key={`unified-config-${organizationId}`}
          cultures={cultures}
          systems={systems}
          cycles={cycles}
          harvests={safras}
          organizationId={organizationId}
        />
      ),
    },
    {
      value: "prices",
      label: "Preços",
      icon: DollarSign,
      content: (
        <UnifiedPricesTab
          key={`unified-prices-tab-${organizationId}`}
          organizationId={organizationId}
          cultures={cultures}
          systems={systems}
          cycles={cycles}
          safras={safras}
          commodityPrices={commodityPrices}
          exchangeRates={exchangeRates}
        />
      ),
    },
    {
      value: "plantingAreas",
      label: isMobile ? "Áreas" : "Áreas de Plantio",
      icon: Map,
      content: (
        <UnifiedPlantingAreaListing
          key={`planting-areas-${organizationId}`}
          plantingAreas={(plantingAreas as any).data || plantingAreas}
          safras={safras}
          properties={properties}
          cultures={cultures}
          systems={systems}
          cycles={cycles}
          organizationId={organizationId}
        />
      ),
    },
    {
      value: "productivity",
      label: "Produtividade",
      icon: TrendingUp,
      content: (
        <UnifiedProductivityListing
          key={`productivity-${organizationId}`}
          productivities={(productivities as any).data || productivities}
          safras={safras}
          properties={properties}
          cultures={cultures}
          systems={systems}
          cycles={cycles}
          organizationId={organizationId}
        />
      ),
    },
    {
      value: "costs",
      label: isMobile ? "Custos" : "Custos de Produção",
      icon: Receipt,
      content: (
        <UnifiedProductionCostListing
          key={`production-costs-${organizationId}`}
          productionCosts={(productionCosts as any).data || productionCosts}
          safras={safras}
          properties={properties}
          cultures={cultures}
          systems={systems}
          cycles={cycles}
          organizationId={organizationId}
        />
      ),
    },
    {
      value: "livestock",
      label: "Rebanho",
      icon: Beef,
      content: (
        <LivestockList
          key={`livestock-${organizationId}`}
          initialLivestock={livestock}
          properties={properties}
          organizationId={organizationId}
        />
      ),
    },
    {
      value: "livestockOperations",
      label: isMobile ? "Operações" : "Operações Pecuárias",
      icon: Activity,
      content: (
        <LivestockOperationList
          key={`livestock-operations-${organizationId}`}
          initialOperations={operations}
          properties={properties}
          harvests={safras}
          organizationId={organizationId}
        />
      ),
    },
  ];

  if (isMobile) {
    return (
      <div className="space-y-4">
        <MobileTabs tabs={tabs} defaultValue="config" />
      </div>
    );
  }

  // Desktop view
  return (
    <div className="-mt-6 -mx-4 md:-mx-6">
      <Tabs defaultValue="config">
        <div className="bg-card border-b overflow-x-auto">
          <div className="container max-w-full px-4 md:px-6 py-2">
            <TabsList className="w-max">
              <TabsTriggerPrimary value="config">
                Configurações
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="prices">
                Preços
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="plantingAreas">
                Áreas de Plantio
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="productivity">
                Produtividade
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="costs">
                Custos de Produção
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="livestock">
                Rebanho
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="livestockOperations">
                Operações Pecuárias
              </TabsTriggerPrimary>
            </TabsList>
          </div>
        </div>

        <div className="p-4 md:p-6 pt-4">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="space-y-4">
                {tab.content}
              </TabsContent>
            ))}
          </Suspense>
        </div>
      </Tabs>
    </div>
  );
}