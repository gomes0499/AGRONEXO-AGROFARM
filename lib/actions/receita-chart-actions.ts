"use server";

import { 
  getReceitaChart, 
  getCulturaColors, 
  type RevenueData as CultureRevenueData 
} from "@/lib/actions/production-chart-actions";
import { getSafras } from "@/lib/actions/production-actions";

export interface ReceitaChartData {
  chartData: CultureRevenueData[];
  culturaColors: Record<string, string>;
  safras: any[];
}

export async function getReceitaChartData(
  organizationId: string,
  propertyIds?: string[],
  cultureIds?: string[],
  projectionId?: string
): Promise<ReceitaChartData> {
  try {
    // Fetch all data in parallel
    const [chartData, culturaColors, safras] = await Promise.all([
      getReceitaChart(organizationId, propertyIds, cultureIds, projectionId),
      getCulturaColors(organizationId),
      getSafras(organizationId),
    ]);

    return {
      chartData: chartData || [],
      culturaColors: culturaColors || {},
      safras: safras || []
    };
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico de receita:", error);
    return {
      chartData: [],
      culturaColors: {},
      safras: []
    };
  }
}