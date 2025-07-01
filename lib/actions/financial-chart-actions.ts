"use server";

import { 
  getFinancialChart, 
  type FinancialData as ProductionFinancialChartData 
} from "@/lib/actions/production-chart-actions";
import { getSafras } from "@/lib/actions/production-actions";

export interface FinancialChartData {
  chartData: ProductionFinancialChartData[];
  safras: any[];
}

export async function getFinancialChartData(
  organizationId: string,
  propertyIds?: string[],
  cultureIds?: string[],
  projectionId?: string
): Promise<FinancialChartData> {
  try {
    // Fetch all data in parallel
    const [chartData, safras] = await Promise.all([
      getFinancialChart(organizationId, propertyIds, cultureIds, projectionId),
      getSafras(organizationId),
    ]);

    return {
      chartData: chartData || [],
      safras: safras || []
    };
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico financeiro:", error);
    return {
      chartData: [],
      safras: []
    };
  }
}