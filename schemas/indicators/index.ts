import { z } from "zod";

export const ThresholdLevelEnum = z.enum([
  "THRESHOLD",
  "ATENCAO",
  "CONFORTAVEL",
  "BOM",
  "MUITO_BOM",
]);

export type ThresholdLevel = z.infer<typeof ThresholdLevelEnum>;

// Modelo para faixas de valores de indicadores
export const IndicatorThresholdSchema = z.object({
  id: z.string().optional(),
  organizacaoId: z.string().optional(),
  level: ThresholdLevelEnum,
  min: z.number(),
  max: z.number().optional(),
  color: z.string(),
});

export type IndicatorThreshold = z.infer<typeof IndicatorThresholdSchema>;

// Modelo para configuração de indicadores
export const IndicatorConfigSchema = z.object({
  id: z.string().optional(),
  organizacaoId: z.string(),
  indicatorType: z.enum([
    "LIQUIDEZ",
    "DIVIDA_EBITDA",
    "DIVIDA_FATURAMENTO",
    "DIVIDA_PL",
    "LTV",
  ]),
  thresholds: z.array(IndicatorThresholdSchema),
  active: z.boolean().default(true),
  updatedAt: z.date().optional(),
});

export type IndicatorConfig = z.infer<typeof IndicatorConfigSchema>;

// Schema para atualização da configuração
export const UpdateIndicatorConfigSchema = z.object({
  indicatorType: z.enum([
    "LIQUIDEZ",
    "DIVIDA_EBITDA",
    "DIVIDA_FATURAMENTO",
    "DIVIDA_PL",
    "LTV",
  ]),
  thresholds: z.array(
    z.object({
      level: ThresholdLevelEnum,
      min: z.number(),
      max: z.number().optional(),
      color: z.string(),
    })
  ),
});

export type UpdateIndicatorConfig = z.infer<typeof UpdateIndicatorConfigSchema>;

// Dados padrão para inicialização
export const defaultIndicatorConfigs = {
  LIQUIDEZ: [
    { level: "THRESHOLD", min: 0, max: 0.69, color: "#FF4D4F" },
    { level: "ATENCAO", min: 0.7, max: 1, color: "#FAAD14" },
    { level: "CONFORTAVEL", min: 1.01, max: 1.29, color: "#1890FF" },
    { level: "BOM", min: 1.3, max: 1.79, color: "#52C41A" },
    { level: "MUITO_BOM", min: 1.8, max: undefined, color: "#13C2C2" },
  ],
  DIVIDA_EBITDA: [
    { level: "THRESHOLD", min: 3.1, max: undefined, color: "#FF4D4F" },
    { level: "ATENCAO", min: 1.2, max: 2.9, color: "#FAAD14" },
    { level: "CONFORTAVEL", min: 0.1, max: 1.19, color: "#1890FF" },
    { level: "BOM", min: -1.9, max: 0, color: "#52C41A" },
    { level: "MUITO_BOM", min: -100, max: -2, color: "#13C2C2" },
  ],
  DIVIDA_FATURAMENTO: [
    { level: "THRESHOLD", min: 0.81, max: undefined, color: "#FF4D4F" },
    { level: "ATENCAO", min: 0.5, max: 0.79, color: "#FAAD14" },
    { level: "CONFORTAVEL", min: 0.1, max: 0.49, color: "#1890FF" },
    { level: "BOM", min: -0.7, max: 0, color: "#52C41A" },
    { level: "MUITO_BOM", min: -100, max: -0.8, color: "#13C2C2" },
  ],
  DIVIDA_PL: [
    { level: "THRESHOLD", min: 0.91, max: undefined, color: "#FF4D4F" },
    { level: "ATENCAO", min: 0.6, max: 0.89, color: "#FAAD14" },
    { level: "CONFORTAVEL", min: 0.1, max: 0.59, color: "#1890FF" },
    { level: "BOM", min: -0.59, max: 0, color: "#52C41A" },
    { level: "MUITO_BOM", min: -100, max: -0.6, color: "#13C2C2" },
  ],
  LTV: [
    { level: "THRESHOLD", min: 0.81, max: undefined, color: "#FF4D4F" },
    { level: "ATENCAO", min: 0.6, max: 0.79, color: "#FAAD14" },
    { level: "CONFORTAVEL", min: 0.31, max: 0.59, color: "#1890FF" },
    { level: "BOM", min: 0.11, max: 0.3, color: "#52C41A" },
    { level: "MUITO_BOM", min: 0, max: 0.1, color: "#13C2C2" },
  ],
};

// Mapper para tipos de indicadores
export const indicatorLabels = {
  LIQUIDEZ: "Liquidez",
  DIVIDA_EBITDA: "Dívida / EBITDA",
  DIVIDA_FATURAMENTO: "Dívida / Faturamento",
  DIVIDA_PL: "Dívida / PL",
  LTV: "LTV",
};

// Descrições para cada tipo de indicador
export const indicatorDescriptions = {
  LIQUIDEZ: "Capacidade de pagamento de obrigações de curto prazo",
  DIVIDA_EBITDA: "Relação entre a dívida total e a geração operacional de caixa",
  DIVIDA_FATURAMENTO: "Relação entre a dívida total e o faturamento anual",
  DIVIDA_PL: "Relação entre a dívida total e o patrimônio líquido",
  LTV: "Loan-to-Value - Relação entre dívida total e valor dos ativos",
};

// Exportando schemas de preços de commodities
export * from "./prices";