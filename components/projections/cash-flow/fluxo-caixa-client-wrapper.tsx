"use client";

import { useEffect, useState } from "react";
import { FluxoCaixaTable } from "./fluxo-caixa-table";
import { Loader2 } from "lucide-react";

interface FluxoCaixaClientWrapperProps {
  organizationId: string;
}

export function FluxoCaixaClientWrapper({ organizationId }: FluxoCaixaClientWrapperProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        // Importar a função de forma dinâmica para evitar problemas com await no nível superior
        const { getFluxoCaixaSimplificado } = await import("@/lib/actions/projections-actions/fluxo-caixa-simplificado");
        
        if (!isMounted) return;
        
        const fluxoCaixaData = await getFluxoCaixaSimplificado(organizationId);
        
        if (!isMounted) return;
        
        setData(fluxoCaixaData);
        setError(null);
      } catch (err) {
        console.error("Erro ao carregar dados de fluxo de caixa:", err);
        if (isMounted) {
          setError("Não foi possível carregar os dados de fluxo de caixa");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [organizationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">{error}</p>
        <p className="text-muted-foreground mt-2">
          Verifique se todos os dados de projeção estão cadastrados corretamente.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">
          Nenhum dado de fluxo de caixa disponível.
        </p>
      </div>
    );
  }

  return <FluxoCaixaTable data={data} />;
}