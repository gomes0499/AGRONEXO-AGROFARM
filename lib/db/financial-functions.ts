"use server";

import { createClient } from '@/lib/supabase/server';

// Types for the SQL function results
export interface ProductionStatsResult {
  safra_id: string;
  safra_nome: string;
  area_total: number;
  produtividade_media: number;
  receita_total: number;
  custo_total: number;
  ebitda: number;
  margem_ebitda: number;
  crescimento_area: number;
  crescimento_receita: number;
  crescimento_ebitda: number;
}

export interface DebtPositionResult {
  safra_id: string;
  safra_nome: string;
  divida_bancos: number;
  divida_fornecedores: number;
  divida_terras: number;
  divida_total: number;
  caixa_disponivel: number;
  divida_liquida: number;
  receita: number;
  ebitda: number;
  divida_receita: number;
  divida_ebitda: number;
}

export interface RatingMetricsResult {
  liquidez_corrente: number;
  divida_ebitda: number;
  divida_faturamento: number;
  divida_patrimonio_liquido: number;
  ltv: number;
  margem_ebitda: number;
}

export interface CashFlowResult {
  safra_id: string;
  safra_nome: string;
  receitas_agricolas: number;
  despesas_agricolas: number;
  outras_receitas: number;
  outras_despesas: number;
  fluxo_operacional: number;
  investimentos: number;
  servico_divida: number;
  fluxo_livre: number;
  fluxo_liquido: number;
  fluxo_acumulado: number;
}

export interface BalanceSheetResult {
  ativo_circulante: {
    caixa_bancos: number;
    clientes: number;
    estoques: number;
    total: number;
  };
  ativo_nao_circulante: {
    propriedades: number;
    maquinas_equipamentos: number;
    total: number;
  };
  passivo_circulante: {
    dividas_bancarias_cp: number;
    fornecedores: number;
    total: number;
  };
  passivo_nao_circulante: {
    dividas_bancarias_lp: number;
    dividas_imoveis: number;
    total: number;
  };
  patrimonio_liquido: {
    capital_social: number;
    lucros_acumulados: number;
    total: number;
  };
  total_ativo: number;
  total_passivo: number;
}

export interface IncomeStatementResult {
  receita_bruta: {
    agricola: number;
    pecuaria: number;
    total: number;
  };
  impostos_vendas: {
    icms: number;
    pis_cofins: number;
    total: number;
  };
  receita_liquida: number;
  custos: {
    agricola: number;
    pecuaria: number;
    total: number;
  };
  lucro_bruto: number;
  despesas_operacionais: {
    administrativas: number;
    pessoal: number;
    manutencao: number;
    outros: number;
    total: number;
  };
  ebitda: number;
  margem_ebitda: number;
  depreciacao_amortizacao: number;
  ebit: number;
  resultado_financeiro: {
    receitas_financeiras: number;
    despesas_financeiras: number;
    total: number;
  };
  lucro_antes_ir: number;
  impostos_sobre_lucro: number;
  lucro_liquido: number;
  margem_liquida: number;
}

/**
 * Get optimized production statistics using SQL function
 */
export async function getProductionStatsOptimized(
  organizationId: string,
  selectedYear?: string
): Promise<ProductionStatsResult[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('calculate_production_stats', {
    p_organization_id: organizationId,
    p_selected_year: selectedYear
  });
  
  if (error) {
    console.error('Error fetching production stats:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Get consolidated debt position using SQL function
 */
export async function getDebtPositionOptimized(
  organizationId: string,
  projectionId?: string
): Promise<DebtPositionResult[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('get_consolidated_debt_position', {
    p_organization_id: organizationId,
    p_projection_id: projectionId
  });
  
  if (error) {
    console.error('Error fetching debt position:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Calculate rating metrics using SQL function
 */
export async function getRatingMetricsOptimized(
  organizationId: string,
  safraId: string
): Promise<RatingMetricsResult | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('calculate_rating_metrics_optimized', {
    p_organization_id: organizationId,
    p_safra_id: safraId
  });
  
  if (error) {
    console.error('Error fetching rating metrics:', error);
    throw error;
  }
  
  return data?.[0] || null;
}

/**
 * Generate cash flow projection using SQL function
 */
export async function getCashFlowProjectionOptimized(
  organizationId: string,
  projectionId?: string
): Promise<CashFlowResult[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('generate_cash_flow_projection', {
    p_organization_id: organizationId,
    p_projection_id: projectionId
  });
  
  if (error) {
    console.error('Error fetching cash flow projection:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Generate balance sheet using SQL function
 */
export async function getBalanceSheetOptimized(
  organizationId: string,
  safraId: string
): Promise<BalanceSheetResult | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('generate_balance_sheet', {
    p_organization_id: organizationId,
    p_safra_id: safraId
  });
  
  if (error) {
    console.error('Error fetching balance sheet:', error);
    throw error;
  }
  
  return data?.[0] || null;
}

/**
 * Generate income statement using SQL function
 */
export async function getIncomeStatementOptimized(
  organizationId: string,
  safraId: string
): Promise<IncomeStatementResult | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('generate_income_statement', {
    p_organization_id: organizationId,
    p_safra_id: safraId
  });
  
  if (error) {
    console.error('Error fetching income statement:', error);
    throw error;
  }
  
  return data?.[0] || null;
}

/**
 * Get EBITDA calculation using SQL function
 */
export async function getEbitdaOptimized(
  organizationId: string,
  safraId: string
): Promise<number> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('calculate_ebitda_by_safra', {
    p_organization_id: organizationId,
    p_safra_id: safraId
  });
  
  if (error) {
    console.error('Error fetching EBITDA:', error);
    throw error;
  }
  
  return data || 0;
}

/**
 * Helper function to calculate year-over-year growth
 */
export async function calculateYoYGrowth(
  currentValue: number,
  previousValue: number
): Promise<number> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('calculate_yoy_growth', {
    p_current: currentValue,
    p_previous: previousValue
  });
  
  if (error) {
    console.error('Error calculating YoY growth:', error);
    throw error;
  }
  
  return data || 0;
}