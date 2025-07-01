import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

// Import existing asset actions
import {
  getAssetSales,
  getInvestments,
  getEquipments,
  getLandPlans,
} from "@/lib/actions/patrimonio-actions";

import { getSafras } from "@/lib/actions/production-actions";
import { getAssetFormData } from "@/lib/actions/asset-forms-data-actions";

export interface AssetFilters {
  page?: number;
  limit?: number;
  search?: string;
  year?: number;
}

export interface AssetsPageData {
  // Main data
  assetSales: Awaited<ReturnType<typeof getAssetSales>>;
  investments: Awaited<ReturnType<typeof getInvestments>>;
  equipment: Awaited<ReturnType<typeof getEquipments>>;
  landPlans: Awaited<ReturnType<typeof getLandPlans>>;
  
  // Form data
  safras: Awaited<ReturnType<typeof getSafras>>;
  
  // Filters applied
  filters: AssetFilters;
}

/**
 * Fetch all assets page data in a single call
 * Uses React cache to avoid duplicate queries
 */
export const fetchAssetsPageData = cache(
  async (
    organizationId: string,
    filters?: AssetFilters
  ): Promise<AssetsPageData> => {
    // Set default filters
    const appliedFilters = {
      page: filters?.page || 1,
      limit: filters?.limit || 20,
      ...filters,
    };

    // Fetch all data in parallel
    const [
      assetSales,
      investments,
      equipment,
      landPlans,
      safras,
    ] = await Promise.all([
      getAssetSales(organizationId),
      getInvestments(organizationId),
      getEquipments(organizationId),
      getLandPlans(organizationId),
      getSafras(organizationId),
    ]);

    return {
      assetSales,
      investments,
      equipment,
      landPlans,
      safras,
      filters: appliedFilters,
    };
  }
);

/**
 * Fetch form data for asset entities
 * Includes safras for forms
 */
export const fetchAssetFormData = cache(
  async (organizationId: string) => {
    return getAssetFormData(organizationId);
  }
);