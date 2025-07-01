import { createClient } from "@/lib/supabase/server";

// Import existing production actions
import {
  getCultures,
  getSystems,
  ensureDefaultSystems,
  getCycles,
  getSafras,
  getPlantingAreas,
  getProductivities,
  getProductionCosts,
} from "@/lib/actions/production-actions";

import {
  getProductionStats,
} from "@/lib/actions/production-stats-actions";

import {
  getAreaPlantadaChartData,
} from "@/lib/actions/area-plantada-chart-actions";

import {
  getProdutividadeChartData,
} from "@/lib/actions/produtividade-chart-actions";

import {
  getReceitaChartData,
} from "@/lib/actions/receita-chart-actions";

import {
  getCommodityPrices,
} from "@/lib/actions/commodity-prices-actions";

import {
  getExchangeRates,
} from "@/lib/actions/exchange-rates-actions";

export interface ProductionFilters {
  safraId?: string;
  culturaId?: string;
  sistemaId?: string;
  cicloId?: string;
  propriedadeId?: string;
  propertyIds?: string[];
  page?: number;
  limit?: number;
}

export interface ProductionPageData {
  // Configuration data
  cultures: Awaited<ReturnType<typeof getCultures>>;
  systems: Awaited<ReturnType<typeof getSystems>>;
  cycles: Awaited<ReturnType<typeof getCycles>>;
  safras: Awaited<ReturnType<typeof getSafras>>;
  
  // Main data
  plantingAreas: Awaited<ReturnType<typeof getPlantingAreas>>;
  productivities: Awaited<ReturnType<typeof getProductivities>>;
  productionCosts: Awaited<ReturnType<typeof getProductionCosts>>;
  
  // Prices data
  commodityPrices: Awaited<ReturnType<typeof getCommodityPrices>>;
  exchangeRates: Awaited<ReturnType<typeof getExchangeRates>>;
  
  // Stats
  productionStats: Awaited<ReturnType<typeof getProductionStats>>;
  
  // Chart data
  areaPlantadaChart: Awaited<ReturnType<typeof getAreaPlantadaChartData>>;
  produtividadeChart: Awaited<ReturnType<typeof getProdutividadeChartData>>;
  receitaChart: Awaited<ReturnType<typeof getReceitaChartData>>;
  
  // Applied filters
  filters: ProductionFilters;
}

/**
 * Fetch all production page data in a single call
 */
export const fetchProductionPageData = async (
  organizationId: string,
  filters?: ProductionFilters
): Promise<ProductionPageData> => {
    // Set default filters
    const appliedFilters = {
      page: filters?.page || 1,
      limit: filters?.limit || 20,
      ...filters,
    };

    // Convert single propriedadeId to array for functions that expect arrays
    const propertyIds = appliedFilters.propriedadeId 
      ? [appliedFilters.propriedadeId] 
      : appliedFilters.propertyIds;

    const safraIds = appliedFilters.safraId 
      ? [appliedFilters.safraId] 
      : undefined;

    // Fetch all data in parallel
    const [
      // Configuration data
      cultures,
      systems,
      cycles,
      safras,
      
      // Main data
      plantingAreas,
      productivities,
      productionCosts,
      
      // Prices data
      commodityPrices,
      exchangeRates,
      
      // Stats
      productionStats,
      
      // Chart data
      areaPlantadaChart,
      produtividadeChart,
      receitaChart,
    ] = await Promise.all([
      // Configuration data
      getCultures(organizationId),
      ensureDefaultSystems(organizationId), // Garante que sistemas padrão existam
      getCycles(organizationId),
      getSafras(organizationId),
      
      // Main data with pagination
      getPlantingAreas(organizationId),
      getProductivities(organizationId),
      getProductionCosts(organizationId),
      
      // Prices data
      getCommodityPrices(organizationId),
      getExchangeRates(organizationId),
      
      // Stats
      getProductionStats(organizationId, propertyIds),
      
      // Chart data
      getAreaPlantadaChartData(organizationId, safraIds),
      getProdutividadeChartData(organizationId, safraIds),
      getReceitaChartData(organizationId, safraIds),
    ]);

    return {
      // Configuration data
      cultures,
      systems,
      cycles,
      safras,
      
      // Main data
      plantingAreas,
      productivities,
      productionCosts,
      
      // Prices data
      commodityPrices,
      exchangeRates,
      
      // Stats
      productionStats,
      
      // Chart data
      areaPlantadaChart,
      produtividadeChart,
      receitaChart,
      
      // Applied filters
      filters: appliedFilters,
    };
};

/**
 * Fetch form data for production entities
 * Includes cultures, systems, cycles, safras
 */
export const fetchProductionFormData = async (organizationId: string) => {
    const [cultures, systems, cycles, safras] = await Promise.all([
      getCultures(organizationId),
      getSystems(organizationId),
      getCycles(organizationId),
      getSafras(organizationId),
    ]);

    return {
      cultures,
      systems,
      cycles,
      safras,
    };
};