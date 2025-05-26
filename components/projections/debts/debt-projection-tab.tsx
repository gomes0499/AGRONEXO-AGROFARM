"use client";

import { DebtPositionListing } from "./debt-position-listing";

interface DebtProjectionTabProps {
  organizationId: string;
  activeConfigId: string | null;
}

export function DebtProjectionTab({ organizationId, activeConfigId }: DebtProjectionTabProps) {
  return (
    <div className="space-y-6 w-full overflow-hidden">
      <DebtPositionListing 
        organizationId={organizationId}
        activeConfigId={activeConfigId}
      />
    </div>
  );
}