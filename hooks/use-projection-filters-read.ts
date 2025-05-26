"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

export interface ProjectionFiltersRead {
  propertyIds: string[];
  cultureIds: string[];
  systemIds: string[];
  cycleIds: string[];
  safraIds: string[];
  hasActiveFilters: boolean;
}

export function useProjectionFiltersRead(): ProjectionFiltersRead {
  const searchParams = useSearchParams();

  const filters = useMemo(() => {
    const propertyParam = searchParams.get("properties");
    const cultureParam = searchParams.get("cultures");
    const systemParam = searchParams.get("systems");
    const cycleParam = searchParams.get("cycles");
    const safraParam = searchParams.get("safras");

    const propertyIds = propertyParam ? propertyParam.split(",") : [];
    const cultureIds = cultureParam ? cultureParam.split(",") : [];
    const systemIds = systemParam ? systemParam.split(",") : [];
    const cycleIds = cycleParam ? cycleParam.split(",") : [];
    const safraIds = safraParam ? safraParam.split(",") : [];

    // Filtros ativos são apenas quando há parâmetros específicos na URL
    const hasActiveFilters = !!(propertyParam || cultureParam || systemParam || cycleParam || safraParam);

    return {
      propertyIds,
      cultureIds,
      systemIds,
      cycleIds,
      safraIds,
      hasActiveFilters,
    };
  }, [searchParams]);

  return filters;
}