"use client";

import { FluxoCaixaClient } from "./fluxo-caixa-client";

interface CashFlowProjectionTabProps {
  organizationId: string;
}

export function CashFlowProjectionTab({ organizationId }: CashFlowProjectionTabProps) {
  return (
    <div className="space-y-6 w-full overflow-hidden">
      <FluxoCaixaClient organizationId={organizationId} />
    </div>
  );
}