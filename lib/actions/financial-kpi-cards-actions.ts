"use server";

import { 
  getFinancialMetrics, 
  getAvailableFinancialYears,
  type FinancialMetrics 
} from "@/lib/actions/financial-metrics-actions";
import { createClient } from "@/lib/supabase/server";

export interface SafraOption {
  id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
}

export interface FinancialKpiCardsData {
  metrics: FinancialMetrics | null;
  safras: SafraOption[];
  availableYears: number[];
  currentYear: number;
}

export async function getFinancialKpiCardsData(
  organizationId: string,
  year?: number,
  projectionId?: string
): Promise<FinancialKpiCardsData> {
  try {
    const currentYear = new Date().getFullYear();
    const supabase = await createClient();

    // Fetch all data in parallel
    const [metrics, safrasResult, availableYears] = await Promise.all([
      getFinancialMetrics(organizationId, year || currentYear, projectionId),
      supabase
        .from("safras")
        .select("id, nome, ano_inicio, ano_fim")
        .eq("organizacao_id", organizationId)
        .order("ano_inicio", { ascending: false }),
      getAvailableFinancialYears(organizationId)
    ]);

    // Process safras data
    const safras = safrasResult.data || [];

    return {
      metrics,
      safras,
      availableYears: availableYears.length > 0 ? availableYears : Array.from({ length: 16 }, (_, i) => 2020 + i),
      currentYear
    };
  } catch (error) {
    console.error("Erro ao buscar dados dos KPIs financeiros:", error);
    return {
      metrics: null,
      safras: [],
      availableYears: Array.from({ length: 16 }, (_, i) => 2020 + i),
      currentYear: new Date().getFullYear()
    };
  }
}

export async function prefetchMetricData(
  organizationId: string,
  metricType: string,
  projectionId?: string
): Promise<void> {
  try {
    // Import dynamically to avoid circular dependencies
    const { getFinancialHistoricalMetricData } = await import("@/lib/actions/financial-historical-metrics-actions");
    await getFinancialHistoricalMetricData(organizationId, metricType as any, projectionId);
  } catch (error) {
    // Prefetch errors are not critical
    console.error("Erro ao fazer prefetch da métrica:", error);
  }
}