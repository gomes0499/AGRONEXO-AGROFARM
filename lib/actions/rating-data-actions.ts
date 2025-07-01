"use server";

import { createClient } from "@/lib/supabase/server";
import type { RatingMetric, QualitativeMetricValue } from "@/schemas/rating";

export interface RatingMetricsData {
  metrics: RatingMetric[];
  qualitativeValues: QualitativeMetricValue[];
}

export async function getRatingMetricsData(organizationId: string): Promise<RatingMetricsData> {
  const supabase = await createClient();
  
  try {
    // Buscar métricas e valores qualitativos em paralelo
    const [metricsResult, qualitativeResult] = await Promise.all([
      supabase
        .from("rating_metrics")
        .select("*")
        .eq("organizacao_id", organizationId)
        .order("created_at", { ascending: false }),
      
      supabase
        .from("qualitative_metric_values")
        .select("*")
        .eq("organizacao_id", organizationId)
        .order("data_avaliacao", { ascending: false })
    ]);

    if (metricsResult.error) {
      console.error("Erro ao buscar métricas:", metricsResult.error);
      throw metricsResult.error;
    }

    if (qualitativeResult.error) {
      console.error("Erro ao buscar valores qualitativos:", qualitativeResult.error);
      throw qualitativeResult.error;
    }

    return {
      metrics: metricsResult.data || [],
      qualitativeValues: qualitativeResult.data || []
    };
  } catch (error) {
    console.error("Erro ao carregar dados de rating:", error);
    return {
      metrics: [],
      qualitativeValues: []
    };
  }
}