"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { PropertyValueChartClient } from "./property-value-chart-client";

interface PropertyOwnershipBreakdownProps {
  organizationId: string;
}

function PropertyOwnershipBreakdownContent({ organizationId }: PropertyOwnershipBreakdownProps) {
  return (
    <div className="space-y-6">
      {/* Gráfico de Valor por Propriedade */}
      <PropertyValueChartClient organizationId={organizationId} />
    </div>
  );
}

export function PropertyOwnershipBreakdown({ organizationId }: PropertyOwnershipBreakdownProps) {
  return (
    <TooltipProvider>
      <PropertyOwnershipBreakdownContent organizationId={organizationId} />
    </TooltipProvider>
  );
}