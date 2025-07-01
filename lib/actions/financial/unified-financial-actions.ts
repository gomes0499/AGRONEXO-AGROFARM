import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

// Import existing financial actions
import { 
  getDividasBancarias,
} from "@/lib/actions/financial-actions/dividas-bancarias";

import {
  getDividasFornecedores,
} from "@/lib/actions/financial-actions/dividas-fornecedores";

import {
  getDividasTerras,
} from "@/lib/actions/financial-actions/dividas-terras";

import {
  getFinanceiras,
} from "@/lib/actions/financial-actions/financeiras";

import {
  getReceitasFinanceiras,
} from "@/lib/actions/financial-actions/receitas-financeiras-actions";

import {
  getOutrasDespesas,
} from "@/lib/actions/financial-actions/outras-despesas";

import {
  getCaixaDisponibilidades,
} from "@/lib/actions/financial-actions/caixa-disponibilidades";

import { getSafras } from "@/lib/actions/production-actions";

export interface FinancialFilters {
  safraId?: string;
  year?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FinancialPageData {
  // Lists data
  dividasBancarias: Awaited<ReturnType<typeof getDividasBancarias>>;
  dividasFornecedores: Awaited<ReturnType<typeof getDividasFornecedores>>;
  dividasTerras: Awaited<ReturnType<typeof getDividasTerras>>;
  financeiras: Awaited<ReturnType<typeof getFinanceiras>>;
  receitasFinanceiras: Awaited<ReturnType<typeof getReceitasFinanceiras>>;
  outrasDespesas: Awaited<ReturnType<typeof getOutrasDespesas>>;
  caixaDisponibilidades: Awaited<ReturnType<typeof getCaixaDisponibilidades>>;
  
  // Common data
  safras: Awaited<ReturnType<typeof getSafras>>;
  
  // Filters applied
  filters: FinancialFilters;
}

/**
 * Fetch all financial page data in a single call
 * Uses React cache to avoid duplicate queries
 */
export const fetchFinancialPageData = cache(
  async (
    organizationId: string,
    filters?: FinancialFilters
  ): Promise<FinancialPageData> => {
    // Set default filters
    const appliedFilters = {
      page: filters?.page || 1,
      limit: filters?.limit || 20,
      ...filters,
    };

    // Fetch all data in parallel
    const [
      dividasBancarias,
      dividasFornecedores,
      dividasTerras,
      financeiras,
      receitasFinanceiras,
      outrasDespesas,
      caixaDisponibilidades,
      safras,
    ] = await Promise.all([
      getDividasBancarias(organizationId),
      getDividasFornecedores(organizationId),
      getDividasTerras(organizationId),
      getFinanceiras(organizationId),
      getReceitasFinanceiras(organizationId),
      getOutrasDespesas(organizationId),
      getCaixaDisponibilidades(organizationId),
      getSafras(organizationId),
    ]);

    return {
      dividasBancarias,
      dividasFornecedores,
      dividasTerras,
      financeiras,
      receitasFinanceiras,
      outrasDespesas,
      caixaDisponibilidades,
      
      // Common data
      safras,
      
      // Applied filters
      filters: appliedFilters,
    };
  }
);


/**
 * Fetch form data for financial entities
 * Includes safras for forms
 */
export const fetchFinancialFormData = cache(
  async (organizationId: string) => {
    const safras = await getSafras(organizationId);

    return {
      safras,
    };
  }
);