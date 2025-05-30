"use client";

import { DebtPositionTab } from "./debt-position-tab";

interface DebtProjectionTabProps {
  organizationId: string;
}

export function DebtProjectionTab({ organizationId }: DebtProjectionTabProps) {
  return (
    <div className="space-y-6 w-full overflow-hidden">
      <DebtPositionTab />
    </div>
  );
}