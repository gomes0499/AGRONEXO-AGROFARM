"use client";

import { ProjectionGlobalFilter } from "./projection-global-filter";
import { useProjectionFilters } from "@/hooks/use-projection-filters";
import type {
  Property,
  Culture,
  System,
  Cycle,
  Safra,
} from "./projection-global-filter";

interface ProjectionGlobalFilterClientProps {
  properties: Property[];
  cultures: Culture[];
  systems: System[];
  cycles: Cycle[];
  safras: Safra[];
}

export function ProjectionGlobalFilterClient({
  properties,
  cultures,
  systems,
  cycles,
  safras,
}: ProjectionGlobalFilterClientProps) {
  const {
    filters,
    setPropertyIds,
    setCultureIds,
    setSystemIds,
    setCycleIds,
    setSafraIds,
    clearAllFilters,
    isPending,
  } = useProjectionFilters({
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
    <ProjectionGlobalFilter
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