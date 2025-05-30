"use client";

import { FluxoCaixaTab } from "./fluxo-caixa-tab";

interface CashFlowProjectionTabProps {
  organizationId: string;
}

export function CashFlowProjectionTab({ organizationId }: CashFlowProjectionTabProps) {
  return (
    <div className="space-y-6 w-full overflow-hidden">
      <FluxoCaixaTab organizationId={organizationId} />
    </div>
  );
}