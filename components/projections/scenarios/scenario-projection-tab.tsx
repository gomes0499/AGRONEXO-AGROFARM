"use client";

import { useState, useEffect } from "react";
import { ScenarioListing } from "./scenario-listing";
import { getProjecoesCenarios } from "@/lib/actions/projections-actions/index";
import { Skeleton } from "@/components/ui/skeleton";

interface ScenarioProjectionTabProps {
  organizationId: string;
}

export function ScenarioProjectionTab({ organizationId }: ScenarioProjectionTabProps) {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadScenarios() {
      try {
        setLoading(true);
        const result = await getProjecoesCenarios(organizationId);
        
        if ('error' in result) {
          setError(result.error ?? null);
        } else {
          setScenarios(result.data);
        }
      } catch (err) {
        setError('Erro ao carregar cenários');
      } finally {
        setLoading(false);
      }
    }

    loadScenarios();
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
    <ScenarioListing 
      organization={{ id: organizationId, nome: "" }}
      initialScenarios={scenarios}
    />
  );
}