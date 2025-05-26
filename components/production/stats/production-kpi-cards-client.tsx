"use client";

import { ProductionKpiCards } from "./production-kpi-cards";

interface ProductionKpiCardsClientProps {
  organizationId: string;
  propertyIds?: string[];
  safraId?: string;
}

export function ProductionKpiCardsClient({ 
  organizationId, 
  propertyIds,
  safraId 
}: ProductionKpiCardsClientProps) {
  return (
    <ProductionKpiCards
      organizationId={organizationId}
      propertyIds={propertyIds}
      safraId={safraId}
    />
  );
}