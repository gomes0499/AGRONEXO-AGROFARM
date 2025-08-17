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
    return {
      LIQUIDEZ_CORRENTE: 0,
      DIVIDA_EBITDA: 0,
      DIVIDA_FATURAMENTO: 0,
      DIVIDA_PATRIMONIO_LIQUIDO: 0,
      LTV: 0,
      MARGEM_EBITDA: 0,
      ENTENDIMENTO_FLUXO_DE_CAIXA: 0,
      AREA_PROPRIA: 0,
      CULTURAS_CORE: 0,
      TENDENCIA_PRODUTIVIDADE_5_ANOS: 0,
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
        AREA_PROPRIA: 0,
        CULTURAS_CORE: 0,
        TENDENCIA_PRODUTIVIDADE: 0,
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
      AREA_PROPRIA: Number(result.area_propria || 0),
      CULTURAS_CORE: Number(result.culturas_core || 0),
      TENDENCIA_PRODUTIVIDADE: Number(result.tendencia_produtividade_5_anos || 0),
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
  
  try {
    // Import the same functions used in financial metrics
    const { getDebtPosition } = await import("./debt-position-actions");
    const { getCultureProjections } = await import("./culture-projections-actions");
    // Get safra details
    let year = new Date().getFullYear();
    let safraName = "";
    
    if (!safraId) {
      return {
        LIQUIDEZ_CORRENTE: 0,
        DIVIDA_EBITDA: 0,
        DIVIDA_FATURAMENTO: 0,
        DIVIDA_PATRIMONIO_LIQUIDO: 0,
        LTV: 0,
        MARGEM_EBITDA: 0,
        ENTENDIMENTO_FLUXO_DE_CAIXA: 0,
        AREA_PROPRIA: 0,
        CULTURAS_CORE: 0,
        TENDENCIA_PRODUTIVIDADE: 0,
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
    
    
    // Calculate metrics using the same logic as financial metrics module
    
    // 1. LIQUIDEZ_CORRENTE - Get from debt position indicators
    // Calculate liquidez corrente = ativos circulantes / passivos circulantes
    // Ativos circulantes incluem: caixas_disponibilidades + ativo biológico
    
    // Buscar ativo biológico
    let ativoBiologico = 0;
    if (debtPosition.indicadores.ativo_biologico && debtPosition.indicadores.ativo_biologico[safraName]) {
      ativoBiologico = debtPosition.indicadores.ativo_biologico[safraName];
    }
    
    const ativosCirculantes = caixasDisponibilidades + ativoBiologico;
    const passivosCirculantes = dividaTotal;
    
    // Calcular liquidez corrente sem valor padrão
    let liquidezCorrente = 0;
    if (passivosCirculantes > 0) {
      liquidezCorrente = ativosCirculantes / passivosCirculantes;
    } else if (ativosCirculantes > 0) {
      // Se há ativos mas não há passivos, liquidez é extremamente alta
      liquidezCorrente = 999.99;
    } else {
      // Sem ativos nem passivos
      liquidezCorrente = 0;
    }
    
    
    metrics.LIQUIDEZ_CORRENTE = liquidezCorrente;

    // 2. DIVIDA_EBITDA - Usar sempre dados reais (não da tabela projecoes_posicao_divida)
    // Forçar uso dos dados reais do debt position e DRE
    // Calculate ratio even when EBITDA is negative to show true financial situation
    metrics.DIVIDA_EBITDA = ebitda !== 0 ? dividaTotal / ebitda : (dividaTotal > 0 ? 999 : 0);
    
    // 3. DIVIDA_FATURAMENTO - Usar sempre dados reais
    metrics.DIVIDA_FATURAMENTO = receita > 0 ? dividaTotal / receita : (dividaTotal > 0 ? 999 : 0);
    
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
    
    // 5. LTV - converter de percentual para decimal para comparação com thresholds
    metrics.LTV = ltv / 100; // Converter para decimal (0-1) para comparação com thresholds
    
    // 6. MARGEM_EBITDA
    metrics.MARGEM_EBITDA = receita > 0 ? (ebitda / receita) * 100 : 0;

    // 7. ENTENDIMENTO_FLUXO_DE_CAIXA (Cash Flow Understanding - qualitative, set to 0)
    metrics.ENTENDIMENTO_FLUXO_DE_CAIXA = 0;

    // 8. AREA_PROPRIA - Calculate percentage of leased area
    // Import property stats function to get area data
    const { getPropertyStats } = await import("./property-stats-actions");
    const propertyStats = await getPropertyStats(organizationId);
    
    // Calculate percentage of leased area (arrendada)
    const areaTotal = propertyStats.areaTotal || 0;
    const areaArrendada = propertyStats.areaPropriedadesArrendadas || 0;
    
    metrics.AREA_PROPRIA = areaTotal > 0 ? (areaArrendada / areaTotal) * 100 : 0;


    // 9. CULTURAS_CORE - Calculate percentage of area with core crops (soja, milho, algodão)
    // Import culture projections to get area by crop
    const coreCrops = ['soja', 'milho', 'algodão', 'algodao'];
    let areaCoreTotal = 0;
    let areaPlantadaTotal = 0;
    
    if (cultureProjections.projections && cultureProjections.projections.length > 0) {
      // Get data for the specific safra year
      cultureProjections.projections.forEach(projection => {
        const projectionData = projection.projections_by_year[safraName];
        if (projectionData && projectionData.area_plantada) {
          areaPlantadaTotal += projectionData.area_plantada;
          
          // Check if this is a core crop
          const culturaNome = projection.cultura_nome.toLowerCase();
          if (coreCrops.some(crop => culturaNome.includes(crop))) {
            areaCoreTotal += projectionData.area_plantada;
          }
        }
      });
    }
    
    metrics.CULTURAS_CORE = areaPlantadaTotal > 0 ? (areaCoreTotal / areaPlantadaTotal) * 100 : 0;


    // 10. TENDENCIA_PRODUTIVIDADE - Calculate 5-year productivity trend
    metrics.TENDENCIA_PRODUTIVIDADE = await calculate5YearProductivityTrend(
      supabase,
      organizationId,
      year
    );

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
      AREA_PROPRIA: 0,
      CULTURAS_CORE: 0,
      TENDENCIA_PRODUTIVIDADE_5_ANOS: 0,
    };
  }
}

// Helper function to calculate 5-year productivity trend
async function calculate5YearProductivityTrend(
  supabase: any,
  organizationId: string,
  currentYear: number
): Promise<number> {
  try {
    // Get the last 5 years of safras (including current year)
    const startYear = currentYear - 5;
    
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .gte("ano_fim", startYear)
      .lte("ano_fim", currentYear)
      .order("ano_inicio", { ascending: true });

    if (safrasError || !safras || safras.length < 2) {
      return 0;
    }

    // Get productivity data for these safras
    const { data: produtividades, error: prodError } = await supabase
      .from("produtividades")
      .select("produtividades_por_safra, cultura_id")
      .eq("organizacao_id", organizationId);

    if (prodError || !produtividades || produtividades.length === 0) {
      return 0;
    }

    // Calculate average productivity for each year
    const yearlyProductivity: { year: number; productivity: number }[] = [];
    
    for (const safra of safras) {
      let totalProd = 0;
      let count = 0;
      
      for (const prod of produtividades) {
        const safraProductivity = prod.produtividades_por_safra?.[safra.id];
        if (safraProductivity && safraProductivity > 0) {
          totalProd += safraProductivity;
          count++;
        }
      }
      
      if (count > 0) {
        yearlyProductivity.push({
          year: safra.ano_fim,
          productivity: totalProd / count
        });
      }
    }

    if (yearlyProductivity.length < 2) {
      return 0;
    }

    // Calculate linear regression to determine trend
    const n = yearlyProductivity.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    yearlyProductivity.forEach((point, index) => {
      const x = index; // Use index as x to avoid large year numbers
      const y = point.productivity;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    // Calculate slope (rate of change)
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Calculate average productivity
    const avgProductivity = sumY / n;
    
    // Calculate percentage change per year
    const percentageChangePerYear = avgProductivity > 0 ? (slope / avgProductivity) * 100 : 0;
    
    // Calculate total percentage change over the period
    const totalPercentageChange = percentageChangePerYear * (n - 1);
  

    // Return the total percentage change
    // Positive values indicate growth, negative values indicate decline
    return totalPercentageChange;
    
  } catch (error) {
    console.error("Error calculating 5-year productivity trend:", error);
    return 0;
  }
}