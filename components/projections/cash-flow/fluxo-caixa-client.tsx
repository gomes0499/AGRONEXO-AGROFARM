"use client";

import { useState, useEffect } from "react";
import { FluxoCaixaTable } from "./fluxo-caixa-table";
import { EmptyState } from "@/components/shared/empty-state";
import { TrendingUp } from "lucide-react";
import { type FluxoCaixaData } from "@/lib/actions/projections-actions/fluxo-caixa-simplificado";
import { type getCashPolicyConfig } from "@/lib/actions/financial-actions/cash-policy-actions";
import { getFluxoCaixaSimplificado } from "@/lib/actions/projections-actions/fluxo-caixa-simplificado";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { DollarSign } from "lucide-react";

interface FluxoCaixaClientProps {
  organizationId: string;
  projectionId?: string;
  cashFlowData?: FluxoCaixaData;
  cashPolicy?: Awaited<ReturnType<typeof getCashPolicyConfig>>;
  onConfigureCashPolicy?: () => void;
}

export function FluxoCaixaClient({ 
  organizationId, 
  projectionId,
  cashFlowData: initialData,
  cashPolicy,
  onConfigureCashPolicy
}: FluxoCaixaClientProps) {
  const [cashFlowData, setCashFlowData] = useState<FluxoCaixaData | undefined>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCashFlowData() {
      if (!organizationId) return;
      
      // Se tem initialData e não tem projectionId, usar os dados iniciais
      if (initialData && !projectionId) {
        setCashFlowData(initialData);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Sempre usar getFluxoCaixaSimplificado, passando projectionId quando disponível
        const data = await getFluxoCaixaSimplificado(organizationId, projectionId);
        
        setCashFlowData(data);
      } catch (err) {
        console.error('Erro ao carregar fluxo de caixa:', err);
        setError('Erro ao carregar dados do fluxo de caixa');
      } finally {
        setLoading(false);
      }
    }

    loadCashFlowData();
  }, [organizationId, projectionId, initialData]);
  if (loading) {
    return (
      <Card className="shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeaderPrimary
          icon={<DollarSign className="h-4 w-4" />}
          title="Fluxo de Caixa Projetado"
          description="Análise consolidada de receitas, despesas e fluxo de caixa"
        />
        <CardContent className="p-6">
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-10 w-10 text-muted-foreground" />}
        title="Erro ao carregar fluxo de caixa"
        description={error}
      />
    );
  }

  if (!cashFlowData || cashFlowData.anos.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-10 w-10 text-muted-foreground" />}
        title="Nenhum fluxo de caixa disponível"
        description="Não há dados suficientes para gerar o fluxo de caixa. Verifique se há projeções de culturas cadastradas."
      />
    );
  }

  return <FluxoCaixaTable data={cashFlowData} cashPolicy={cashPolicy} organizationId={organizationId} onConfigureCashPolicy={onConfigureCashPolicy} />;
}
