"use client";

import { useState, useEffect } from "react";
import { FluxoCaixaTable } from "./fluxo-caixa-table";
import { EmptyState } from "@/components/shared/empty-state";
import { TrendingUp, Loader2 } from "lucide-react";
import { FluxoCaixaData } from "@/lib/actions/projections-actions/fluxo-caixa-simplificado";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { Card, CardContent } from "@/components/ui/card";

interface FluxoCaixaClientProps {
  organizationId: string;
}

export function FluxoCaixaClient({ organizationId }: FluxoCaixaClientProps) {
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFluxoCaixa = async () => {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { getFluxoCaixaSimplificado } = await import(
          "@/lib/actions/projections-actions/fluxo-caixa-simplificado"
        );

        const data = await getFluxoCaixaSimplificado(organizationId);

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
  }, [organizationId]);

  if (loading) {
    return (
      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<TrendingUp className="h-4 w-4" />}
          title="Fluxo de Caixa Projetado"
          description="Carregando dados..."
        />
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
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
