"use client";

import { useState, useEffect } from "react";
import { ProjectionConfigListing } from "./projection-config-listing";
import { getProjecoesConfig } from "@/lib/actions/projections-actions";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectionConfigTabProps {
  organizationId: string;
}

export function ProjectionConfigTab({ organizationId }: ProjectionConfigTabProps) {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfigs() {
      try {
        setLoading(true);
        const result = await getProjecoesConfig(organizationId);
        
        if ('error' in result) {
          setError(result.error);
        } else {
          setConfigs(result.data);
        }
      } catch (err) {
        setError('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    }

    loadConfigs();
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
    <ProjectionConfigListing 
      organization={{ id: organizationId, nome: "" }}
      initialConfigs={configs}
    />
  );
}