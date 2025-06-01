"use client";

import { useState, useEffect } from "react";
import { useOrganization } from "@/components/auth/organization-provider";
import {
  getCultureProjections,
  CultureProjectionData,
} from "@/lib/actions/culture-projections-actions";
import { CultureProjectionsTable } from "./culture-projections-table";
import { Skeleton } from "@/components/ui/skeleton";

interface CultureProjectionTabProps {
  organizationId?: string;
}

export function CultureProjectionTab({
  organizationId: propOrgId,
}: CultureProjectionTabProps) {
  const { organization } = useOrganization();
  const [data, setData] = useState<{
    projections: CultureProjectionData[];
    sementes: CultureProjectionData[];
    consolidado: CultureProjectionData;
    anos: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const organizationId = propOrgId || organization?.id;

  useEffect(() => {
    async function loadData() {
      if (!organizationId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const result = await getCultureProjections(organizationId);
        setData(result);
      } catch (err) {
        console.error("❌ Erro ao carregar projeções:", err);
        setError("Erro ao carregar projeções de culturas");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [organizationId]);

  // Se não tem organizationId ainda, não mostra loading
  if (!organizationId) {
    return (
      <div className="text-center text-muted-foreground">
        Carregando organização...
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!data || data.projections.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        Nenhuma projeção de cultura encontrada
      </div>
    );
  }

  return (
    <CultureProjectionsTable
      projections={data.projections}
      sementes={data.sementes}
      consolidado={data.consolidado}
      anos={data.anos}
    />
  );
}
