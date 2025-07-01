"use server";

import { 
  getAreaPlantadaChart, 
  getCulturaColors, 
  type CultureAreaData 
} from "@/lib/actions/production-chart-actions";
import { getSafras } from "@/lib/actions/production-actions";

export interface AreaPlantadaChartData {
  chartData: CultureAreaData[];
  culturaColors: Record<string, string>;
  safras: any[];
}

export async function getAreaPlantadaChartData(
  organizationId: string,
  propertyIds?: string[],
  cultureIds?: string[],
  projectionId?: string
): Promise<AreaPlantadaChartData> {
  try {
    // Fetch all data in parallel
    const [chartData, culturaColors, safras] = await Promise.all([
      getAreaPlantadaChart(organizationId, propertyIds, cultureIds, projectionId),
      getCulturaColors(organizationId),
      getSafras(organizationId),
    ]);

    return {
      chartData: chartData || [],
      culturaColors: culturaColors || {},
      safras: safras || []
    };
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico de área plantada:", error);
    return {
      chartData: [],
      culturaColors: {},
      safras: []
    };
  }
}