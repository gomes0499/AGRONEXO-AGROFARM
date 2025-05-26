"use client";

import { DashboardGlobalFilter } from "./dashboard-global-filter";
import { useDashboardFilters } from "@/hooks/use-dashboard-filters";
import type {
  Property,
  Culture,
  System,
  Cycle,
  Safra,
} from "@/components/projections/common/projection-global-filter";

interface DashboardGlobalFilterClientProps {
  properties: Property[];
  cultures: Culture[];
  systems: System[];
  cycles: Cycle[];
  safras: Safra[];
}

export function DashboardGlobalFilterClient({
  properties,
  cultures,
  systems,
  cycles,
  safras,
}: DashboardGlobalFilterClientProps) {
  const {
    filters,
    setPropertyIds,
    setCultureIds,
    setSystemIds,
    setCycleIds,
    setSafraIds,
    clearAllFilters,
    isPending,
  } = useDashboardFilters({
    totalProperties: properties.length,
    totalCultures: cultures.length,
    totalSystems: systems.length,
    totalCycles: cycles.length,
    totalSafras: safras.length,
  });

  // Interpretar arrays vazios como "todos selecionados"
  const getSelectedIds = (filterIds: string[], allItems: any[]) => {
    return filterIds.length === 0 ? allItems.map(item => item.id) : filterIds;
  };

  return (
    <DashboardGlobalFilter
      properties={properties}
      cultures={cultures}
      systems={systems}
      cycles={cycles}
      safras={safras}
      selectedPropertyIds={getSelectedIds(filters.propertyIds, properties)}
      selectedCultureIds={getSelectedIds(filters.cultureIds, cultures)}
      selectedSystemIds={getSelectedIds(filters.systemIds, systems)}
      selectedCycleIds={getSelectedIds(filters.cycleIds, cycles)}
      selectedSafraIds={getSelectedIds(filters.safraIds, safras)}
      onPropertySelectionChange={setPropertyIds}
      onCultureSelectionChange={setCultureIds}
      onSystemSelectionChange={setSystemIds}
      onCycleSelectionChange={setCycleIds}
      onSafraSelectionChange={setSafraIds}
      onClearFilters={clearAllFilters}
    />
  );
}