"use server";

import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import { getDebtPosition } from "./debt-position-actions";

export type FinancialIndicatorHistoricalData = {
  safraId: string;
  safraName: string;
  year: number;
  dividaReceita: number;
  dividaEbitda: number;
  dividaLiquidaReceita: number;
  dividaLiquidaEbitda: number;
};

type IndicatorType = 
  | "divida_receita" 
  | "divida_ebitda" 
  | "divida_liquida_receita" 
  | "divida_liquida_ebitda";

async function _getFinancialIndicatorHistoricalData(
  organizationId: string,
  indicatorType: IndicatorType
): Promise<FinancialIndicatorHistoricalData[]> {
  try {
    // Get debt position data (same as debt position table)
    const debtPosition = await getDebtPosition(organizationId);
    
    // Extract historical data from debt position
    const historicalData: FinancialIndicatorHistoricalData[] = debtPosition.anos.map(safraName => {
      const indicadores = debtPosition.indicadores.indicadores_calculados;
      
      // Extract year from safra name (e.g., "2025/26" -> 2025)
      const year = parseInt(safraName.split('/')[0]);
      
      return {
        safraId: safraName, // Using safra name as ID for simplicity
        safraName,
        year,
        dividaReceita: indicadores.divida_receita[safraName] || 0,
        dividaEbitda: indicadores.divida_ebitda[safraName] || 0,
        dividaLiquidaReceita: indicadores.divida_liquida_receita[safraName] || 0,
        dividaLiquidaEbitda: indicadores.divida_liquida_ebitda[safraName] || 0,
      };
    });

    return historicalData.sort((a, b) => a.year - b.year);
  } catch (error) {
    console.error("Erro ao buscar dados históricos de indicadores:", error);
    return [];
  }
}

// Export directly without caching for now to debug
export const getFinancialIndicatorHistoricalData = _getFinancialIndicatorHistoricalData;

// Get specific indicator data for chart
export async function getIndicatorChartData(
  organizationId: string,
  indicatorType: IndicatorType
) {
  const data = await getFinancialIndicatorHistoricalData(organizationId, indicatorType);
  
  // Format data for chart based on indicator type
  const chartData = data.map(item => {
    let value = 0;
    let label = "";
    
    switch (indicatorType) {
      case "divida_receita":
        value = item.dividaReceita;
        label = "Dívida/Receita";
        break;
      case "divida_ebitda":
        value = item.dividaEbitda;
        label = "Dívida/EBITDA";
        break;
      case "divida_liquida_receita":
        value = item.dividaLiquidaReceita;
        label = "Dívida Líquida/Receita";
        break;
      case "divida_liquida_ebitda":
        value = item.dividaLiquidaEbitda;
        label = "Dívida Líquida/EBITDA";
        break;
    }
    
    return {
      safra: item.safraName,
      year: item.year,
      value: Number(value.toFixed(2)),
      label,
    };
  });
  
  return {
    chartData,
    indicatorType,
  };
}