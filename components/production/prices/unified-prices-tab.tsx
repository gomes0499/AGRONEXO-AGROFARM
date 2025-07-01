"use client";

import React from "react";
import { UnifiedPricesListing } from "./unified-prices-listing";
import type { CommodityPriceType } from "@/schemas/indicators/prices";

type UnifiedPricesTabProps = {
  commodityPrices: CommodityPriceType[] | undefined;
  exchangeRates: CommodityPriceType[] | undefined;
  organizationId?: string;
  cultures?: Array<{ id: string; nome: string }>;
  safras?: Array<{ id: string; nome: string; ano_inicio: number; ano_fim: number }>;
};

export function UnifiedPricesTab({
  commodityPrices = [],
  exchangeRates = [],
  organizationId,
  cultures = [],
  safras = [],
}: UnifiedPricesTabProps) {

  if (!organizationId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        ID da organização não fornecido.
      </div>
    );
  }

  // Filter to ensure we only have the correct types
  const EXCHANGE_RATE_TYPES = ["DOLAR_ALGODAO", "DOLAR_SOJA", "DOLAR_FECHAMENTO"];
  
  const filteredCommodityPrices = commodityPrices.filter(
    price => !EXCHANGE_RATE_TYPES.includes(price.commodityType)
  );
  
  const filteredExchangeRates = exchangeRates.filter(
    rate => EXCHANGE_RATE_TYPES.includes(rate.commodityType)
  );

  return (
    <UnifiedPricesListing
      commodityPrices={filteredCommodityPrices}
      exchangeRates={filteredExchangeRates}
      organizationId={organizationId}
      cultures={cultures}
      safras={safras}
    />
  );
}
