import { z } from "zod";

// =======================================
// Basic Configuration Schemas
// =======================================

// Schema for Cultures (Culturas)
export const cultureSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1, "Nome da cultura é obrigatório"),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Culture = z.infer<typeof cultureSchema>;

export const cultureFormSchema = cultureSchema.omit({ 
  id: true, 
  organizacao_id: true,
  created_at: true,
  updated_at: true 
});
export type CultureFormValues = z.infer<typeof cultureFormSchema>;

// Schema for Systems (Sistemas)
export const systemSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1, "Nome do sistema é obrigatório"),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type System = z.infer<typeof systemSchema>;

export const systemFormSchema = systemSchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true
});
export type SystemFormValues = z.infer<typeof systemFormSchema>;

// Schema for Cycles (Ciclos)
export const cycleSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1, "Nome do ciclo é obrigatório"),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Cycle = z.infer<typeof cycleSchema>;

export const cycleFormSchema = cycleSchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true
});
export type CycleFormValues = z.infer<typeof cycleFormSchema>;

// Schema for Harvests (Safras)
export const harvestSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1, "Nome da safra é obrigatório"),
  ano_inicio: z.coerce.number().int().min(1900, "Ano de início deve ser válido"),
  ano_fim: z.coerce.number().int().min(1900, "Ano de fim deve ser válido"),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Harvest = z.infer<typeof harvestSchema>;

export const harvestFormSchema = harvestSchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true
}).refine(data => data.ano_fim >= data.ano_inicio, {
  message: "O ano final deve ser maior ou igual ao ano inicial",
  path: ["ano_fim"],
});
export type HarvestFormValues = z.infer<typeof harvestFormSchema>;

// =======================================
// Planting Area Schema
// =======================================

// Enum for productivity units
export const productivityUnitEnum = z.enum(["sc/ha", "@/ha", "kg/ha"]);
export type ProductivityUnit = z.infer<typeof productivityUnitEnum>;

// Schema for Planting Areas (Áreas de Plantio)
export const plantingAreaSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  propriedade_id: z.string().uuid(),
  cultura_id: z.string().uuid(),
  sistema_id: z.string().uuid(),
  ciclo_id: z.string().uuid(),
  safra_id: z.string().uuid(),
  area: z.coerce.number().min(0, "Área deve ser positiva"),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type PlantingArea = z.infer<typeof plantingAreaSchema>;

export const plantingAreaFormSchema = plantingAreaSchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true
});
export type PlantingAreaFormValues = z.infer<typeof plantingAreaFormSchema>;

// =======================================
// Productivity Schema
// =======================================

// Schema for Productivity (Produtividade)
export const productivitySchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  cultura_id: z.string().uuid(),
  sistema_id: z.string().uuid(),
  safra_id: z.string().uuid(),
  propriedade_id: z.string().uuid(),
  produtividade: z.coerce.number().min(0, "Produtividade deve ser positiva"),
  unidade: productivityUnitEnum,
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Productivity = z.infer<typeof productivitySchema>;

export const productivityFormSchema = productivitySchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true
});
export type ProductivityFormValues = z.infer<typeof productivityFormSchema>;

// =======================================
// Production Cost Schema
// =======================================

// Enum for production cost categories
export const productionCostCategoryEnum = z.enum([
  "CALCARIO",
  "FERTILIZANTE",
  "SEMENTES",
  "TRATAMENTO_SEMENTES",
  "HERBICIDA",
  "INSETICIDA",
  "FUNGICIDA",
  "OUTROS",
  "BENEFICIAMENTO",
  "SERVICOS",
  "ADMINISTRATIVO"
]);
export type ProductionCostCategory = z.infer<typeof productionCostCategoryEnum>;

// Schema for Production Costs (Custos de Produção)
export const productionCostSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  cultura_id: z.string().uuid(),
  sistema_id: z.string().uuid(),
  safra_id: z.string().uuid(),
  propriedade_id: z.string().uuid(),
  categoria: productionCostCategoryEnum,
  valor: z.coerce.number().min(0, "Valor deve ser positivo"),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type ProductionCost = z.infer<typeof productionCostSchema>;

export const productionCostFormSchema = productionCostSchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true
});
export type ProductionCostFormValues = z.infer<typeof productionCostFormSchema>;

// =======================================
// Livestock Schema
// =======================================

// Schema for Livestock (Rebanho)
export const livestockSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  tipo_animal: z.string().min(1, "Tipo de animal é obrigatório"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  quantidade: z.coerce.number().int().min(0, "Quantidade deve ser positiva"),
  preco_unitario: z.coerce.number().min(0, "Preço unitário deve ser positivo"),
  propriedade_id: z.string().uuid(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Livestock = z.infer<typeof livestockSchema>;

export const livestockFormSchema = livestockSchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true
});
export type LivestockFormValues = z.infer<typeof livestockFormSchema>;

// Enum for livestock operation cycle
export const livestockOperationCycleEnum = z.enum([
  "CONFINAMENTO",
  "PASTO",
  "SEMICONFINAMENTO"
]);
export type LivestockOperationCycle = z.infer<typeof livestockOperationCycleEnum>;

// Enum for livestock operation origin
export const livestockOperationOriginEnum = z.enum([
  "PROPRIO",
  "TERCEIRO"
]);
export type LivestockOperationOrigin = z.infer<typeof livestockOperationOriginEnum>;

// Schema for Livestock Operations (Operações Pecuárias)
export const livestockOperationSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  ciclo: livestockOperationCycleEnum,
  origem: livestockOperationOriginEnum,
  propriedade_id: z.string().uuid(),
  volume_abate_por_safra: z.record(z.string(), z.number()).or(z.string()),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type LivestockOperation = z.infer<typeof livestockOperationSchema>;

export const livestockOperationFormSchema = livestockOperationSchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true
});
export type LivestockOperationFormValues = z.infer<typeof livestockOperationFormSchema>;