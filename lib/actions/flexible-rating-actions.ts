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

// Helper functions
async function getSafraName(supabase: any, safraId: string): Promise<string> {
  const { data } = await supabase
    .from("safras")
    .select("nome")
    .eq("id", safraId)
    .single();
  return data?.nome || "";
}

async function getScenarioName(supabase: any, scenarioId: string): Promise<string> {
  const { data } = await supabase
    .from("projection_scenarios")
    .select("name")
    .eq("id", scenarioId)
    .single();
  return data?.name || "";
}

// Rating Models
export async function getRatingModels(organizationId: string): Promise<RatingModel[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("rating_models")
    .select("*")
    .or(`organizacao_id.eq.${organizationId},organizacao_id.is.null`)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("nome");

  if (error) {
    console.error("Error fetching rating models:", error);
    throw new Error("Erro ao buscar modelos de rating");
  }

  // Parse flow_data for each model if it's a string
  const models = data || [];
  const parsedModels = models.map(model => {
    if (model.flow_data && typeof model.flow_data === 'string') {
      try {
        model.flow_data = JSON.parse(model.flow_data);
      } catch (e) {
        console.error("Error parsing flow_data:", e);
      }
    }
    return model;
  });
  
  // Ensure SR/Prime model is always available and set as default
  const srPrimeModel = parsedModels.find(m => m.nome === 'SR/Prime Rating Model');
  if (srPrimeModel) {
    srPrimeModel.is_default = true;
  }
  
  return parsedModels;
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

export async function getRatingModelMetricsCount(modelId: string): Promise<number> {
  const supabase = await createClient();
  
  // For SR/Prime model, count predefined metrics
  const { data: modelData } = await supabase
    .from("rating_models")
    .select("nome")
    .eq("id", modelId)
    .single();
  
  if (modelData?.nome === 'SR/Prime Rating Model' || modelData?.nome === 'Modelo SR-PRIME') {
    const { count } = await supabase
      .from("rating_metrics")
      .select("*", { count: "exact", head: true })
      .eq("is_predefined", true)
      .eq("is_active", true);
    
    return count || 0;
  }
  
  // For other models, count model-specific metrics
  const { count } = await supabase
    .from("rating_model_metrics")
    .select("*", { count: "exact", head: true })
    .eq("rating_model_id", modelId)
    .eq("is_active", true);

  return count || 0;
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
  metricId?: string,
  safraId?: string
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
  
  if (safraId) {
    query = query.eq("safra_id", safraId);
  } else {
    // For legacy data without safra_id
    query = query.is("safra_id", null);
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
  
  // Mark previous values as non-current for the same safra
  const updateQuery = supabase
    .from("qualitative_metric_values")
    .update({ is_current: false })
    .eq("organizacao_id", value.organizacao_id)
    .eq("rating_metric_id", value.rating_metric_id);
  
  // If safra_id is provided, update only for that safra
  if (value.safra_id) {
    await updateQuery.eq("safra_id", value.safra_id);
  } else {
    // If no safra_id, update all (legacy behavior)
    await updateQuery;
  }

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

  // FORÇA LIMPEZA de dados antigos com problema 0.69x para Wilsemar Elger
  if (actualOrgId === '41ee5785-2d48-4f68-a307-d4636d114ab1') {
    // Deletar cálculos antigos que podem conter valor 0.69x
    await supabase
      .from("rating_calculations")
      .delete()
      .eq("organizacao_id", actualOrgId);
  }

  // Check if it's the SR/Prime model and use the database function
  const { data: modelData } = await supabase
    .from("rating_models")
    .select("nome")
    .eq("id", modelId)
    .single();

  if (modelData?.nome === 'SR/Prime Rating Model' && safraId) {
    // Use TypeScript calculation - DYNAMIC, not hardcoded
    const quantitativeMetrics = await calculateQuantitativeMetrics(actualOrgId, safraId);
    
    // Get all predefined metrics for SR/Prime model
    const allMetrics = await getRatingMetrics(actualOrgId);
    const predefinedMetrics = allMetrics.filter(m => m.is_predefined);
    
    // Calculate scores for each metric dynamically
    const metricResults = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    for (const metric of predefinedMetrics) {
      let metricValue = 0;
      let metricScore = 0;
      const metricWeight = metric.peso || 1;
      
      
      if (metric.tipo === 'QUANTITATIVE') {
        // Get calculated value from TypeScript calculations
        metricValue = quantitativeMetrics[metric.codigo] || 0;
        
        // Get thresholds for this metric and calculate score
        const thresholds = await getRatingMetricThresholds(metric.id!);
        metricScore = calculateMetricScore(metricValue, thresholds);
      } else {
        // For qualitative metrics, get user evaluations from rating_manual_evaluations
        const { data: manualEvaluations } = await supabase
          .from("rating_manual_evaluations")
          .select("*")
          .eq("organizacao_id", actualOrgId)
          .eq("metric_code", metric.codigo)
          .eq("safra_id", safraId)
          .single();
        
        if (manualEvaluations) {
          metricValue = manualEvaluations.score;
          // Convert score (1-5) to percentage (20-100)
          metricScore = manualEvaluations.score * 20;
        } else {
        }
      }
      
      const contribution = (metricScore * metricWeight) / 100;
      totalWeightedScore += contribution;
      totalWeight += metricWeight;
      
      metricResults.push({
        codigo: metric.codigo,
        nome: metric.nome,
        tipo: metric.tipo,
        source_type: metric.source_type,
        peso: metricWeight,
        valor: metricValue,
        nota: metric.tipo === 'QUALITATIVE' ? metricValue : null,
        pontuacao: metricScore,
        contribuicao: contribution,
        score_criteria: (metric as any).score_criteria || null,
        selected_option: metric.tipo === 'QUALITATIVE' && (metric as any).score_criteria && metricValue ? 
          (metric as any).score_criteria[metricValue.toString()] : null
      });
    }
    
    // Calculate final score and rating
    const finalScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
    const rating = getRatingFromScore(finalScore);
    
    
    // Create calculation result using dynamic TypeScript calculations
    const data = {
      pontuacao_total: finalScore,
      rating_letra: rating.letra,
      rating_descricao: `Rating ${rating.letra} - ${rating.descricao}`,
      detalhes: {
        metrics: metricResults,
        calculation_method: 'TYPESCRIPT_DYNAMIC',
        total_weight: totalWeight,
        weighted_score: totalWeightedScore
      }
    };

    // The database function returns detalhes with nested structure
    // We need to preserve the entire detalhes object
    const detalhesFromDb = (data as any).detalhes || {};
    
    // Ensure we have the metrics array
    const formattedDetails = {
      ...detalhesFromDb, // Spread all properties from database
      metrics: detalhesFromDb.metrics || detalhesFromDb.metricas || [],
      safra: detalhesFromDb.safra || (safraId ? await getSafraName(supabase, safraId) : ""),
      scenario: detalhesFromDb.scenario || (scenarioId ? await getScenarioName(supabase, scenarioId) : "Base")
    };

    // Save calculation result
    const { data: savedCalc, error: saveError } = await supabase
      .from("rating_calculations")
      .insert({
        organizacao_id: actualOrgId,
        modelo_id: modelId,
        safra_id: safraId,
        cenario_id: scenarioId || null,
        pontuacao_total: (data as any).pontuacao_total,
        rating_letra: (data as any).rating_letra,
        rating_descricao: (data as any).rating_descricao,
        detalhes_calculo: formattedDetails,
        data_calculo: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving calculation:", saveError);
    }

    // Rating history removed - users will generate and export PDF when needed

    return savedCalc || {
      id: '',
      organizacao_id: actualOrgId,
      modelo_id: modelId,
      safra_id: safraId,
      cenario_id: scenarioId || null,
      pontuacao_total: (data as any).pontuacao_total,
      rating_letra: (data as any).rating_letra,
      rating_descricao: (data as any).rating_descricao,
      detalhes_calculo: formattedDetails,
      data_calculo: new Date().toISOString(),
      rating_model_nome: 'SR/Prime Rating Model'
    };
  }
  
  // Continue with existing logic for non-SR/Prime models
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

  // Rating history removed - users will generate and export PDF when needed

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
    .select("*")
    .eq("organizacao_id", actualOrgId);

  if (modelId) {
    query = query.eq("modelo_id", modelId);
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

export async function checkManualMetricsEvaluated(
  organizationId: string,
  safraId: string,
  scenarioId: string | null = null
): Promise<boolean> {
  const supabase = await createClient();
  
  // Get all manual/qualitative metrics that need evaluation
  const { data: manualMetrics, error: metricsError } = await supabase
    .from("rating_metrics")
    .select("id, codigo")
    .eq("is_predefined", true)
    .eq("is_active", true)
    .eq("source_type", "MANUAL");
    
    
  if (metricsError || !manualMetrics || manualMetrics.length === 0) {
    // If there are no manual metrics, consider as evaluated
    return true;
  }
  
  // Check if all manual metrics have been evaluated for this safra/scenario
  let query = supabase
    .from("rating_manual_evaluations")
    .select("metric_code")
    .eq("organizacao_id", organizationId)
    .eq("safra_id", safraId);
    
  // Handle null scenario_id properly
  if (scenarioId === null) {
    query = query.is("scenario_id", null);
  } else {
    query = query.eq("scenario_id", scenarioId);
  }
  
  const { data: evaluations, error: evalError } = await query;
    
  if (evalError) {
    console.error("Error checking evaluations:", evalError);
    return false;
  }
  
  
  // Get list of evaluated metric codes
  const evaluatedCodes = new Set(evaluations?.map(e => e.metric_code) || []);
  
  // Check if all manual metrics have been evaluated
  const allEvaluated = manualMetrics.every(metric => evaluatedCodes.has(metric.codigo));
  
  
  return allEvaluated;
}