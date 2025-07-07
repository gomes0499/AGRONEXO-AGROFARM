"use client";

import { Suspense } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTriggerPrimary,
} from "@/components/ui/tabs";
import {
  Loader2,
  Home,
  Wrench,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
import { MobileTabs } from "@/components/ui/mobile-tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { AssetMetrics } from "./asset-metrics";
import { PropertiesListing } from "@/components/assets/properties/properties-listing";
import { EquipmentListing } from "@/components/assets/equipment/equipment-listing";
import { InvestmentListing } from "@/components/assets/investments/investment-listing";
import { AssetSaleListing } from "@/components/assets/asset-sales/asset-sale-listing";
import type { AssetsPageData } from "@/lib/actions/assets/unified-assets-actions";

interface AssetsPageClientProps {
  organizationId: string;
  properties: any[];
  improvements: any[];
  equipmentList: any[];
  initialData: AssetsPageData;
}

export function AssetsPageClient({
  organizationId,
  properties,
  improvements,
  equipmentList,
  initialData,
}: AssetsPageClientProps) {
  const isMobile = useIsMobile();

  const { assetSales, investments, equipment, safras } = initialData;

  const tabs = [
    {
      value: "properties",
      label: isMobile ? "Imóveis" : "Bens Imóveis",
      icon: Home,
      content: (
        <PropertiesListing
          properties={properties || []}
          organizationId={organizationId}
        />
      ),
    },
    {
      value: "equipments",
      label: "Equipamentos",
      icon: Wrench,
      content: (
        <EquipmentListing
          initialEquipments={equipmentList || []}
          organizationId={organizationId}
        />
      ),
    },
    {
      value: "investments",
      label: "Investimentos",
      icon: TrendingUp,
      content: (
        <InvestmentListing
          initialInvestments={(investments as any).data || investments || []}
          organizationId={organizationId}
          safras={safras || []}
        />
      ),
    },
    {
      value: "asset-sales",
      label: isMobile ? "Vendas" : "Vendas de Ativos",
      icon: ShoppingCart,
      content: (
        <AssetSaleListing
          initialAssetSales={(assetSales as any).data || assetSales || []}
          organizationId={organizationId}
          safras={safras || []}
        />
      ),
    },
  ];

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Métricas de Patrimônio - Sempre visível */}
        <AssetMetrics
          properties={properties}
          equipments={(equipment as any).data || equipment || []}
          investments={(investments as any).data || investments || []}
          improvements={improvements}
        />

        <MobileTabs tabs={tabs} defaultValue="properties" />
      </div>
    );
  }

  // Desktop view
  return (
    <div className="-mt-6 -mx-4 md:-mx-6">
      <Tabs defaultValue="properties">
        <div className="bg-card border-b overflow-x-auto">
          <div className="container max-w-full px-4 md:px-6 py-2">
            <TabsList className="w-max">
              <TabsTriggerPrimary value="properties">
                Bens Imóveis
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="equipments">
                Equipamentos
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="investments">
                Investimentos
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="asset-sales">
                Vendas de Ativos
              </TabsTriggerPrimary>
            </TabsList>
          </div>
        </div>

        <div className="p-4 md:p-6 pt-6">
          {/* Métricas de Patrimônio - Sempre visível */}
          <div className="mb-6">
            <AssetMetrics
              properties={properties}
              equipments={(equipment as any).data || equipment || []}
              investments={(investments as any).data || investments || []}
              improvements={improvements}
            />
          </div>

          <Suspense
            fallback={
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <TabsContent value="properties" className="space-y-4 mt-0">
              <PropertiesListing
                properties={properties || []}
                organizationId={organizationId}
              />
            </TabsContent>

            <TabsContent value="equipments" className="space-y-4">
              <EquipmentListing
                initialEquipments={equipmentList || []}
                organizationId={organizationId}
              />
            </TabsContent>

            <TabsContent value="investments" className="space-y-4">
              <InvestmentListing
                initialInvestments={
                  (investments as any).data || investments || []
                }
                organizationId={organizationId}
                safras={safras || []}
              />
            </TabsContent>

            <TabsContent value="asset-sales" className="space-y-4">
              <AssetSaleListing
                initialAssetSales={(assetSales as any).data || assetSales || []}
                organizationId={organizationId}
                safras={safras || []}
              />
            </TabsContent>
          </Suspense>
        </div>
      </Tabs>
    </div>
  );
}
