import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

// Import existing actions
import { getFinancialKpiData } from "@/lib/actions/financial-kpi-data-actions";
import { getOverviewKpiData } from "@/lib/actions/overview-kpi-data-actions";
import { getProductionStats } from "@/lib/actions/production-stats-actions";
import { getProperties } from "@/lib/actions/property-actions";
import { getFinancialMetrics } from "@/lib/actions/financial-metrics-actions";
import { getFluxoCaixaSimplificado } from "@/lib/actions/projections-actions/fluxo-caixa-simplificado";
import { getDREDataUpdated } from "@/lib/actions/projections-actions/dre-data-updated";
import { getBalancoPatrimonialDataV2 } from "@/lib/actions/projections-actions/balanco-patrimonial-data-v2";
import { getBankDistributionData } from "@/lib/actions/financial-bank-distribution-actions";
import { getDebtTypeDistributionData } from "@/lib/actions/debt-type-distribution-actions";
import { getBankDistributionAllSafrasData } from "@/lib/actions/bank-distribution-all-safras-actions";
import { getDebtTypeDistributionAllSafrasData } from "@/lib/actions/debt-type-distribution-all-safras-actions";
import { getTotalLiabilitiesChartData } from "@/lib/actions/total-liabilities-chart-actions";
import { getFinancialDebtChartsData } from "@/lib/actions/financial-debt-charts-actions";
import { getDebtEvolutionData } from "@/lib/actions/financial-debt-evolution-actions";
import { getProductionDataUnified } from "@/lib/actions/production-actions";
import { getMarketData } from "@/lib/actions/market-data-actions";
import { getWeatherData } from "@/lib/actions/weather-data-wrapper";
import { getUserOrganizations } from "@/lib/actions/user-organizations-actions";
import { getCultureProjections } from "@/lib/actions/culture-projections-actions";
import { getDebtPosition } from "@/lib/actions/debt-position-actions";
import { getSafras } from "@/lib/actions/production-actions";

export interface DashboardData {
  // Overview
  overviewKpis: Awaited<ReturnType<typeof getOverviewKpiData>>;
  
  // Financial
  financialKpis: Awaited<ReturnType<typeof getFinancialKpiData>>;
  financialMetrics: Awaited<ReturnType<typeof getFinancialMetrics>>;
  bankDistribution: Awaited<ReturnType<typeof getBankDistributionData>>;
  debtTypeDistribution: Awaited<ReturnType<typeof getDebtTypeDistributionData>>;
  bankDistributionAllSafras: Awaited<ReturnType<typeof getBankDistributionAllSafrasData>>;
  debtTypeDistributionAllSafras: Awaited<ReturnType<typeof getDebtTypeDistributionAllSafrasData>>;
  totalLiabilities: Awaited<ReturnType<typeof getTotalLiabilitiesChartData>>;
  debtCharts: Awaited<ReturnType<typeof getFinancialDebtChartsData>>;
  debtEvolution: Awaited<ReturnType<typeof getDebtEvolutionData>>;
  
  // Production
  productionStats: Awaited<ReturnType<typeof getProductionStats>>;
  productionConfig: Awaited<ReturnType<typeof getProductionDataUnified>>;
  
  // Properties
  properties: Awaited<ReturnType<typeof getProperties>>;
  
  // Projections
  cashFlowSummary: Awaited<ReturnType<typeof getFluxoCaixaSimplificado>>;
  dreSummary: Awaited<ReturnType<typeof getDREDataUpdated>>;
  balanceSummary: Awaited<ReturnType<typeof getBalancoPatrimonialDataV2>>;
  cultureProjections: Awaited<ReturnType<typeof getCultureProjections>>;
  debtPositions: Awaited<ReturnType<typeof getDebtPosition>>;
  
  // Common data
  safras: Awaited<ReturnType<typeof getSafras>>;
  
  // Market & Weather
  marketData: Awaited<ReturnType<typeof getMarketData>>;
  weatherData: Awaited<ReturnType<typeof getWeatherData>>;
  
  // Organizations
  userOrganizations: Awaited<ReturnType<typeof getUserOrganizations>>;
}

/**
 * Fetch all dashboard data in a single call
 * Uses React cache to avoid duplicate queries
 */
export const fetchDashboardData = cache(
  async (
    organizationId: string,
    projectionId?: string,
    selectedYear?: number,
    selectedSafraId?: string
  ): Promise<DashboardData> => {
    const supabase = await createClient();

    // Get current year if not provided
    const currentYear = selectedYear || new Date().getFullYear();

    // Fetch all data in parallel
    const [
      // Overview
      overviewKpis,
      
      // Financial
      financialKpis,
      financialMetrics,
      bankDistribution,
      debtTypeDistribution,
      bankDistributionAllSafras,
      debtTypeDistributionAllSafras,
      totalLiabilities,
      debtCharts,
      debtEvolution,
      
      // Production
      productionStats,
      productionConfig,
      
      // Properties
      properties,
      
      // Projections
      cashFlowSummary,
      dreSummary,
      balanceSummary,
      cultureProjections,
      debtPositions,
      safras,
      
      // Market & Weather
      marketData,
      weatherData,
      
      // Organizations
      userOrganizations,
    ] = await Promise.all([
      // Overview
      getOverviewKpiData(organizationId, projectionId ? [projectionId] : undefined),
      
      // Financial
      getFinancialKpiData(organizationId, selectedSafraId, projectionId),
      getFinancialMetrics(organizationId, projectionId ? Number(projectionId) : undefined),
      getBankDistributionData(organizationId, selectedSafraId, projectionId),
      getDebtTypeDistributionData(organizationId, selectedSafraId, projectionId),
      getBankDistributionAllSafrasData(organizationId, projectionId),
      getDebtTypeDistributionAllSafrasData(organizationId, projectionId),
      getTotalLiabilitiesChartData(organizationId, selectedSafraId, projectionId),
      getFinancialDebtChartsData(organizationId, projectionId ? Number(projectionId) : undefined),
      getDebtEvolutionData(organizationId, projectionId),
      
      // Production
      getProductionStats(organizationId, undefined, projectionId, selectedSafraId),
      getProductionDataUnified(organizationId),
      
      // Properties
      getProperties(organizationId),
      
      // Projections (simplified data for dashboard)
      getFluxoCaixaSimplificado(organizationId, projectionId),
      getDREDataUpdated(organizationId, projectionId),
      getBalancoPatrimonialDataV2(organizationId, projectionId),
      getCultureProjections(organizationId, projectionId),
      getDebtPosition(organizationId, projectionId),
      
      // Common data
      getSafras(organizationId),
      
      // Market & Weather
      getMarketData(),
      getWeatherData(organizationId),
      
      // Organizations
      getUserOrganizations(),
    ]);

    return {
      // Overview
      overviewKpis,
      
      // Financial
      financialKpis,
      financialMetrics,
      bankDistribution,
      debtTypeDistribution,
      bankDistributionAllSafras,
      debtTypeDistributionAllSafras,
      totalLiabilities,
      debtCharts,
      debtEvolution,
      
      // Production
      productionStats,
      productionConfig,
      
      // Properties
      properties,
      
      // Projections
      cashFlowSummary,
      dreSummary,
      balanceSummary,
      cultureProjections,
      debtPositions,
      safras,
      
      // Market & Weather
      marketData,
      weatherData,
      
      // Organizations
      userOrganizations,
    };
  }
);

/**
 * Fetch only financial dashboard data
 * Useful for the financial tab
 */
export const fetchFinancialDashboardData = cache(
  async (
    organizationId: string,
    projectionId?: string,
    selectedYear?: number,
    selectedSafraId?: string
  ) => {
    const currentYear = selectedYear || new Date().getFullYear();

    const [
      financialKpis,
      bankDistribution,
      debtTypeDistribution,
      bankDistributionAllSafras,
      debtTypeDistributionAllSafras,
      totalLiabilities,
    ] = await Promise.all([
      getFinancialKpiData(organizationId, selectedSafraId, projectionId),
      getBankDistributionData(organizationId, selectedSafraId, projectionId),
      getDebtTypeDistributionData(organizationId, selectedSafraId, projectionId),
      getBankDistributionAllSafrasData(organizationId, projectionId),
      getDebtTypeDistributionAllSafrasData(organizationId, projectionId),
      getTotalLiabilitiesChartData(organizationId, selectedSafraId, projectionId),
    ]);

    return {
      financialKpis,
      bankDistribution,
      debtTypeDistribution,
      bankDistributionAllSafras,
      debtTypeDistributionAllSafras,
      totalLiabilities,
    };
  }
);

/**
 * Fetch only production dashboard data
 * Useful for the production tab
 */
export const fetchProductionDashboardData = cache(
  async (
    organizationId: string,
    projectionId?: string,
    filters?: {
      safraId?: string;
      propertyIds?: string[];
      cultureIds?: string[];
      systemIds?: string[];
      cycleIds?: string[];
    }
  ) => {
    const [productionStats, productionConfig] = await Promise.all([
      getProductionStats(organizationId, filters?.propertyIds, projectionId, filters?.safraId),
      getProductionDataUnified(organizationId),
    ]);

    return {
      productionStats,
      productionConfig,
    };
  }
);

/**
 * Fetch market and weather data
 * These update frequently so they're separate
 */
export const fetchTickerData = cache(
  async (organizationId?: string) => {
    const [marketData, weatherData] = await Promise.all([
      getMarketData(),
      organizationId ? getWeatherData(organizationId) : Promise.resolve(null),
    ]);

    return {
      marketData,
      weatherData,
    };
  }
);