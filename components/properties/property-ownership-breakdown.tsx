"use client";

import { TooltipProvider } from "@/components/ui/tooltip";

interface PropertyOwnershipBreakdownProps {
  organizationId: string;
}

function PropertyOwnershipBreakdownContent({ organizationId }: PropertyOwnershipBreakdownProps) {
  return (
    <div className="space-y-6">
      {/* Componente vazio - todos os gráficos foram movidos para PropertyAreaDistributionSummaryCard */}
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