"use client";

import { useState, useEffect } from "react";
import { CashProjectionListing } from "./cash-projection-listing";
import { getProjecoesCaixa } from "@/lib/actions/projections-actions/index";
import { Skeleton } from "@/components/ui/skeleton";

interface CashProjectionTabProps {
  organizationId: string;
}

export function CashProjectionTab({ organizationId }: CashProjectionTabProps) {
  const [projections, setProjections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjections() {
      try {
        setLoading(true);
        const result = await getProjecoesCaixa(organizationId);
        
        if ('error' in result) {
          setError(result.error ?? null);
        } else {
          setProjections(result.data);
        }
      } catch (err) {
        setError('Erro ao carregar projeções de caixa');
      } finally {
        setLoading(false);
      }
    }

    loadProjections();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <CashProjectionListing 
      organization={{ id: organizationId, nome: "" }}
      initialProjections={projections}
    />
  );
}