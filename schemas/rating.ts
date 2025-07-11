import { z } from "zod";

// Rating Model Schema
export const RatingModelSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
  flow_data: z.any().optional(), // Store React Flow state
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
  source_type: z.enum(["CALCULATED", "MANUAL"]).optional(),
  peso: z.number().optional(),
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

// Rating scale configuration based on official SR/Prime table
export const RATING_SCALE = [
  // Risco Extremamente Baixo
  { letra: "AAA", min: 100, max: 100, descricao: "Excelente capacidade de pagamento, gestão superior e práticas sustentáveis exemplares", cor: "#15803d" }, // Verde Escuro
  { letra: "AA", min: 99, max: 99, descricao: "Excelente capacidade de pagamento, gestão superior e práticas sustentáveis exemplares", cor: "#15803d" },
  { letra: "A", min: 97, max: 98, descricao: "Excelente capacidade de pagamento, gestão superior e práticas sustentáveis exemplares", cor: "#15803d" },
  { letra: "A1", min: 96, max: 96, descricao: "Excelente capacidade de pagamento, gestão superior e práticas sustentáveis exemplares", cor: "#15803d" },
  { letra: "A2", min: 94, max: 95, descricao: "Excelente capacidade de pagamento, gestão superior e práticas sustentáveis exemplares", cor: "#15803d" },
  { letra: "A3", min: 92, max: 93, descricao: "Excelente capacidade de pagamento, gestão superior e práticas sustentáveis exemplares", cor: "#15803d" },
  { letra: "A4", min: 90, max: 91, descricao: "Excelente capacidade de pagamento, gestão superior e práticas sustentáveis exemplares", cor: "#15803d" },
  // Risco Consideravelmente Baixo
  { letra: "BAA1", min: 89, max: 89, descricao: "Forte capacidade de pagamento, boa gestão e práticas sustentáveis sólidas", cor: "#22c55e" }, // Verde
  { letra: "BAA2", min: 86, max: 88, descricao: "Forte capacidade de pagamento, boa gestão e práticas sustentáveis sólidas", cor: "#22c55e" },
  { letra: "BAA3", min: 83, max: 85, descricao: "Forte capacidade de pagamento, boa gestão e práticas sustentáveis sólidas", cor: "#22c55e" },
  { letra: "BAA4", min: 80, max: 82, descricao: "Forte capacidade de pagamento, boa gestão e práticas sustentáveis sólidas", cor: "#22c55e" },
  // Risco Baixo
  { letra: "BA1", min: 79, max: 79, descricao: "Boa capacidade de pagamento, gestão adequada e boas práticas sustentáveis", cor: "#84cc16" }, // Verde claro
  { letra: "BA2", min: 76, max: 78, descricao: "Boa capacidade de pagamento, gestão adequada e boas práticas sustentáveis", cor: "#84cc16" },
  { letra: "BA3", min: 73, max: 75, descricao: "Boa capacidade de pagamento, gestão adequada e boas práticas sustentáveis", cor: "#84cc16" },
  { letra: "BA4", min: 70, max: 72, descricao: "Boa capacidade de pagamento, gestão adequada e boas práticas sustentáveis", cor: "#84cc16" },
  // Risco Médio
  { letra: "BA5", min: 60, max: 69, descricao: "Capacidade de pagamento adequada, gestão satisfatória com algumas oportunidades de melhoria", cor: "#fde047" }, // Amarelo claro
  { letra: "BA6", min: 50, max: 59, descricao: "Capacidade de pagamento aceitável, mas vulnerável a condições adversas", cor: "#eab308" }, // Amarelo
  // Risco Médio para Alto
  { letra: "B1", min: 40, max: 49, descricao: "Capacidade de pagamento limitada, vulnerabilidade significativa a fatores externos", cor: "#ca8a04" }, // Amarelo escuro
  { letra: "B2", min: 30, max: 39, descricao: "Capacidade de pagamento fraca, alta vulnerabilidade a fatores externos", cor: "#f97316" }, // Laranja
  // Risco Alto para Crítico
  { letra: "B3", min: 26, max: 29, descricao: "Capacidade de pagamento muito fraca, problemas estruturais significativos", cor: "#ef4444" }, // Vermelho
  { letra: "C1", min: 20, max: 25, descricao: "Capacidade de pagamento muito fraca, problemas estruturais significativos", cor: "#ef4444" },
  // Crítico para Muito Crítico
  { letra: "C2", min: 19, max: 19, descricao: "Capacidade de pagamento extremamente limitada, alta probabilidade de inadimplência", cor: "#b91c1c" }, // Vermelho Escuro
  { letra: "C3", min: 17, max: 18, descricao: "Capacidade de pagamento extremamente limitada, alta probabilidade de inadimplência", cor: "#b91c1c" },
  { letra: "D1", min: 14, max: 16, descricao: "Capacidade de pagamento extremamente limitada, alta probabilidade de inadimplência", cor: "#b91c1c" },
  { letra: "D2", min: 12, max: 13, descricao: "Capacidade de pagamento extremamente limitada, alta probabilidade de inadimplência", cor: "#b91c1c" },
  { letra: "D3", min: 10, max: 11, descricao: "Capacidade de pagamento extremamente limitada, alta probabilidade de inadimplência", cor: "#b91c1c" },
  // Muito crítico para Default
  { letra: "E", min: 9, max: 9, descricao: "Já em situação de inadimplência ou com alta probabilidade de default iminente", cor: "#000000" }, // Preto
  { letra: "F", min: 6, max: 8, descricao: "Já em situação de inadimplência ou com alta probabilidade de default iminente", cor: "#000000" },
  { letra: "G", min: 3, max: 5, descricao: "Já em situação de inadimplência ou com alta probabilidade de default iminente", cor: "#000000" },
  { letra: "H", min: 0, max: 2, descricao: "Já em situação de inadimplência ou com alta probabilidade de default iminente", cor: "#000000" },
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