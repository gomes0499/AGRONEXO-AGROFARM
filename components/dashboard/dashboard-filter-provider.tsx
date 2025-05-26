"use client";

import { createContext, useContext, ReactNode } from "react";
import { useDashboardFilters, DashboardFilters } from "@/hooks/use-dashboard-filters";

interface FilterContextValue {
  filters: DashboardFilters;
  getFilteredPropertyIds: (allPropertyIds: string[]) => string[];
  getFilteredCultureIds: (allCultureIds: string[]) => string[];
  getFilteredSystemIds: (allSystemIds: string[]) => string[];
  getFilteredCycleIds: (allCycleIds: string[]) => string[];
  getFilteredSafraIds: (allSafraIds: string[]) => string[];
  hasActiveFilters: boolean;
  isPending: boolean;
  allPropertyIds: string[];
  allCultureIds: string[];
  allSystemIds: string[];
  allCycleIds: string[];
  allSafraIds: string[];
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined);

interface DashboardFilterProviderProps {
  children: ReactNode;
  totalProperties: number;
  totalCultures: number;
  totalSystems: number;
  totalCycles: number;
  totalSafras: number;
  allPropertyIds: string[];
  allCultureIds: string[];
  allSystemIds: string[];
  allCycleIds: string[];
  allSafraIds: string[];
}

export function DashboardFilterProvider({
  children,
  totalProperties,
  totalCultures,
  totalSystems,
  totalCycles,
  totalSafras,
  allPropertyIds,
  allCultureIds,
  allSystemIds,
  allCycleIds,
  allSafraIds,
}: DashboardFilterProviderProps) {
  const {
    filters,
    hasActiveFilters,
    isPending,
    getFilteredIds,
  } = useDashboardFilters({
    totalProperties,
    totalCultures,
    totalSystems,
    totalCycles,
    totalSafras,
  });

  const getFilteredPropertyIds = (allIds: string[]) => 
    getFilteredIds(filters.propertyIds, allIds);
  
  const getFilteredCultureIds = (allIds: string[]) => 
    getFilteredIds(filters.cultureIds, allIds);
  
  const getFilteredSystemIds = (allIds: string[]) => 
    getFilteredIds(filters.systemIds, allIds);
  
  const getFilteredCycleIds = (allIds: string[]) => 
    getFilteredIds(filters.cycleIds, allIds);
  
  const getFilteredSafraIds = (allIds: string[]) => 
    getFilteredIds(filters.safraIds, allIds);

  const contextValue: FilterContextValue = {
    filters,
    getFilteredPropertyIds,
    getFilteredCultureIds,
    getFilteredSystemIds,
    getFilteredCycleIds,
    getFilteredSafraIds,
    hasActiveFilters,
    isPending,
    allPropertyIds,
    allCultureIds,
    allSystemIds,
    allCycleIds,
    allSafraIds,
  };

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
}

export function useDashboardFilterContext() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useDashboardFilterContext must be used within a DashboardFilterProvider");
  }
  return context;
}