import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

// Import existing projection actions
import { 
  getFluxoCaixaCorrigido
} from "@/lib/actions/projections-actions/fluxo-caixa-corrigido";

import {
  getBalancoPatrimonialCorrigido
} from "@/lib/actions/projections-actions/balanco-patrimonial-corrigido";

import {
  getDREDataUpdated
} from "@/lib/actions/projections-actions/dre-data-updated";

import {
  getCultureProjections,
} from "@/lib/actions/culture-projections-actions";

import {
  getDebtPosition,
  type ConsolidatedDebtPosition
} from "@/lib/actions/debt-position-actions";

import { getSafras } from "@/lib/actions/production-actions";
import { getCashPolicyConfig } from "@/lib/actions/financial-actions/cash-policy-actions";

export interface ProjectionFilters {
  scenarioId?: string;
  safraId?: string;
  year?: number;
}

export interface ProjectionsPageData {
  // Cash Flow Data
  cashFlow: {
    data: any;
    policy: Awaited<ReturnType<typeof getCashPolicyConfig>>;
  };
  
  // Balance Sheet Data
  balanceSheet: {
    data: any;
  };
  
  // Income Statement Data
  incomeStatement: {
    data: any;
  };
  
  // Culture Projections
  cultureProjections: Awaited<ReturnType<typeof getCultureProjections>>;
  
  // Debt Positions
  debtPositions: ConsolidatedDebtPosition;
  
  // Common Data
  safras: Awaited<ReturnType<typeof getSafras>>;
  
  // Applied filters
  filters: ProjectionFilters;
}

/**
 * Fetch all projections page data in a single call
 * Uses React cache to avoid duplicate queries
 */
export const fetchProjectionsPageData = cache(
  async (
    organizationId: string,
    filters?: ProjectionFilters
  ): Promise<ProjectionsPageData> => {
    // Set default filters
    const appliedFilters = {
      ...filters,
    };

    // Fetch all data in parallel
    const [
      cashFlowData,
      cashPolicy,
      balanceSheetData,
      incomeStatementData,
      cultureProjections,
      debtPositions,
      safras,
    ] = await Promise.all([
      getFluxoCaixaCorrigido(organizationId),
      getCashPolicyConfig(organizationId),
      getBalancoPatrimonialCorrigido(organizationId),
      getDREDataUpdated(organizationId),
      getCultureProjections(organizationId),
      getDebtPosition(organizationId),
      getSafras(organizationId),
    ]);

    return {
      cashFlow: {
        data: cashFlowData,
        policy: cashPolicy,
      },
      balanceSheet: {
        data: balanceSheetData,
      },
      incomeStatement: {
        data: incomeStatementData,
      },
      cultureProjections,
      debtPositions,
      safras,
      filters: appliedFilters,
    };
  }
);

/**
 * Fetch cash flow data only
 */
export const fetchCashFlowData = cache(
  async (organizationId: string) => {
    const [data, policy] = await Promise.all([
      getFluxoCaixaCorrigido(organizationId),
      getCashPolicyConfig(organizationId),
    ]);
    
    return { data, policy };
  }
);

/**
 * Fetch balance sheet data only
 */
export const fetchBalanceSheetData = cache(
  async (organizationId: string) => {
    return getBalancoPatrimonialCorrigido(organizationId);
  }
);

/**
 * Fetch income statement data only
 */
export const fetchIncomeStatementData = cache(
  async (organizationId: string) => {
    return getDREDataUpdated(organizationId);
  }
);


