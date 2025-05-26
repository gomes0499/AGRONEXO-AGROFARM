"use client";

import { CashFlowListing } from "./cash-flow-listing";

interface CashFlowProjectionTabProps {
  organizationId: string;
  activeConfigId: string | null;
}

export function CashFlowProjectionTab({ organizationId, activeConfigId }: CashFlowProjectionTabProps) {
  return (
    <div className="space-y-6 w-full overflow-hidden">
      <CashFlowListing 
        organizationId={organizationId}
        activeConfigId={activeConfigId}
      />
    </div>
  );
}