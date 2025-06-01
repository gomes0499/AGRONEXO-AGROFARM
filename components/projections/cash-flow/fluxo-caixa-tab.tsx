"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/components/auth/organization-provider";
import { FluxoCaixaTable } from "./fluxo-caixa-table";
import { EmptyState } from "@/components/shared/empty-state";
import { TrendingUp, Loader2 } from "lucide-react";
import { FluxoCaixaData } from "@/lib/actions/projections-actions/fluxo-caixa-simplificado";

interface FluxoCaixaTabProps {
  organizationId: string;
}

export function FluxoCaixaTab({ organizationId }: FluxoCaixaTabProps) {
  const { organization } = useOrganization();
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFluxoCaixa = async () => {
      if (!organization?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Importação dinâmica para evitar problemas
        const { getFluxoCaixaSimplificado } = await import(
          "@/lib/actions/projections-actions/fluxo-caixa-simplificado"
        );

        const data = await getFluxoCaixaSimplificado(organization.id);

        setFluxoCaixa(data);
      } catch (err) {
        console.error("❌ Erro ao carregar fluxo de caixa:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro desconhecido ao carregar dados";
        console.error("❌ Detalhes do erro:", err);
        setError(`Erro ao buscar dados do fluxo de caixa: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    loadFluxoCaixa();
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
        icon={<TrendingUp className="h-10 w-10 text-destructive" />}
        title="Erro ao carregar fluxo de caixa"
        description={error}
      />
    );
  }

  if (!fluxoCaixa || fluxoCaixa.anos.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-10 w-10 text-muted-foreground" />}
        title="Nenhum fluxo de caixa disponível"
        description="Não há dados suficientes para gerar o fluxo de caixa. Verifique se há projeções de culturas cadastradas."
      />
    );
  }

  return <FluxoCaixaTable data={fluxoCaixa} />;
}
