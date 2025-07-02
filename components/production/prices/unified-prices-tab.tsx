"use client";

import React from "react";
import { UnifiedPricesListing } from "./unified-prices-listing";
import type { CommodityPriceType } from "@/schemas/indicators/prices";

type UnifiedPricesTabProps = {
  commodityPrices: CommodityPriceType[] | undefined;
  exchangeRates: CommodityPriceType[] | undefined;
  organizationId?: string;
  cultures?: Array<{ id: string; nome: string }>;
  systems?: Array<{ id: string; nome: string }>;
  cycles?: Array<{ id: string; nome: string }>;
  safras?: Array<{ id: string; nome: string; ano_inicio: number; ano_fim: number }>;
  projectionId?: string;
};

export function UnifiedPricesTab({
  commodityPrices = [],
  exchangeRates = [],
  organizationId,
  cultures = [],
  systems = [],
  cycles = [],
  safras = [],
  projectionId,
}: UnifiedPricesTabProps) {

  if (!organizationId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        ID da organização não fornecido.
      </div>
    );
  }

  // Filter to ensure we only have the correct types
  const EXCHANGE_RATE_TYPES = ["DOLAR_ALGODAO", "DOLAR_SOJA", "DOLAR_MILHO", "DOLAR_FECHAMENTO"];
  
  // Handle both commodityType and tipo_moeda fields for compatibility
  const filteredCommodityPrices = commodityPrices.filter(
    price => !EXCHANGE_RATE_TYPES.includes(price.commodityType || (price as any).tipo_moeda || "")
  );
  
  // Exchange rates might come with tipo_moeda or commodity_type field
  const filteredExchangeRates = exchangeRates.filter(
    rate => {
      const type = rate.commodityType || (rate as any).tipo_moeda || (rate as any).commodity_type || "";
      return EXCHANGE_RATE_TYPES.includes(type);
    }
  );

  return (
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
  );
}
