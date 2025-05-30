"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/components/auth/organization-provider";
import { getDebtPosition, ConsolidatedDebtPosition } from "@/lib/actions/debt-position-actions";
import { DebtPositionTable } from "./debt-position-table";
import { EmptyState } from "@/components/shared/empty-state";
import { TrendingDown } from "lucide-react";

export function DebtPositionTab() {
  const { organization } = useOrganization();
  const [debtPosition, setDebtPosition] = useState<ConsolidatedDebtPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDebtPosition = async () => {
      if (!organization?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log("🔄 Carregando posição de dívida para organização:", organization.id);
        
        if (!organization.id) {
          throw new Error("ID da organização não está disponível");
        }
        
        const data = await getDebtPosition(organization.id);
        
        console.log("✅ Posição de dívida carregada:", data);
        setDebtPosition(data);
      } catch (err) {
        console.error("❌ Erro ao carregar posição de dívida:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido ao carregar dados";
        console.error("❌ Detalhes do erro:", err);
        setError(`Erro ao buscar dados da posição de dívida: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    loadDebtPosition();
  }, [organization?.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<TrendingDown className="h-10 w-10 text-destructive" />}
        title="Erro ao carregar posição de dívida"
        description={error}
      />
    );
  }

  if (!debtPosition || debtPosition.anos.length === 0) {
    return (
      <EmptyState
        icon={<TrendingDown className="h-10 w-10 text-muted-foreground" />}
        title="Nenhuma posição de dívida disponível"
        description="Não há dados suficientes para gerar a posição de dívida. Verifique se há dados financeiros cadastrados."
      />
    );
  }

  return (
    <DebtPositionTable
      dividas={debtPosition.dividas}
      ativos={debtPosition.ativos}
      indicadores={debtPosition.indicadores}
      anos={debtPosition.anos}
    />
  );
}