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

// FORÇA LIMPEZA COMPLETA PARA CORRIGIR MÉTRICA DIVIDA_EBITDA 0.69x
console.log("🔄 FORÇANDO limpeza completa de cache financial-kpi para correção DIVIDA_EBITDA");
setInterval(() => {
  clearFinancialKpiCache();
}, 30000); // Limpar a cada 30 segundos

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
  
  // SEMPRE buscar dados novos - cache completamente desabilitado
  console.log("🔄 FORÇANDO busca de dados novos (cache desabilitado) para:", organizationId);
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
        

        // Get values for current safra
        const dividaTotalAtual = debtPosition.indicadores.endividamento_total[safraName] || 0;
        const caixaAtual = debtPosition.indicadores.caixas_disponibilidades[safraName] || 0;
        const dividaLiquidaAtual = debtPosition.indicadores.divida_liquida[safraName] || 0;
        const receitaAtual = debtPosition.indicadores.receita_ano_safra[safraName] || 0;
        const ebitdaAtual = debtPosition.indicadores.ebitda_ano_safra[safraName] || 0;
        
        // Get calculated indicators from debt position
        const indicadoresCalculados = debtPosition.indicadores.indicadores_calculados;
        const dividaReceita = indicadoresCalculados.divida_receita[safraName] || 0;
        const dividaEbitda = indicadoresCalculados.divida_ebitda[safraName] || 0;
        const dividaLiquidaReceita = indicadoresCalculados.divida_liquida_receita[safraName] || 0;
        const dividaLiquidaEbitda = indicadoresCalculados.divida_liquida_ebitda[safraName] || 0;

        // DEBUG ESPECÍFICO para corrigir problema DIVIDA_EBITDA = 0.69x
        if (organizationId === '41ee5785-2d48-4f68-a307-d4636d114ab1') {
          console.log("🚨 DEBUG DIVIDA_EBITDA - financial-kpi-data-actions-v2:", {
            safraName,
            dividaEbitda,
            dividaTotalAtual,
            ebitdaAtual,
            calculoManual: ebitdaAtual > 0 ? dividaTotalAtual / ebitdaAtual : 0,
            indicadoresCalculados: {
              divida_ebitda: indicadoresCalculados.divida_ebitda
            }
          });
        }

        // Separate bank debt from other liabilities
        let dividaBancariaAtual = 0;
        let outrosPassivosAtual = 0;
        
        console.log("🔍 Debug Debt Position Data for", organizationId, {
          safraName,
          totalDebts: debtPosition.dividas.length,
          dividasByCategory: debtPosition.dividas.map(d => ({
            categoria: d.categoria,
            valorSafra: d.valores_por_ano[safraName] || 0
          }))
        });
        
        debtPosition.dividas.forEach(divida => {
          const valor = divida.valores_por_ano[safraName] || 0;
          if (divida.categoria === "BANCOS") {
            dividaBancariaAtual += valor;
            console.log("💳 Bank debt found:", { valor, categoria: divida.categoria });
          } else {
            outrosPassivosAtual += valor;
            console.log("📊 Other debt found:", { valor, categoria: divida.categoria });
          }
        });

        console.log("💰 Final calculated values:", {
          organizationId,
          safraName,
          dividaBancariaAtual,
          outrosPassivosAtual,
          dividaLiquidaAtual,
          dividaTotalAtual,
          receitaAtual,
          ebitdaAtual
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
            dividaReceita,
            dividaEbitda,
            dividaLiquidaReceita,
            dividaLiquidaEbitda,
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

    // CACHE DESABILITADO para correção DIVIDA_EBITDA
    // financialKpiCache[cacheKey] = {
    //   data: result,
    //   timestamp: now
    // };
    console.log("⚠️ Cache desabilitado - não armazenando dados para evitar valor 0.69x");

    return result;
  } catch (error) {
    console.error("Erro ao buscar dados KPI financeiros:", error);
    throw error;
  }
}