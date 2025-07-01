import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

// Import existing indicator actions
import { getIndicatorConfigs } from "@/lib/actions/indicator-actions";
import { 
  getRatingModels,
  getRatingMetrics,
  getQualitativeMetricValues
} from "@/lib/actions/flexible-rating-actions";
import { defaultIndicatorConfigs } from "@/schemas/indicators";

export interface IndicatorsPageData {
  // Indicator configurations
  indicatorConfigs: Record<string, any>;
  
  // Rating models
  ratingModels: any[];
  
  // Rating metrics
  ratingMetrics: any[];
  
  // Qualitative values
  qualitativeValues: any[];
  
  // Mock indicator data for testing
  indicatorData: {
    liquidez: number;
    dividaEbitda: number;
    dividaFaturamento: number;
    dividaPl: number;
    ltv: number;
  };
  
  // Organization ID
  organizationId: string;
}

/**
 * Fetch all indicators page data in a single call
 * Uses React cache to avoid duplicate queries
 */
export const fetchIndicatorsPageData = cache(
  async (organizationId: string): Promise<IndicatorsPageData> => {
    // Fetch all data in parallel
    const [
      configs,
      ratingModels,
      ratingMetrics,
      qualitativeValues
    ] = await Promise.all([
      getIndicatorConfigs().catch(() => []),
      getRatingModels(organizationId).catch(() => []),
      getRatingMetrics(organizationId).catch(() => []),
      getQualitativeMetricValues(organizationId).catch(() => [])
    ]);

    // Transform configs into a map
    let indicatorConfigs: Record<string, any> = {};
    
    if (configs && configs.length > 0) {
      configs.forEach((config) => {
        indicatorConfigs[config.indicatorType] = config;
      });
    } else {
      // Use default configs if none found
      indicatorConfigs = Object.keys(defaultIndicatorConfigs).reduce(
        (acc, key) => {
          acc[key] = {
            indicatorType: key,
            thresholds:
              defaultIndicatorConfigs[
                key as keyof typeof defaultIndicatorConfigs
              ],
          };
          return acc;
        },
        {} as Record<string, any>
      );
    }

    // Mock indicator data for testing
    const indicatorData = {
      liquidez: 1.25,
      dividaEbitda: 2.1,
      dividaFaturamento: 0.45,
      dividaPl: 0.55,
      ltv: 0.35,
    };

    return {
      indicatorConfigs,
      ratingModels,
      ratingMetrics,
      qualitativeValues,
      indicatorData,
      organizationId,
    };
  }
);

/**
 * Fetch only rating models
 */
export const fetchRatingModels = cache(
  async (organizationId: string) => {
    return getRatingModels(organizationId);
  }
);

/**
 * Fetch only rating metrics
 */
export const fetchRatingMetrics = cache(
  async (organizationId: string) => {
    return getRatingMetrics(organizationId);
  }
);

/**
 * Fetch only qualitative metric values
 */
export const fetchQualitativeMetricValues = cache(
  async (organizationId: string) => {
    return getQualitativeMetricValues(organizationId);
  }
);