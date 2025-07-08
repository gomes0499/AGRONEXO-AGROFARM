"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Calculate metrics using optimized SQL function (recommended)
 */
export async function calculateQuantitativeMetricsOptimized(
  organizationId: string,
  safraId?: string,
  projectionId?: string | null
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
      return calculateQuantitativeMetrics(organizationId, safraId, projectionId);
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
    return calculateQuantitativeMetrics(organizationId, safraId, projectionId);
  }
}

// Calculate metrics directly without RPC (legacy method)
export async function calculateQuantitativeMetrics(
  organizationId: string,
  safraId?: string,
  projectionId?: string | null
): Promise<Record<string, number>> {
  const supabase = await createClient();
  const metrics: Record<string, number> = {};
  
  console.log("Calculating metrics for org:", organizationId, "safra:", safraId, "projection:", projectionId);
  
  try {
    // Import the same functions used in financial metrics
    const { getDebtPosition } = await import("./debt-position-actions");
    const { getCultureProjections } = await import("./culture-projections-actions");
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
      year = safraData.ano_fim;
    }

    // Get debt position and culture projections using the same functions as financial metrics
    const debtPosition = await getDebtPosition(organizationId, projectionId || undefined);
    const cultureProjections = await getCultureProjections(organizationId, projectionId || undefined);
    
    console.log("Rating metrics - debtPosition indicators:", debtPosition.indicadores);
    console.log("Rating metrics - cultureProjections consolidado:", cultureProjections.consolidado);
    console.log("Rating metrics - safraName:", safraName);
    
    // Get values for the specific safra
    const dividaTotal = debtPosition.indicadores.endividamento_total[safraName] || 0;
    const dividaLiquida = debtPosition.indicadores.divida_liquida[safraName] || 0;
    const patrimonioLiquido = debtPosition.indicadores.patrimonio_liquido[safraName] || 0;
    const ltv = debtPosition.indicadores.ltv[safraName] || 0;
    const caixasDisponibilidades = debtPosition.indicadores.caixas_disponibilidades[safraName] || 0;
    
    // Get financial data from culture projections
    let receita = 0;
    let ebitda = 0;
    let custoTotal = 0;
    
    if (cultureProjections.consolidado && 
        cultureProjections.consolidado.projections_by_year && 
        cultureProjections.consolidado.projections_by_year[safraName]) {
      receita = cultureProjections.consolidado.projections_by_year[safraName].receita || 0;
      custoTotal = cultureProjections.consolidado.projections_by_year[safraName].custo_total || 0;
      ebitda = cultureProjections.consolidado.projections_by_year[safraName].ebitda || 0;
    }
    
    console.log("Debt and financial data:", {
      safraName,
      dividaTotal,
      dividaLiquida,
      patrimonioLiquido,
      ltv,
      receita,
      ebitda,
      custoTotal
    });
    
    // Calculate metrics using the same logic as financial metrics module
    
    // 1. LIQUIDEZ_CORRENTE - Get from debt position indicators
    // Calculate liquidez corrente = ativos circulantes / passivos circulantes
    // Using caixas_disponibilidades as proxy for ativos circulantes
    // and endividamento_total as proxy for passivos circulantes
    const ativosCirculantes = caixasDisponibilidades;
    const passivosCirculantes = dividaTotal;
    const liquidezCorrente = passivosCirculantes > 0 ? ativosCirculantes / passivosCirculantes : 1.0;
    metrics.LIQUIDEZ_CORRENTE = liquidezCorrente;

    // 2. DIVIDA_EBITDA
    if (debtPosition.indicadores.indicadores_calculados?.divida_ebitda?.[safraName] !== undefined) {
      metrics.DIVIDA_EBITDA = debtPosition.indicadores.indicadores_calculados.divida_ebitda[safraName];
    } else {
      // Fallback calculation
      metrics.DIVIDA_EBITDA = ebitda > 0 ? dividaTotal / ebitda : (dividaTotal > 0 ? 999 : 0);
    }
    
    // 3. DIVIDA_FATURAMENTO
    if (debtPosition.indicadores.indicadores_calculados?.divida_receita?.[safraName] !== undefined) {
      metrics.DIVIDA_FATURAMENTO = debtPosition.indicadores.indicadores_calculados.divida_receita[safraName];
    } else {
      // Fallback calculation
      metrics.DIVIDA_FATURAMENTO = receita > 0 ? dividaTotal / receita : (dividaTotal > 0 ? 999 : 0);
    }
    
    // 4. DIVIDA_PATRIMONIO_LIQUIDO
    // Ajustar cálculo para considerar valor absoluto do patrimônio líquido
    // Se patrimônio líquido for negativo, a métrica deve ser alta (ruim)
    if (patrimonioLiquido < 0) {
      // Patrimônio líquido negativo = situação crítica
      metrics.DIVIDA_PATRIMONIO_LIQUIDO = 999;
    } else if (patrimonioLiquido > 0) {
      metrics.DIVIDA_PATRIMONIO_LIQUIDO = dividaTotal / patrimonioLiquido;
    } else {
      // Patrimônio líquido zero
      metrics.DIVIDA_PATRIMONIO_LIQUIDO = dividaTotal > 0 ? 999 : 0;
    }
    
    // 5. LTV - já vem em porcentagem da posição de dívida
    metrics.LTV = ltv / 100; // Converter de porcentagem para decimal (0-1)
    
    // 6. MARGEM_EBITDA
    metrics.MARGEM_EBITDA = receita > 0 ? (ebitda / receita) * 100 : 0;

    // 7. ENTENDIMENTO_FLUXO_DE_CAIXA (Cash Flow Understanding - qualitative, set to 0)
    metrics.ENTENDIMENTO_FLUXO_DE_CAIXA = 0;

    console.log("Calculated metrics:", {
      safraName,
      projectionId,
      dividaTotal,
      receita,
      ebitda,
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