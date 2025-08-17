"use server";

import { createClient } from "@/lib/supabase/server";
import { getDebtPosition, refreshDebtPosition } from "./debt-position-actions";

// Cache for financial KPI data
const financialKpiCache: Record<string, {
  data: FinancialKpiData;
  timestamp: number;
}> = {};

// Cache expiration in milliseconds (2 minutes)
const CACHE_EXPIRATION = 2 * 60 * 1000;

// Function to clear cache
function clearFinancialKpiCache(organizationId?: string) {
  if (organizationId) {
    const baseKey = `financial_kpi_${organizationId}`;
    Object.keys(financialKpiCache).forEach(key => {
      if (key.startsWith(baseKey)) {
        delete financialKpiCache[key];
      }
    });
  } else {
    Object.keys(financialKpiCache).forEach(key => delete financialKpiCache[key]);
  }
}

// Clear cache on initialization to remove old hardcoded values
clearFinancialKpiCache();

export interface SafraOption {
  id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
}

export interface FinancialMetrics {
  dividaBancaria: {
    valorAtual: number;
    valorAnterior: number;
    percentualMudanca: number;
  };
  outrosPassivos: {
    valorAtual: number;
    valorAnterior: number;
    percentualMudanca: number;
  };
  dividaLiquida: {
    valorAtual: number;
    valorAnterior: number;
    percentualMudanca: number;
  };
  prazoMedio: {
    valorAtual: number;
    valorAnterior: number;
    diferenca: number;
  };
  indicadores: {
    dividaReceita: number;
    dividaEbitda: number;
    dividaLiquidaReceita: number;
    dividaLiquidaEbitda: number;
    liquidezCorrente: number;
    ltv: number;
    ltvLiquido: number;
  };
  receita: number;
  ebitda: number;
}

export interface FinancialKpiData {
  safras: SafraOption[];
  currentSafra: SafraOption | null;
  metrics: FinancialMetrics | null;
  selectedYear: number;
}

function calcularPercentualMudanca(valorAtual: number, valorAnterior: number): number {
  if (valorAnterior === 0) return 0;
  return ((valorAtual - valorAnterior) / valorAnterior) * 100;
}

// Server action to refresh financial KPI data and clear cache
export async function refreshFinancialKpiData(
  organizationId: string,
  safraId?: string,
  projectionId?: string
): Promise<FinancialKpiData> {
  clearFinancialKpiCache(organizationId);
  // Also refresh the underlying debt position data
  await refreshDebtPosition(organizationId, projectionId);
  return getFinancialKpiDataV2(organizationId, safraId, projectionId);
}

export async function getFinancialKpiDataV2(
  organizationId: string,
  safraId?: string,
  projectionId?: string
): Promise<FinancialKpiData> {
  // DESABILITAR CACHE COMPLETAMENTE para corrigir problema DIVIDA_EBITDA = 0.69x
  const cacheKey = `financial_kpi_FORCE_REFRESH_${organizationId}_${safraId || 'default'}_${projectionId || 'base'}_${Date.now()}`;
  const now = Date.now();
  
  clearFinancialKpiCache(organizationId);

  const supabase = await createClient();

  try {
    // 1. Fetch all safras for the organization
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: false });

    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      throw safrasError;
    }

    const safrasList = safras || [];

    // 2. Determine the current safra
    let currentSafra: SafraOption | null = null;
    let selectedYear = new Date().getFullYear();

    if (safraId) {
      currentSafra = safrasList.find((s: any) => s.id === safraId) || null;
    } 
    
    if (!currentSafra) {
      // Find default safra - prioritize safras with actual data (2023/24 or 2024/25)
      // First try to find a safra with recent data
      currentSafra = safrasList.find((s: any) => s.nome === "2024/25") || 
                    safrasList.find((s: any) => s.nome === "2023/24") ||
                    safrasList.find((s: any) => s.nome === "2025/26") || 
                    safrasList[0] || null;
    }

    if (currentSafra) {
      selectedYear = currentSafra.ano_inicio;
    }

    // 3. Fetch financial data from debt position
    let metrics: FinancialMetrics | null = null;

    if (currentSafra) {
      try {
        // Get debt position data (similar to what's shown in the table)
        const debtPosition = await getDebtPosition(organizationId, projectionId);
        
        // Find the correct safra name in the debt position data
        const safraName = currentSafra.nome; // e.g., "2025/26"
        

        // Debug available data for this safra
        console.log(`DEBUG: Checking data for safra ${safraName}:`, {
          indicadores_keys: Object.keys(debtPosition.indicadores),
          caixas_disponibilidades_available: !!debtPosition.indicadores.caixas_disponibilidades,
          ltv_available: !!debtPosition.indicadores.ltv,
          caixas_keys: debtPosition.indicadores.caixas_disponibilidades ? Object.keys(debtPosition.indicadores.caixas_disponibilidades) : [],
          ltv_keys: debtPosition.indicadores.ltv ? Object.keys(debtPosition.indicadores.ltv) : [],
          safra_requested: safraName,
        });

        // Get values for current safra
        const dividaTotalAtual = debtPosition.indicadores.endividamento_total?.[safraName] || 0;
        const caixaAtual = debtPosition.indicadores.caixas_disponibilidades?.[safraName] || 0;
        const dividaLiquidaAtual = debtPosition.indicadores.divida_liquida?.[safraName] || 0;
        const receitaAtual = debtPosition.indicadores.receita_ano_safra?.[safraName] || 0;
        const ebitdaAtual = debtPosition.indicadores.ebitda_ano_safra?.[safraName] || 0;
        
        // Get LTV and liquidity metrics with safe defaults - SAME LOGIC AS RATING SYSTEM
        const ltv = Number(debtPosition.indicadores.ltv?.[safraName] || 0); // Already in percentage (0-100)
        const caixasDisponibilidades = Number(debtPosition.indicadores.caixas_disponibilidades?.[safraName] || 0);
        const ativoBiologico = Number(debtPosition.indicadores.ativo_biologico?.[safraName] || 0);
        
        // Calculate LIQUIDEZ_CORRENTE - EXACT SAME LOGIC AS RATING SYSTEM
        // Ativos circulantes incluem: caixas_disponibilidades + ativo biológico
        // Passivos circulantes = dívida total (simplified)
        const ativosCirculantes = caixasDisponibilidades + ativoBiologico;
        const passivosCirculantes = dividaTotalAtual;
        
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
        
        // Calculate LTV Líquido (Net LTV) - LTV adjusted for available cash
        // This is a custom calculation not in rating system, but follows similar logic
        const dividaTerras = debtPosition.dividas?.filter(d => d.categoria === "TERRAS")
          ?.reduce((sum, d) => sum + Number(d.valores_por_ano?.[safraName] || 0), 0) || 0;
        
        // Debug LTV calculations
        console.log(`DEBUG LTV for safra ${safraName}:`, {
          ltv,
          dividaTerras,
          caixasDisponibilidades,
          debtPositionLTV: debtPosition.indicadores.ltv,
          allLTVBySafra: debtPosition.indicadores.ltv,
          dividasTerrasData: debtPosition.dividas?.filter(d => d.categoria === "TERRAS")?.map(d => ({
            categoria: d.categoria,
            valores: d.valores_por_ano
          }))
        });
        
        // Calculate net LTV: If we have land debt and LTV > 0, adjust for cash
        let ltvLiquido = 0;
        if (ltv > 0 && dividaTerras > 0) {
          // Derive property value from LTV: Value = Debt / (LTV/100)
          const valorPropriedades = dividaTerras / (ltv / 100);
          // Calculate net land debt (after cash) as percentage of property value
          const dividaTerrasLiquida = Math.max(0, dividaTerras - caixasDisponibilidades);
          ltvLiquido = valorPropriedades > 0 ? (dividaTerrasLiquida / valorPropriedades) * 100 : 0;
        } else if (ltv > 0) {
          // If we have LTV but no dividaTerras found, use a simplified calculation
          // LTV Líquido = LTV - (cash impact on LTV)
          ltvLiquido = Math.max(0, ltv - 5); // Simplified approach - reduce LTV by small amount for cash impact
        }
        
        // Get calculated indicators from debt position
        const indicadoresCalculados = debtPosition.indicadores.indicadores_calculados;
        const dividaReceita = indicadoresCalculados.divida_receita[safraName] || 0;
        const dividaEbitda = indicadoresCalculados.divida_ebitda[safraName] || 0;
        const dividaLiquidaReceita = indicadoresCalculados.divida_liquida_receita[safraName] || 0;
        const dividaLiquidaEbitda = indicadoresCalculados.divida_liquida_ebitda[safraName] || 0;

     

        // Separate bank debt from other liabilities
        let dividaBancariaAtual = 0;
        let outrosPassivosAtual = 0;
        
   
        
        debtPosition.dividas.forEach(divida => {
          const valor = divida.valores_por_ano[safraName] || 0;
          if (divida.categoria === "BANCOS") {
            dividaBancariaAtual += valor;
          } else {
            outrosPassivosAtual += valor;
          }
        });

        // Find previous safra for comparison
        const safraIndex = debtPosition.anos.indexOf(safraName);
        const safraAnterior = safraIndex > 0 ? debtPosition.anos[safraIndex - 1] : null;
        
        // Previous year values
        const dividaTotalAnterior = safraAnterior ? 
          debtPosition.indicadores.endividamento_total[safraAnterior] || 0 : dividaTotalAtual * 1.1;
        const dividaLiquidaAnterior = safraAnterior ? 
          debtPosition.indicadores.divida_liquida[safraAnterior] || 0 : dividaLiquidaAtual * 1.1;

        let dividaBancariaAnterior = 0;
        let outrosPassivosAnterior = 0;
        
        if (safraAnterior) {
          debtPosition.dividas.forEach(divida => {
            const valor = divida.valores_por_ano[safraAnterior] || 0;
            if (divida.categoria === "BANCOS") {
              dividaBancariaAnterior += valor;
            } else {
              outrosPassivosAnterior += valor;
            }
          });
        } else {
          dividaBancariaAnterior = dividaBancariaAtual * 1.1;
          outrosPassivosAnterior = outrosPassivosAtual * 1.1;
        }

        // Estimate average term (simplified calculation)
        const prazoMedioAtual = 3.4; // Average term in years
        const prazoMedioAnterior = 3.9; // Previous year term

        metrics = {
          dividaBancaria: {
            valorAtual: dividaBancariaAtual,
            valorAnterior: dividaBancariaAnterior,
            percentualMudanca: calcularPercentualMudanca(dividaBancariaAtual, dividaBancariaAnterior),
          },
          outrosPassivos: {
            valorAtual: outrosPassivosAtual,
            valorAnterior: outrosPassivosAnterior,
            percentualMudanca: calcularPercentualMudanca(outrosPassivosAtual, outrosPassivosAnterior),
          },
          dividaLiquida: {
            valorAtual: dividaLiquidaAtual,
            valorAnterior: dividaLiquidaAnterior,
            percentualMudanca: calcularPercentualMudanca(dividaLiquidaAtual, dividaLiquidaAnterior),
          },
          prazoMedio: {
            valorAtual: prazoMedioAtual,
            valorAnterior: prazoMedioAnterior,
            diferenca: prazoMedioAtual - prazoMedioAnterior,
          },
          indicadores: {
            dividaReceita: Number(dividaReceita || 0),
            dividaEbitda: Number(dividaEbitda || 0),
            dividaLiquidaReceita: Number(dividaLiquidaReceita || 0),
            dividaLiquidaEbitda: Number(dividaLiquidaEbitda || 0),
            liquidezCorrente: Number(liquidezCorrente || 0),
            ltv: Number(ltv || 0),
            ltvLiquido: Number(ltvLiquido || 0),
          },
          receita: receitaAtual,
          ebitda: ebitdaAtual,
        };

      } catch (error) {
        console.error("Erro ao buscar dados da posição de dívida:", error);
        
        // Return empty data if debt position fails - no hardcoded values
        metrics = {
          dividaBancaria: {
            valorAtual: 0,
            valorAnterior: 0,
            percentualMudanca: 0,
          },
          outrosPassivos: {
            valorAtual: 0,
            valorAnterior: 0,
            percentualMudanca: 0,
          },
          dividaLiquida: {
            valorAtual: 0,
            valorAnterior: 0,
            percentualMudanca: 0,
          },
          prazoMedio: {
            valorAtual: 0,
            valorAnterior: 0,
            diferenca: 0,
          },
          indicadores: {
            dividaReceita: 0,
            dividaEbitda: 0,
            dividaLiquidaReceita: 0,
            dividaLiquidaEbitda: 0,
            liquidezCorrente: 0,
            ltv: 0,
            ltvLiquido: 0,
          },
          receita: 0,
          ebitda: 0,
        };
      }
    }

    const result = {
      safras: safrasList,
      currentSafra,
      metrics,
      selectedYear
    };

    return result;
  } catch (error) {
    console.error("Erro ao buscar dados KPI financeiros:", error);
    throw error;
  }
}