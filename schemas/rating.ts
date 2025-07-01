import { z } from "zod";

// Rating Model Schema
export const RatingModelSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Rating Metric Schema
export const RatingMetricSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1, "Nome é obrigatório"),
  codigo: z.string().min(1, "Código é obrigatório"),
  tipo: z.enum(["QUANTITATIVE", "QUALITATIVE"]),
  categoria: z.string().optional(),
  descricao: z.string().optional(),
  formula: z.string().optional(),
  unidade: z.string().optional(),
  is_predefined: z.boolean().default(false),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Rating Model Metrics Schema (junction table)
export const RatingModelMetricSchema = z.object({
  id: z.string().uuid().optional(),
  rating_model_id: z.string().uuid(),
  rating_metric_id: z.string().uuid(),
  peso: z.number().min(0).max(100),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  // Relations
  rating_metric: RatingMetricSchema.optional(),
});

// Rating Metric Thresholds Schema
export const RatingMetricThresholdSchema = z.object({
  id: z.string().uuid().optional(),
  rating_metric_id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
  nivel: z.string(),
  valor_min: z.number().nullable().optional(),
  valor_max: z.number().nullable().optional(),
  pontuacao: z.number().min(0).max(100),
  cor: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Rating Calculation Schema
export const RatingCalculationSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  rating_model_id: z.string().uuid(),
  data_calculo: z.string().datetime().optional(),
  pontuacao_total: z.number().min(0).max(100),
  rating_letra: z.string(),
  rating_descricao: z.string().optional(),
  detalhes_calculo: z.record(z.any()).optional(),
  created_at: z.string().datetime().optional(),
  // Relations
  rating_model: RatingModelSchema.optional(),
});

// Qualitative Metric Values Schema
export const QualitativeMetricValueSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  rating_metric_id: z.string().uuid(),
  valor: z.number().min(0).max(100),
  justificativa: z.string().optional(),
  avaliador_id: z.string().uuid().optional(),
  data_avaliacao: z.string().datetime().optional(),
  is_current: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  // Relations
  rating_metric: RatingMetricSchema.optional(),
});

// Form Schemas
export const CreateRatingModelSchema = RatingModelSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateRatingModelSchema = CreateRatingModelSchema.partial();

export const CreateRatingMetricSchema = RatingMetricSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateRatingMetricSchema = CreateRatingMetricSchema.partial();

export const CreateQualitativeValueSchema = QualitativeMetricValueSchema.omit({
  id: true,
  created_at: true,
});

// Complex form schema for rating model with metrics
export const RatingModelWithMetricsSchema = z.object({
  model: CreateRatingModelSchema,
  metrics: z.array(
    z.object({
      rating_metric_id: z.string().uuid(),
      peso: z.number().min(0).max(100),
    })
  ),
});

// Rating scale configuration
export const RATING_SCALE = [
  { letra: "AAA", min: 90, max: 100, descricao: "Excelente capacidade de crédito", cor: "#22c55e" },
  { letra: "AA", min: 80, max: 89, descricao: "Muito boa capacidade de pagamento", cor: "#84cc16" },
  { letra: "A", min: 70, max: 79, descricao: "Boa capacidade de pagamento", cor: "#84cc16" },
  { letra: "BBB", min: 60, max: 69, descricao: "Capacidade adequada de pagamento", cor: "#eab308" },
  { letra: "BB", min: 50, max: 59, descricao: "Capacidade de pagamento com incertezas", cor: "#f97316" },
  { letra: "B", min: 40, max: 49, descricao: "Capacidade limitada de pagamento", cor: "#f97316" },
  { letra: "CCC", min: 30, max: 39, descricao: "Capacidade frágil de pagamento", cor: "#ef4444" },
  { letra: "CC", min: 20, max: 29, descricao: "Capacidade muito frágil", cor: "#ef4444" },
  { letra: "C", min: 10, max: 19, descricao: "Capacidade extremamente frágil", cor: "#dc2626" },
  { letra: "D", min: 0, max: 9, descricao: "Sem capacidade de pagamento", cor: "#dc2626" },
] as const;

// Helper function to get rating letter from score
export function getRatingFromScore(score: number): typeof RATING_SCALE[number] {
  return RATING_SCALE.find(rating => score >= rating.min && score <= rating.max) || RATING_SCALE[RATING_SCALE.length - 1];
}

// Type exports
export type RatingModel = z.infer<typeof RatingModelSchema>;
export type RatingMetric = z.infer<typeof RatingMetricSchema>;
export type RatingModelMetric = z.infer<typeof RatingModelMetricSchema>;
export type RatingMetricThreshold = z.infer<typeof RatingMetricThresholdSchema>;
export type RatingCalculation = z.infer<typeof RatingCalculationSchema>;
export type QualitativeMetricValue = z.infer<typeof QualitativeMetricValueSchema>;
export type CreateRatingModel = z.infer<typeof CreateRatingModelSchema>;
export type UpdateRatingModel = z.infer<typeof UpdateRatingModelSchema>;
export type CreateRatingMetric = z.infer<typeof CreateRatingMetricSchema>;
export type UpdateRatingMetric = z.infer<typeof UpdateRatingMetricSchema>;
export type CreateQualitativeValue = z.infer<typeof CreateQualitativeValueSchema>;
export type RatingModelWithMetrics = z.infer<typeof RatingModelWithMetricsSchema>;

// Metric categories
export const METRIC_CATEGORIES = [
  "LIQUIDEZ",
  "ENDIVIDAMENTO", 
  "RENTABILIDADE",
  "EFICIENCIA",
  "CRESCIMENTO",
  "SUSTENTABILIDADE",
  "GOVERNANCA",
  "MERCADO",
  "OPERACIONAL",
  "CUSTOM"
] as const;

export type MetricCategory = typeof METRIC_CATEGORIES[number];