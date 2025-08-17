"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTriggerPrimary,
} from "@/components/ui/tabs";
import { UnifiedPricesListing } from "@/components/production/prices/unified-prices-listing";
import { IndicatorThresholdViewer } from "@/components/indicators/indicator-threshold-viewer";
import { defaultIndicatorConfigs } from "@/schemas/indicators";

interface PremisesPageClientProps {
  organizationId: string;
  projectionId?: string;
  initialData: {
    cultures: any[];
    systems: any[];
    cycles: any[];
    safras: any[];
    commodityPrices: any[];
    exchangeRates: any[];
  };
}

export function PremisesPageClient({
  organizationId,
  projectionId,
  initialData,
}: PremisesPageClientProps) {
  const {
    cultures,
    systems,
    cycles,
    safras,
    commodityPrices = [],
    exchangeRates = [],
  } = initialData;

  // Filter to ensure we only have the correct types
  const EXCHANGE_RATE_TYPES = [
    "DOLAR_ALGODAO",
    "DOLAR_SOJA",
    "DOLAR_MILHO",
    "DOLAR_FECHAMENTO",
  ];

  // Handle both commodityType and tipo_moeda fields for compatibility
  const filteredCommodityPrices = commodityPrices.filter(
    (price) =>
      !EXCHANGE_RATE_TYPES.includes(
        price.commodityType || (price as any).tipo_moeda || ""
      )
  );

  // Exchange rates might come with tipo_moeda or commodity_type field
  const filteredExchangeRates = exchangeRates.filter((rate) => {
    const type =
      rate.commodityType ||
      (rate as any).tipo_moeda ||
      (rate as any).commodity_type ||
      "";
    return EXCHANGE_RATE_TYPES.includes(type);
  });

  if (!organizationId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        ID da organização não fornecido.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <Tabs defaultValue="prices" className="w-full">
        <TabsList>
          <TabsTriggerPrimary value="prices">
            Preços e Cotações
          </TabsTriggerPrimary>
          <TabsTriggerPrimary value="thresholds">
            Limiares de Indicadores
          </TabsTriggerPrimary>
        </TabsList>

        <TabsContent value="prices" className="mt-6">
          <UnifiedPricesListing
            commodityPrices={filteredCommodityPrices}
            exchangeRates={filteredExchangeRates}
            organizationId={organizationId}
            cultures={cultures}
            systems={systems}
            cycles={cycles}
            safras={safras}
            projectionId={projectionId}
          />
        </TabsContent>

        <TabsContent value="thresholds" className="mt-6">
          <IndicatorThresholdViewer
            indicatorConfigs={defaultIndicatorConfigs}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
