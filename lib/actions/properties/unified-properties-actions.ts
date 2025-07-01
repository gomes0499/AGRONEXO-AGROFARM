import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

// Import existing property actions
import {
  getProperties,
  getPropertyById,
  getLeases,
  getImprovements,
} from "@/lib/actions/property-actions";

export interface PropertyFilters {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PropertiesPageData {
  // Main data
  properties: Awaited<ReturnType<typeof getProperties>>;
  leases: Awaited<ReturnType<typeof getLeases>>;
  improvements: Awaited<ReturnType<typeof getImprovements>>;
  
  // Filters applied
  filters: PropertyFilters;
}

/**
 * Fetch all properties page data in a single call
 * Uses React cache to avoid duplicate queries
 */
export const fetchPropertiesPageData = cache(
  async (
    organizationId: string,
    filters?: PropertyFilters
  ): Promise<PropertiesPageData> => {
    // Set default filters
    const appliedFilters = {
      page: filters?.page || 1,
      limit: filters?.limit || 20,
      ...filters,
    };

    // Fetch all data in parallel
    const [properties, leases, improvements] = await Promise.all([
      getProperties(organizationId),
      getLeases(organizationId),
      getImprovements(organizationId),
    ]);

    return {
      properties,
      leases,
      improvements,
      filters: appliedFilters,
    };
  }
);

/**
 * Fetch property details with all related data
 */
export const fetchPropertyDetails = cache(
  async (propertyId: string) => {
    const property = await getPropertyById(propertyId);
    return property;
  }
);