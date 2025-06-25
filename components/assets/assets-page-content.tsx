"use client";

import { Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { AssetMetrics } from "./asset-metrics";
import { PropertiesListing } from "@/components/assets/properties/properties-listing";
import { EquipmentListing } from "@/components/assets/equipment/equipment-listing";
import { InvestmentListing } from "@/components/assets/investments/investment-listing";
import { AssetSaleListing } from "@/components/assets/asset-sales/asset-sale-listing";
import { LandPlanListing } from "@/components/assets/land-plans/land-plan-listing";

interface AssetsPageContentProps {
  organizationId: string;
  properties: any[];
  equipments: any[];
  investments: any[];
  improvements: any[];
  assetSales: any[];
  landPlans: any[];
}

export function AssetsPageContent({
  organizationId,
  properties,
  equipments,
  investments,
  improvements,
  assetSales,
  landPlans,
}: AssetsPageContentProps) {
  return (
    <div className="-mt-6 -mx-4 md:-mx-6">
      <Tabs defaultValue="properties">
        <div className="bg-muted/50 border-b">
          <div className="container max-w-full px-4 md:px-6 py-2">
            <TabsList className="h-auto bg-transparent border-none rounded-none p-0 gap-1 flex flex-wrap justify-start w-full">
              <TabsTrigger
                value="properties"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Bens Imóveis
              </TabsTrigger>
              <TabsTrigger
                value="equipments"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Equipamentos
              </TabsTrigger>
              <TabsTrigger
                value="investments"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Investimentos
              </TabsTrigger>
              <TabsTrigger
                value="asset-sales"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Vendas de Ativos
              </TabsTrigger>
              <TabsTrigger
                value="land-plans"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Aquisição de Áreas
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="p-4 md:p-6 pt-4">
          {/* Métricas de Patrimônio - Sempre visível */}
          <AssetMetrics 
            properties={properties}
            equipments={equipments}
            investments={investments}
            improvements={improvements}
          />
          
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <TabsContent value="properties" className="space-y-4">
              <PropertiesListing properties={properties || []} organizationId={organizationId} />
            </TabsContent>

            <TabsContent value="equipments" className="space-y-4">
              <EquipmentListing initialEquipments={equipments || []} organizationId={organizationId} />
            </TabsContent>

            <TabsContent value="investments" className="space-y-4">
              <InvestmentListing initialInvestments={investments || []} organizationId={organizationId} />
            </TabsContent>

            <TabsContent value="asset-sales" className="space-y-4">
              <AssetSaleListing initialAssetSales={assetSales || []} organizationId={organizationId} />
            </TabsContent>

            <TabsContent value="land-plans" className="space-y-4">
              <LandPlanListing initialLandPlans={landPlans || []} organizationId={organizationId} />
            </TabsContent>
          </Suspense>
        </div>
      </Tabs>
    </div>
  );
}