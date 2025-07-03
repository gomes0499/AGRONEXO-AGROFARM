"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  RatingModel,
  RatingMetric,
  RatingModelMetric,
  RatingMetricThreshold,
  RatingCalculation,
  QualitativeMetricValue,
  CreateRatingModel,
  UpdateRatingModel,
  CreateRatingMetric,
  UpdateRatingMetric,
  CreateQualitativeValue,
  RatingModelWithMetrics,
} from "@/schemas/rating";
import { getRatingFromScore } from "@/schemas/rating";
import { calculateQuantitativeMetrics } from "./rating-metrics-calculations";

// Rating Models
export async function getRatingModels(organizationId: string): Promise<RatingModel[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("rating_models")
    .select("*")
    .eq("organizacao_id", organizationId)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("nome");

  if (error) {
    console.error("Error fetching rating models:", error);
    throw new Error("Erro ao buscar modelos de rating");
  }

  // Parse flow_data for each model if it's a string
  const models = data || [];
  return models.map(model => {
    if (model.flow_data && typeof model.flow_data === 'string') {
      try {
        model.flow_data = JSON.parse(model.flow_data);
      } catch (e) {
        console.error("Error parsing flow_data:", e);
      }
    }
    return model;
  });
}

export async function getRatingModel(modelId: string): Promise<RatingModel> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("rating_models")
    .select("*")
    .eq("id", modelId)
    .single();

  if (error) {
    console.error("Error fetching rating model:", error);
    throw new Error("Erro ao buscar modelo de rating");
  }

  // Parse flow_data if it's a string
  if (data.flow_data && typeof data.flow_data === 'string') {
    try {
      data.flow_data = JSON.parse(data.flow_data);
    } catch (e) {
      console.error("Error parsing flow_data:", e);
    }
  }

  return data;
}

export async function createRatingModel(model: CreateRatingModel): Promise<RatingModel> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("rating_models")
    .insert(model)
    .select()
    .single();

  if (error) {
    console.error("Error creating rating model:", error);
    throw new Error("Erro ao criar modelo de rating");
  }

  revalidatePath("/dashboard/indicators");
  return data;
}

export async function updateRatingModel(modelId: string, model: UpdateRatingModel): Promise<RatingModel> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("rating_models")
    .update({ ...model, updated_at: new Date().toISOString() })
    .eq("id", modelId)
    .select()
    .single();

  if (error) {
    console.error("Error updating rating model:", error);
    throw new Error("Erro ao atualizar modelo de rating");
  }

  revalidatePath("/dashboard/indicators");
  return data;
}

export async function deleteRatingModel(modelId: string): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("rating_models")
    .update({ is_active: false })
    .eq("id", modelId);

  if (error) {
    console.error("Error deleting rating model:", error);
    throw new Error("Erro ao excluir modelo de rating");
  }

  revalidatePath("/dashboard/indicators");
}

// Rating Metrics
export async function getRatingMetrics(organizationId: string): Promise<RatingMetric[]> {
  const supabase = await createClient();
  
  // Buscar métricas predefinidas e específicas da organização
  const { data, error } = await supabase
    .from("rating_metrics")
    .select("*")
    .or(`organizacao_id.eq.${organizationId},is_predefined.eq.true`)
    .eq("is_active", true)
    .order("is_predefined", { ascending: false })
    .order("categoria")
    .order("nome");

  if (error) {
    console.error("Error fetching rating metrics:", error);
    throw new Error("Erro ao buscar métricas de rating");
  }

  return data || [];
}

export async function createRatingMetric(metric: CreateRatingMetric): Promise<RatingMetric> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("rating_metrics")
    .insert(metric)
    .select()
    .single();

  if (error) {
    console.error("Error creating rating metric:", error);
    throw new Error("Erro ao criar métrica de rating");
  }

  revalidatePath("/dashboard/indicators");
  return data;
}

export async function updateRatingMetric(metricId: string, metric: UpdateRatingMetric): Promise<RatingMetric> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("rating_metrics")
    .update({ ...metric, updated_at: new Date().toISOString() })
    .eq("id", metricId)
    .select()
    .single();

  if (error) {
    console.error("Error updating rating metric:", error);
    throw new Error("Erro ao atualizar métrica de rating");
  }

  revalidatePath("/dashboard/indicators");
  return data;
}

export async function deleteRatingMetric(metricId: string): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("rating_metrics")
    .update({ is_active: false })
    .eq("id", metricId);

  if (error) {
    console.error("Error deleting rating metric:", error);
    throw new Error("Erro ao excluir métrica de rating");
  }

  revalidatePath("/dashboard/indicators");
}

// Rating Model Metrics (junction table)
export async function getRatingModelMetrics(modelId: string): Promise<RatingModelMetric[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("rating_model_metrics")
    .select(`
      *,
      rating_metric:rating_metrics(*)
    `)
    .eq("rating_model_id", modelId)
    .eq("is_active", true)
    .order("peso", { ascending: false });

  if (error) {
    console.error("Error fetching rating model metrics:", error);
    throw new Error("Erro ao buscar métricas do modelo de rating");
  }

  return data || [];
}

export async function updateRatingModelMetrics(
  modelId: string, 
  metrics: { rating_metric_id: string; peso: number }[]
): Promise<void> {
  const supabase = await createClient();
  
  // First, deactivate all existing metrics for this model
  await supabase
    .from("rating_model_metrics")
    .update({ is_active: false })
    .eq("rating_model_id", modelId);

  // Then insert/activate the new metrics
  const modelMetrics = metrics.map(metric => ({
    rating_model_id: modelId,
    rating_metric_id: metric.rating_metric_id,
    peso: metric.peso,
    is_active: true,
  }));

  const { error } = await supabase
    .from("rating_model_metrics")
    .upsert(modelMetrics, {
      onConflict: "rating_model_id,rating_metric_id",
    });

  if (error) {
    console.error("Error updating rating model metrics:", error);
    throw new Error("Erro ao atualizar métricas do modelo de rating");
  }

  revalidatePath("/dashboard/indicators");
}

// Rating Metric Thresholds
export async function getRatingMetricThresholds(metricId: string): Promise<RatingMetricThreshold[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("rating_metric_thresholds")
    .select("*")
    .eq("rating_metric_id", metricId)
    .order("pontuacao", { ascending: false });

  if (error) {
    console.error("Error fetching rating metric thresholds:", error);
    throw new Error("Erro ao buscar limites da métrica de rating");
  }

  return data || [];
}

export async function updateRatingMetricThresholds(
  metricId: string,
  organizationId: string,
  thresholds: Omit<RatingMetricThreshold, "id" | "rating_metric_id" | "organizacao_id" | "created_at" | "updated_at">[]
): Promise<void> {
  const supabase = await createClient();
  
  // Delete existing thresholds
  await supabase
    .from("rating_metric_thresholds")
    .delete()
    .eq("rating_metric_id", metricId)
    .eq("organizacao_id", organizationId);

  // Insert new thresholds
  const newThresholds = thresholds.map(threshold => ({
    ...threshold,
    rating_metric_id: metricId,
    organizacao_id: organizationId,
  }));

  const { error } = await supabase
    .from("rating_metric_thresholds")
    .insert(newThresholds);

  if (error) {
    console.error("Error updating rating metric thresholds:", error);
    throw new Error("Erro ao atualizar limites da métrica de rating");
  }

  revalidatePath("/dashboard/indicators");
}

// Qualitative Metric Values
export async function getQualitativeMetricValues(
  organizationId: string,
  metricId?: string
): Promise<QualitativeMetricValue[]> {
  const supabase = await createClient();
  
  // Check if organizationId is a JSON string and parse it
  let actualOrgId = organizationId;
  if (typeof organizationId === 'string' && organizationId.startsWith('{')) {
    try {
      const parsed = JSON.parse(organizationId);
      actualOrgId = parsed.id || organizationId;
    } catch (e) {
      console.error("Failed to parse organizationId:", e);
    }
  }
  
  let query = supabase
    .from("qualitative_metric_values")
    .select(`
      *,
      rating_metric:rating_metrics(*)
    `)
    .eq("organizacao_id", actualOrgId)
    .eq("is_current", true);

  if (metricId) {
    query = query.eq("rating_metric_id", metricId);
  }

  const { data, error } = await query.order("data_avaliacao", { ascending: false });

  if (error) {
    console.error("Error fetching qualitative metric values:", error);
    throw new Error("Erro ao buscar valores qualitativos");
  }

  return data || [];
}

export async function createQualitativeMetricValue(value: CreateQualitativeValue): Promise<QualitativeMetricValue> {
  const supabase = await createClient();
  
  // Mark previous values as non-current
  await supabase
    .from("qualitative_metric_values")
    .update({ is_current: false })
    .eq("organizacao_id", value.organizacao_id)
    .eq("rating_metric_id", value.rating_metric_id);

  // Insert new value as current
  const { data, error } = await supabase
    .from("qualitative_metric_values")
    .insert({ ...value, is_current: true })
    .select()
    .single();

  if (error) {
    console.error("Error creating qualitative metric value:", error);
    throw new Error("Erro ao criar valor qualitativo");
  }

  revalidatePath("/dashboard/indicators");
  return data;
}

// Rating Calculations
export async function calculateRating(
  organizationId: string,
  modelId: string,
  safraId?: string,
  scenarioId?: string | null
): Promise<RatingCalculation> {
  const supabase = await createClient();
  
  // Check if organizationId is a JSON string and parse it
  let actualOrgId = organizationId;
  if (typeof organizationId === 'string' && organizationId.startsWith('{')) {
    try {
      const parsed = JSON.parse(organizationId);
      actualOrgId = parsed.id || organizationId;
    } catch (e) {
      console.error("Failed to parse organizationId:", e);
    }
  }
  
  // Get model metrics with weights
  const modelMetrics = await getRatingModelMetrics(modelId);
  
  if (modelMetrics.length === 0) {
    throw new Error("Modelo de rating sem métricas configuradas");
  }

  // Get safra name if safraId is provided
  let safraName = "";
  if (safraId) {
    const { data: safraData } = await supabase
      .from("safras")
      .select("nome")
      .eq("id", safraId)
      .single();
    
    safraName = safraData?.nome || "";
  }

  // Get all quantitative metric values for this safra and scenario
  const quantitativeValues = await calculateQuantitativeMetrics(actualOrgId, safraId, scenarioId);

  // Calculate individual metric scores
  const metricScores: Record<string, { valor: number; pontuacao: number; peso: number }> = {};
  let totalWeight = 0;
  let weightedScore = 0;

  for (const modelMetric of modelMetrics) {
    const metric = modelMetric.rating_metric;
    if (!metric) continue;

    let metricValue: number;
    
    if (metric.tipo === "QUANTITATIVE") {
      // Get the pre-calculated value for this metric
      metricValue = quantitativeValues[metric.codigo] || 0;
    } else {
      // Get qualitative value
      const qualitativeValues = await getQualitativeMetricValues(actualOrgId, metric.id);
      metricValue = qualitativeValues[0]?.valor || 0;
    }

    // Get thresholds and calculate score
    const thresholds = await getRatingMetricThresholds(metric.id!);
    const score = calculateMetricScore(metricValue, thresholds);

    metricScores[metric.codigo] = {
      valor: metricValue,
      pontuacao: score,
      peso: modelMetric.peso,
    };

    totalWeight += modelMetric.peso;
    weightedScore += (score * modelMetric.peso) / 100;
  }

  // Calculate final score
  const finalScore = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
  
  // Get rating letter
  const rating = getRatingFromScore(finalScore);

  // Save calculation
  const calculationData: any = {
    organizacao_id: actualOrgId,
    rating_model_id: modelId,
    pontuacao_total: finalScore,
    rating_letra: rating.letra,
    rating_descricao: rating.descricao,
    detalhes_calculo: {
      ...metricScores,
      safra: safraName, // Include safra in calculation details
      safra_id: safraId, // Store safra_id in details for now
      scenario_id: scenarioId, // Store scenario_id in details
    },
  };
  
  // TODO: Add safra_id as a column when migration is applied
  // if (safraId) {
  //   calculationData.safra_id = safraId;
  // }

  const { data, error } = await supabase
    .from("rating_calculations")
    .insert(calculationData)
    .select()
    .single();

  if (error) {
    console.error("Error saving rating calculation:", error);
    throw new Error("Erro ao salvar cálculo de rating");
  }

  revalidatePath("/dashboard/indicators");
  return data;
}


// Helper function to calculate metric score based on thresholds
function calculateMetricScore(value: number, thresholds: RatingMetricThreshold[]): number {
  if (thresholds.length === 0) return 0;

  // Sort thresholds by score descending
  const sortedThresholds = [...thresholds].sort((a, b) => b.pontuacao - a.pontuacao);

  for (const threshold of sortedThresholds) {
    const meetsMin = threshold.valor_min === null || value >= (threshold.valor_min || 0);
    const meetsMax = threshold.valor_max === null || value <= (threshold.valor_max || 0);

    if (meetsMin && meetsMax) {
      return threshold.pontuacao;
    }
  }

  // If no threshold matches, return the lowest score
  return sortedThresholds[sortedThresholds.length - 1]?.pontuacao || 0;
}

export async function getRatingCalculations(
  organizationId: string,
  modelId?: string
): Promise<RatingCalculation[]> {
  const supabase = await createClient();
  
  // Check if organizationId is a JSON string and parse it
  let actualOrgId = organizationId;
  if (typeof organizationId === 'string' && organizationId.startsWith('{')) {
    try {
      const parsed = JSON.parse(organizationId);
      actualOrgId = parsed.id || organizationId;
    } catch (e) {
      console.error("Failed to parse organizationId:", e);
    }
  }
  
  let query = supabase
    .from("rating_calculations")
    .select(`
      *,
      rating_model:rating_models(*)
    `)
    .eq("organizacao_id", actualOrgId);

  if (modelId) {
    query = query.eq("rating_model_id", modelId);
  }

  const { data, error } = await query.order("data_calculo", { ascending: false });

  if (error) {
    console.error("Error fetching rating calculations:", error);
    throw new Error("Erro ao buscar cálculos de rating");
  }

  return data || [];
}

export async function getLatestRatingCalculation(
  organizationId: string,
  modelId?: string
): Promise<RatingCalculation | null> {
  // Check if organizationId is a JSON string and parse it
  let actualOrgId = organizationId;
  if (typeof organizationId === 'string' && organizationId.startsWith('{')) {
    try {
      const parsed = JSON.parse(organizationId);
      actualOrgId = parsed.id || organizationId;
    } catch (e) {
      console.error("Failed to parse organizationId:", e);
    }
  }
  
  const calculations = await getRatingCalculations(actualOrgId, modelId);
  return calculations[0] || null;
}