"use client";

import { ProductionKpiCards } from "./production-kpi-cards";

interface ProductionKpiCardsClientProps {
  organizationId: string;
  propertyIds?: string[];
  safraId?: string;
  onSafraChange?: (safraId: string) => void;
  cultures?: { id: string; nome: string }[];
  selectedCultureIds?: string[];
  onCultureChange?: (cultureIds: string[]) => void;
}

export function ProductionKpiCardsClient({ 
  organizationId, 
  propertyIds,
  safraId,
  onSafraChange,
  cultures,
  selectedCultureIds,
  onCultureChange
}: ProductionKpiCardsClientProps) {
  return (
    <ProductionKpiCards
      organizationId={organizationId}
      propertyIds={propertyIds}
      safraId={safraId}
      onSafraChange={onSafraChange}
      cultures={cultures}
      selectedCultureIds={selectedCultureIds}
      onCultureChange={onCultureChange}
    />
  );
}