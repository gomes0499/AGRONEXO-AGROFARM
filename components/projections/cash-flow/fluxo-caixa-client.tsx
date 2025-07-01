"use client";

import { FluxoCaixaTable } from "./fluxo-caixa-table";
import { EmptyState } from "@/components/shared/empty-state";
import { TrendingUp } from "lucide-react";
import { type FluxoCaixaCorrigidoData } from "@/lib/actions/projections-actions/fluxo-caixa-corrigido";
import { type getCashPolicyConfig } from "@/lib/actions/financial-actions/cash-policy-actions";

interface FluxoCaixaClientProps {
  organizationId: string;
  cashFlowData?: FluxoCaixaCorrigidoData;
  cashPolicy?: Awaited<ReturnType<typeof getCashPolicyConfig>>;
}

export function FluxoCaixaClient({ 
  organizationId, 
  cashFlowData,
  cashPolicy
}: FluxoCaixaClientProps) {
  if (!cashFlowData || cashFlowData.anos.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-10 w-10 text-muted-foreground" />}
        title="Nenhum fluxo de caixa disponível"
        description="Não há dados suficientes para gerar o fluxo de caixa. Verifique se há projeções de culturas cadastradas."
      />
    );
  }

  return <FluxoCaixaTable data={cashFlowData} />;
}
