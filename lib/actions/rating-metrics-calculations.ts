"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Calculate metrics using optimized SQL function (recommended)
 */
export async function calculateQuantitativeMetricsOptimized(
  organizationId: string,
  safraId?: string
): Promise<Record<string, number>> {
  const supabase = await createClient();
  
  if (!safraId) {
    console.warn("No safraId provided, returning default values");
    return {
      LIQUIDEZ_CORRENTE: 0,
      DIVIDA_EBITDA: 0,
      DIVIDA_FATURAMENTO: 0,
      DIVIDA_PATRIMONIO_LIQUIDO: 0,
      LTV: 0,
      MARGEM_EBITDA: 0,
      ENTENDIMENTO_FLUXO_DE_CAIXA: 0,
    };
  }
  
  try {
    // Use the SQL function for optimized performance
    const { data, error } = await supabase.rpc('calculate_rating_metrics_optimized', {
      p_organization_id: organizationId,
      p_safra_id: safraId
    });
    
    if (error) {
      console.error('Error fetching rating metrics via SQL function:', error);
      // Fallback to original method if SQL function fails
      return calculateQuantitativeMetrics(organizationId, safraId);
    }
    
    if (!data || data.length === 0) {
      return {
        LIQUIDEZ_CORRENTE: 0,
        DIVIDA_EBITDA: 0,
        DIVIDA_FATURAMENTO: 0,
        DIVIDA_PATRIMONIO_LIQUIDO: 0,
        LTV: 0,
        MARGEM_EBITDA: 0,
        ENTENDIMENTO_FLUXO_DE_CAIXA: 0,
      };
    }
    
    const result = data[0];
    
    return {
      LIQUIDEZ_CORRENTE: Number(result.liquidez_corrente || 0),
      DIVIDA_EBITDA: Number(result.divida_ebitda || 0),
      DIVIDA_FATURAMENTO: Number(result.divida_faturamento || 0),
      DIVIDA_PATRIMONIO_LIQUIDO: Number(result.divida_patrimonio_liquido || 0),
      LTV: Number(result.ltv || 0),
      MARGEM_EBITDA: Number(result.margem_ebitda || 0),
      ENTENDIMENTO_FLUXO_DE_CAIXA: 0, // TODO: Implement this metric
    };
  } catch (error) {
    console.error("Error in optimized rating metrics:", error);
    // Fallback to original method
    return calculateQuantitativeMetrics(organizationId, safraId);
  }
}

// Calculate metrics directly without RPC (legacy method)
export async function calculateQuantitativeMetrics(
  organizationId: string,
  safraId?: string
): Promise<Record<string, number>> {
  const supabase = await createClient();
  const metrics: Record<string, number> = {};
  
  console.log("Calculating metrics for org:", organizationId, "safra:", safraId);
  
  try {
    // Get safra details
    let year = new Date().getFullYear();
    let safraName = "";
    
    if (!safraId) {
      console.warn("No safraId provided, returning default values");
      return {
        LIQUIDEZ_CORRENTE: 0,
        DIVIDA_EBITDA: 0,
        DIVIDA_FATURAMENTO: 0,
        DIVIDA_PATRIMONIO_LIQUIDO: 0,
        LTV: 0,
        MARGEM_EBITDA: 0,
        ENTENDIMENTO_FLUXO_DE_CAIXA: 0,
      };
    }
    
    const { data: safraData } = await supabase
      .from("safras")
      .select("nome, ano_inicio, ano_fim")
      .eq("id", safraId)
      .single();
    
    if (safraData) {
      safraName = safraData.nome;
      year = safraData.ano_fim; // Use ano_fim for financial calculations
    }

    // 1. LIQUIDEZ_CORRENTE (Current Assets / Current Liabilities)
    // Get all caixa categories for current assets
    const { data: caixaData } = await supabase
      .from("caixa_disponibilidades")
      .select("categoria, valores_por_ano")
      .eq("organizacao_id", organizationId)
      .in("categoria", ["CAIXA_BANCOS", "CLIENTES", "ADIANTAMENTOS", "ESTOQUE_DEFENSIVOS", "ESTOQUE_FERTILIZANTES", "ESTOQUE_COMMODITIES"]);

    let currentAssets = 0;
    
    // Sum current assets for the specific safra
    caixaData?.forEach(item => {
      const value = item.valores_por_ano?.[safraId] || 0;
      currentAssets += parseFloat(value.toString());
    });

    // Get current liabilities (short-term debts)
    let currentLiabilities = 0;
    
    // Bank debts for current year
    const { data: bankDebts } = await supabase
      .from("dividas_bancarias")
      .select("fluxo_pagamento_anual")
      .eq("organizacao_id", organizationId);
      
    bankDebts?.forEach(debt => {
      const value = debt.fluxo_pagamento_anual?.[safraId] || 0;
      currentLiabilities += parseFloat(value.toString());
    });
    
    // Supplier debts
    const { data: supplierDebts } = await supabase
      .from("dividas_fornecedores")
      .select("valores_por_ano")
      .eq("organizacao_id", organizationId);
      
    supplierDebts?.forEach(debt => {
      const value = debt.valores_por_ano?.[safraId] || 0;
      currentLiabilities += parseFloat(value.toString());
    });

    // Liquidez Corrente: Ativo Circulante / Passivo Circulante
    // Se não há passivos circulantes (currentLiabilities = 0), a liquidez é excelente
    // Usamos um valor alto (9999) para representar liquidez "infinita"
    metrics.LIQUIDEZ_CORRENTE = currentLiabilities > 0 ? currentAssets / currentLiabilities : 9999;

    // 2. Calculate Total Debt (current outstanding balance, not sum of all future payments)
    let totalDebt = 0;
    let currentYearDebt = 0;
    let futureDebt = 0;
    
    // Get all safras from current year onwards for calculating outstanding balance
    const { data: futureSafras } = await supabase
      .from("safras")
      .select("id, nome, ano_fim")
      .eq("organizacao_id", organizationId)
      .gte("ano_fim", year)
      .order("ano_fim");
    
    const futureSafraIds = futureSafras?.map(s => s.id) || [];
    
    // Calculate bank debts - sum only from current year onwards
    bankDebts?.forEach(debt => {
      const fluxo = debt.fluxo_pagamento_anual || {};
      futureSafraIds.forEach(id => {
        const value = fluxo[id];
        if (typeof value === 'number' && !isNaN(value) && value > 0) {
          if (id === safraId) {
            currentYearDebt += value;
          }
          futureDebt += value;
        }
      });
    });
    
    // Add supplier debts - sum only from current year onwards
    supplierDebts?.forEach(debt => {
      const valores = debt.valores_por_ano || {};
      futureSafraIds.forEach(id => {
        const value = valores[id];
        if (typeof value === 'number' && !isNaN(value) && value > 0) {
          if (id === safraId) {
            currentYearDebt += value;
          }
          futureDebt += value;
        }
      });
    });
    
    // Add land debts
    const { data: landDebts } = await supabase
      .from("dividas_terras")
      .select("fluxo_pagamento_anual")
      .eq("organizacao_id", organizationId);
      
    landDebts?.forEach(debt => {
      const fluxo = debt.fluxo_pagamento_anual || {};
      futureSafraIds.forEach(id => {
        const value = fluxo[id];
        if (typeof value === 'number' && !isNaN(value) && value > 0) {
          if (id === safraId) {
            currentYearDebt += value;
          }
          futureDebt += value;
        }
      });
    });
    
    // Total debt is the outstanding balance (future payments)
    totalDebt = futureDebt;

    // Calculate revenue and EBITDA
    // First try to get from receitas_financeiras
    const { data: revenueData } = await supabase
      .from("receitas_financeiras")
      .select("valor")
      .eq("organizacao_id", organizationId)
      .eq("safra_id", safraId);
    
    let revenue = 0;
    if (revenueData && revenueData.length > 0) {
      revenue = revenueData.reduce((sum, r) => sum + (r.valor || 0), 0);
    }
    
    // If no revenue from receitas_financeiras, try to calculate from production data
    if (revenue === 0) {
      const { data: productionData } = await supabase
        .from("areas_plantio")
        .select(`
          area,
          culturas!inner(nome),
          produtividades!inner(produtividade),
          precos!inner(preco_soja_brl, preco_milho, preco_algodao_bruto)
        `)
        .eq("organizacao_id", organizationId)
        .eq("safra_id", safraId);
      
      if (productionData && productionData.length > 0) {
        revenue = productionData.reduce((sum, item) => {
          const area = item.area || 0;
          const produtividade = (item.produtividades as any)?.produtividade || 0;
          const cultura = (item.culturas as any)?.nome?.toUpperCase() || "";
          let preco = 0;
          
          if (cultura === "SOJA" && (item.precos as any)?.preco_soja_brl) {
            preco = (item.precos as any).preco_soja_brl;
          } else if (cultura === "MILHO" && (item.precos as any)?.preco_milho) {
            preco = (item.precos as any).preco_milho;
          } else if (cultura === "ALGODÃO" && (item.precos as any)?.preco_algodao_bruto) {
            preco = (item.precos as any).preco_algodao_bruto;
          }
          
          return sum + (area * produtividade * preco);
        }, 0);
      }
    }
    
    // Get production costs
    let totalCosts = 0;
    const { data: costs } = await supabase
      .from("custos_producao")
      .select("valor")
      .eq("organizacao_id", organizationId)
      .eq("safra_id", safraId);
      
    if (costs && costs.length > 0) {
      totalCosts = costs.reduce((sum, c) => sum + (c.valor || 0), 0);
    }
    
    // Calculate EBITDA
    const ebitda = revenue - totalCosts;
    
    // DIVIDA_EBITDA - Se EBITDA é zero ou negativo, indicar situação crítica
    metrics.DIVIDA_EBITDA = ebitda > 0 ? totalDebt / ebitda : (totalDebt > 0 ? 999 : 0);

    // 3. DIVIDA_FATURAMENTO (Total Debt / Revenue)
    metrics.DIVIDA_FATURAMENTO = revenue > 0 ? totalDebt / revenue : (totalDebt > 0 ? 999 : 0);

    // 4. DIVIDA_PATRIMONIO_LIQUIDO (Total Debt / Equity)
    // Get total assets
    const { data: propriedades } = await supabase
      .from("propriedades")
      .select("valor_atual")
      .eq("organizacao_id", organizationId);

    let totalAssets = currentAssets;
    propriedades?.forEach(prop => {
      totalAssets += prop.valor_atual || 0;
    });
    
    // Add equipment values
    const { data: equipment } = await supabase
      .from("maquinas_equipamentos")
      .select("valor_aquisicao")
      .eq("organizacao_id", organizationId);
      
    equipment?.forEach(eq => {
      totalAssets += eq.valor_aquisicao || 0;
    });

    // Calculate equity (Assets - Total Debt)
    const equity = totalAssets - totalDebt;
    
    // Se patrimônio líquido é zero ou negativo, indicar situação crítica
    metrics.DIVIDA_PATRIMONIO_LIQUIDO = equity > 0 ? totalDebt / equity : (totalDebt > 0 ? 999 : 0);

    // 5. LTV (Loan to Value) - Outstanding land debt / Land value
    // Calculate only the outstanding balance (future payments) for land debts
    let landDebtOutstanding = 0;
    landDebts?.forEach(debt => {
      const fluxo = debt.fluxo_pagamento_anual || {};
      // Sum only future payments (from current year onwards)
      futureSafraIds.forEach(id => {
        const value = fluxo[id];
        if (typeof value === 'number' && !isNaN(value) && value > 0) {
          landDebtOutstanding += value;
        }
      });
    });

    const landValue = propriedades?.reduce((sum, prop) => sum + (prop.valor_atual || 0), 0) || 0;
    // LTV should be between 0 and 1 (or 0% to 100%)
    // If there's no land value, LTV should be 0 (not infinity)
    metrics.LTV = landValue > 0 ? Math.min(landDebtOutstanding / landValue, 1) : 0;

    // 6. MARGEM_EBITDA (EBITDA Margin)
    metrics.MARGEM_EBITDA = revenue > 0 ? (ebitda / revenue) * 100 : 0;

    // 7. ENTENDIMENTO_FLUXO_DE_CAIXA (Cash Flow Understanding - qualitative, set to 0)
    metrics.ENTENDIMENTO_FLUXO_DE_CAIXA = 0;

    console.log("Calculated metrics:", {
      year,
      safraName,
      safraId,
      totalDebt,
      revenue,
      ebitda,
      currentAssets,
      currentLiabilities,
      totalAssets,
      equity,
      landDebtTotal: 0, // TODO: Calculate land debt total
      landValue,
      metrics
    });

    return metrics;
  } catch (error) {
    console.error("Error calculating quantitative metrics:", error);
    return {
      LIQUIDEZ_CORRENTE: 0,
      DIVIDA_EBITDA: 0,
      DIVIDA_FATURAMENTO: 0,
      DIVIDA_PATRIMONIO_LIQUIDO: 0,
      LTV: 0,
      MARGEM_EBITDA: 0,
      ENTENDIMENTO_FLUXO_DE_CAIXA: 0,
    };
  }
}