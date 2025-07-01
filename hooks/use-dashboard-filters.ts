"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export interface DashboardFilters {
  propertyIds: string[];
  cultureIds: string[];
  systemIds: string[];
  cycleIds: string[];
  safraIds: string[];
}

interface UseDashboardFiltersProps {
  totalProperties: number;
  totalCultures: number;
  totalSystems: number;
  totalCycles: number;
  totalSafras: number;
}

export function useDashboardFilters({
  totalProperties,
  totalCultures,
  totalSystems,
  totalCycles,
  totalSafras,
}: UseDashboardFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Inicializar filtros a partir dos parâmetros da URL
  const initializeFilters = (): DashboardFilters => {
    const propertyParam = searchParams.get("properties");
    const cultureParam = searchParams.get("cultures");
    const systemParam = searchParams.get("systems");
    const cycleParam = searchParams.get("cycles");
    const safraParam = searchParams.get("safras");

    return {
      // Se não há parâmetro na URL, retorna array vazio (que representa "todos selecionados")
      propertyIds: propertyParam ? propertyParam.split(",") : [],
      cultureIds: cultureParam ? cultureParam.split(",") : [],
      systemIds: systemParam ? systemParam.split(",") : [],
      cycleIds: cycleParam ? cycleParam.split(",") : [],
      safraIds: safraParam ? safraParam.split(",") : [],
    };
  };

  const [filters, setFilters] = useState<DashboardFilters>(initializeFilters);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Atualizar URL quando os filtros mudarem
  const updateURL = (newFilters: DashboardFilters) => {
    // Cancel any pending URL update
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounce URL updates to prevent multiple rapid changes
    updateTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);

      // Função helper para atualizar parâmetro
      const updateParam = (key: string, ids: string[], total: number) => {
        if (ids.length === 0 || ids.length === total) {
          params.delete(key);
        } else {
          params.set(key, ids.join(","));
        }
      };

      updateParam("properties", newFilters.propertyIds, totalProperties);
      updateParam("cultures", newFilters.cultureIds, totalCultures);
      updateParam("systems", newFilters.systemIds, totalSystems);
      updateParam("cycles", newFilters.cycleIds, totalCycles);
      updateParam("safras", newFilters.safraIds, totalSafras);

      const newUrl = `${pathname}?${params.toString()}`;
      
      startTransition(() => {
        router.replace(newUrl);
      });
    }, 100); // 100ms debounce
  };

  // Handlers para cada tipo de filtro
  const setPropertyIds = (propertyIds: string[]) => {
    const newFilters = { ...filters, propertyIds };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const setCultureIds = (cultureIds: string[]) => {
    const newFilters = { ...filters, cultureIds };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const setSystemIds = (systemIds: string[]) => {
    const newFilters = { ...filters, systemIds };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const setCycleIds = (cycleIds: string[]) => {
    const newFilters = { ...filters, cycleIds };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const setSafraIds = (safraIds: string[]) => {
    const newFilters = { ...filters, safraIds };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const clearAllFilters = () => {
    const newFilters: DashboardFilters = {
      propertyIds: [],
      cultureIds: [],
      systemIds: [],
      cycleIds: [],
      safraIds: [],
    };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  // Verificar se algum filtro está ativo
  const hasActiveFilters = () => {
    return (
      (filters.propertyIds.length > 0 && filters.propertyIds.length < totalProperties) ||
      (filters.cultureIds.length > 0 && filters.cultureIds.length < totalCultures) ||
      (filters.systemIds.length > 0 && filters.systemIds.length < totalSystems) ||
      (filters.cycleIds.length > 0 && filters.cycleIds.length < totalCycles) ||
      (filters.safraIds.length > 0 && filters.safraIds.length < totalSafras)
    );
  };

  // Obter IDs filtrados (array vazio = todos selecionados)
  const getFilteredIds = (filterIds: string[], allIds: string[]) => {
    return filterIds.length === 0 ? allIds : filterIds;
  };

  // Sincronizar com mudanças na URL externa
  useEffect(() => {
    const newFilters = initializeFilters();
    // Only update if filters actually changed
    setFilters(prev => {
      // Check if filters are actually different
      const hasChanged = 
        JSON.stringify(prev.propertyIds) !== JSON.stringify(newFilters.propertyIds) ||
        JSON.stringify(prev.cultureIds) !== JSON.stringify(newFilters.cultureIds) ||
        JSON.stringify(prev.systemIds) !== JSON.stringify(newFilters.systemIds) ||
        JSON.stringify(prev.cycleIds) !== JSON.stringify(newFilters.cycleIds) ||
        JSON.stringify(prev.safraIds) !== JSON.stringify(newFilters.safraIds);
      
      return hasChanged ? newFilters : prev;
    });
  }, [searchParams]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return {
    filters,
    setPropertyIds,
    setCultureIds,
    setSystemIds,
    setCycleIds,
    setSafraIds,
    clearAllFilters,
    hasActiveFilters: hasActiveFilters(),
    isPending,
    getFilteredIds,
  };
}