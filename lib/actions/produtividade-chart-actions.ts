"use server";

import { 
  getProdutividadeChart, 
  getCulturaColors, 
  type ProductivityData as CultureProductivityData 
} from "@/lib/actions/production-chart-actions";
import { getSafras } from "@/lib/actions/production-actions";

export interface ProdutividadeChartData {
  chartData: CultureProductivityData[];
  culturaColors: Record<string, string>;
  safras: any[];
}

export async function getProdutividadeChartData(
  organizationId: string,
  propertyIds?: string[],
  cultureIds?: string[],
  projectionId?: string
): Promise<ProdutividadeChartData> {
  try {
    // Fetch all data in parallel
    const [chartData, culturaColors, safras] = await Promise.all([
      getProdutividadeChart(organizationId, propertyIds, cultureIds, projectionId),
      getCulturaColors(organizationId),
      getSafras(organizationId),
    ]);

    return {
      chartData: chartData || [],
      culturaColors: culturaColors || {},
      safras: safras || []
    };
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico de produtividade:", error);
    return {
      chartData: [],
      culturaColors: {},
      safras: []
    };
  }
}