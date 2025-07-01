import { z } from "zod";

// =======================================
// Basic Configuration Schemas
// =======================================

// Schema for Cultures (Culturas)
export const cultureSchema = z.object({
  id: z.string().uuid("ID inválido").optional(),
  organizacao_id: z.string().uuid("Organização inválida"),
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
  id: z.string().uuid("ID inválido").optional(),
  organizacao_id: z.string().uuid("Organização inválida"),
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
  id: z.string().uuid("ID inválido").optional(),
  organizacao_id: z.string().uuid("Organização inválida"),
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
  id: z.string().uuid("ID inválido").optional(),
  organizacao_id: z.string().uuid("Organização inválida"),
  nome: z.string().min(1, "Nome da safra é obrigatório"),
  ano_inicio: z.coerce.number().int("Ano de início deve ser um número inteiro").min(1900, "Ano de início deve ser após 1900").refine(val => !isNaN(val), {
    message: "Insira um ano de início válido"
  }),
  ano_fim: z.coerce.number().int("Ano de fim deve ser um número inteiro").min(1900, "Ano de fim deve ser após 1900").refine(val => !isNaN(val), {
    message: "Insira um ano de fim válido"
  }),
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
// Planting Area Schema (Multi-Safra JSONB)
// =======================================

// Enum for productivity units
export const productivityUnitEnum = z.enum(["sc/ha", "@/ha", "kg/ha"], {
  errorMap: (issue, ctx) => ({ message: "Selecione uma unidade de produtividade válida" })
});
export type ProductivityUnit = z.infer<typeof productivityUnitEnum>;

// Schema for Planting Areas (Áreas de Plantio) - Multi-Safra JSONB
export const plantingAreaSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  propriedade_id: z.string().uuid(),
  cultura_id: z.string().uuid(),
  sistema_id: z.string().uuid(),
  ciclo_id: z.string().uuid(),
  areas_por_safra: z.record(z.string(), z.coerce.number().min(0, "Área deve ser positiva")),
  observacoes: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type PlantingArea = z.infer<typeof plantingAreaSchema>;

// Form schema for creating/editing planting areas
export const plantingAreaFormSchema = z.object({
  propriedade_id: z.string().refine(val => val === "all" || z.string().uuid().safeParse(val).success, {
    message: "Selecione uma propriedade válida"
  }),
  cultura_id: z.string().uuid("Selecione uma cultura válida"),
  sistema_id: z.string().uuid("Selecione um sistema válido"),
  ciclo_id: z.string().uuid("Selecione um ciclo válido"),
  areas_por_safra: z.record(z.string(), z.coerce.number().min(0, "Área deve ser maior ou igual a 0").refine(val => !isNaN(val), {
    message: "Insira um valor numérico válido para a área"
  }))
    .refine(data => Object.keys(data).length > 0, "Adicione pelo menos uma área por safra"),
  observacoes: z.string().optional(),
});
export type PlantingAreaFormValues = z.infer<typeof plantingAreaFormSchema>;

// Schema for multi-safra planting area form
export const multiSafraPlantingAreaFormSchema = plantingAreaFormSchema;
export type MultiSafraPlantingAreaFormValues = PlantingAreaFormValues;

// =======================================
// Productivity Schema (Multi-Safra JSONB)
// =======================================

// Schema for Productivity (Produtividade) - Multi-Safra JSONB
export const productivitySchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  propriedade_id: z.string().uuid().optional(),
  cultura_id: z.string().uuid(),
  sistema_id: z.string().uuid(),
  ciclo_id: z.string().uuid(),
  produtividades_por_safra: z.record(z.string(), z.object({
    produtividade: z.coerce.number().min(0, "Produtividade deve ser positiva"),
    unidade: productivityUnitEnum
  })),
  observacoes: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Productivity = z.infer<typeof productivitySchema>;

// Form schema for creating/editing productivity
export const productivityFormSchema = z.object({
  propriedade_id: z.string().refine(val => val === "all" || z.string().uuid().safeParse(val).success, {
    message: "Selecione uma propriedade válida"
  }).optional(),
  cultura_id: z.string().uuid("Selecione uma cultura válida"),
  sistema_id: z.string().uuid("Selecione um sistema válido"),
  ciclo_id: z.string().uuid("Selecione um ciclo válido"),
  produtividades_por_safra: z.record(z.string(), z.object({
    produtividade: z.coerce.number().min(0, "Produtividade deve ser maior ou igual a 0").refine(val => !isNaN(val), {
      message: "Insira um valor numérico válido para a produtividade"
    }),
    unidade: productivityUnitEnum.refine(val => !!val, {
      message: "Selecione uma unidade de produtividade"
    })
  })).refine(data => Object.keys(data).length > 0, "Adicione pelo menos uma produtividade por safra"),
  observacoes: z.string().optional(),
});
export type ProductivityFormValues = z.infer<typeof productivityFormSchema>;

// Schema for multi-safra productivity form
export const multiSafraProductivityFormSchema = productivityFormSchema;
export type MultiSafraProductivityFormValues = ProductivityFormValues;

// =======================================
// Production Cost Schema (Multi-Safra JSONB)
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
], {
  errorMap: (issue, ctx) => ({ message: "Selecione uma categoria de custo válida" })
});
export type ProductionCostCategory = z.infer<typeof productionCostCategoryEnum>;

// Schema for Production Costs (Custos de Produção) - Multi-Safra JSONB
export const productionCostSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  propriedade_id: z.string().uuid().optional(),
  cultura_id: z.string().uuid(),
  sistema_id: z.string().uuid(),
  ciclo_id: z.string().uuid(),
  categoria: productionCostCategoryEnum,
  custos_por_safra: z.record(z.string(), z.coerce.number().min(0, "Valor deve ser positivo")),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type ProductionCost = z.infer<typeof productionCostSchema>;

// Form schema for creating/editing production costs
export const productionCostFormSchema = z.object({
  propriedade_id: z.string().refine(val => val === "all" || z.string().uuid().safeParse(val).success, {
    message: "Selecione uma propriedade válida"
  }).optional(),
  cultura_id: z.string().uuid("Selecione uma cultura válida"),
  sistema_id: z.string().uuid("Selecione um sistema válido"),
  ciclo_id: z.string().uuid("Selecione um ciclo válido"),
  categoria: productionCostCategoryEnum.refine(val => !!val, {
    message: "Selecione uma categoria de custo"
  }),
  custos_por_safra: z.record(z.string(), z.coerce.number().min(0, "Valor deve ser maior ou igual a 0").refine(val => !isNaN(val), {
    message: "Insira um valor numérico válido para o custo"
  }))
    .refine(data => Object.keys(data).length > 0, "Adicione pelo menos um custo por safra"),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
});
export type ProductionCostFormValues = z.infer<typeof productionCostFormSchema>;

// Schema for multi-safra production cost form
export const multiSafraProductionCostFormSchema = productionCostFormSchema;
export type MultiSafraProductionCostFormValues = ProductionCostFormValues;

// =======================================
// Livestock Schema
// =======================================

// Enum para unidades de preço de animais
export const priceUnitEnum = z.enum([
  "CABECA", // Por cabeça (R$/cabeça)
  "KG",     // Por quilograma (R$/kg)
  "ARROBA", // Por arroba (R$/@)
  "LOTE"    // Por lote (R$/lote)
], {
  errorMap: (issue, ctx) => ({ message: "Selecione uma unidade de preço válida" })
});
export type PriceUnit = z.infer<typeof priceUnitEnum>;

// Schema for Livestock (Rebanho)
export const livestockSchema = z.object({
  id: z.string().uuid("ID inválido").optional(),
  organizacao_id: z.string().uuid("Organização inválida"),
  tipo_animal: z.string().min(1, "Tipo de animal é obrigatório"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  quantidade: z.coerce.number().min(0, "Quantidade deve ser positiva ou zero").refine(val => !isNaN(val), {
    message: "Insira um valor numérico válido para a quantidade"
  }),
  preco_unitario: z.coerce.number().min(0, "Preço unitário deve ser positivo ou zero").refine(val => !isNaN(val), {
    message: "Insira um valor numérico válido para o preço unitário"
  }),
  unidade_preco: priceUnitEnum.refine(val => !!val, {
    message: "Selecione uma unidade de preço"
  }),
  numero_cabecas: z.coerce.number().int("Número de cabeças deve ser um número inteiro").min(0, "Número de cabeças deve ser positivo ou zero").optional().refine(val => val === undefined || !isNaN(val), {
    message: "Insira um valor numérico válido para o número de cabeças"
  }),
  propriedade_id: z.string().uuid("Selecione uma propriedade válida"),
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
], {
  errorMap: (issue, ctx) => ({ message: "Selecione um ciclo de operação válido" })
});
export type LivestockOperationCycle = z.infer<typeof livestockOperationCycleEnum>;

// Enum for livestock operation origin
export const livestockOperationOriginEnum = z.enum([
  "PROPRIO",
  "TERCEIRO"
], {
  errorMap: (issue, ctx) => ({ message: "Selecione uma origem válida" })
});
export type LivestockOperationOrigin = z.infer<typeof livestockOperationOriginEnum>;

// Schema for Livestock Operations (Operações Pecuárias)
export const livestockOperationSchema = z.object({
  id: z.string().uuid("ID inválido").optional(),
  organizacao_id: z.string().uuid("Organização inválida"),
  ciclo: livestockOperationCycleEnum.refine(val => !!val, {
    message: "Selecione um ciclo de operação"
  }),
  origem: livestockOperationOriginEnum.refine(val => !!val, {
    message: "Selecione uma origem"
  }),
  propriedade_id: z.string().uuid("Selecione uma propriedade válida"),
  volume_abate_por_safra: z.record(z.string(), z.number().refine(val => !isNaN(val), {
    message: "Insira um valor numérico válido para o volume de abate"
  })).or(z.string()),
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

// =======================================
// Bovine Schema (Faixas Etárias)
// =======================================

// Enum para faixas etárias de bovinos
export const bovineAgeRangeEnum = z.enum([
  "0_12",      // 0 a 12 meses
  "13_24",     // 13 a 24 meses  
  "25_36",     // 25 a 36 meses
  "ACIMA_36"   // Acima de 36 meses
], {
  errorMap: (issue, ctx) => ({ message: "Selecione uma faixa etária válida" })
});
export type BovineAgeRange = z.infer<typeof bovineAgeRangeEnum>;

// Schema for Bovine with age ranges
export const bovineSchema = z.object({
  id: z.string().uuid("ID inválido").optional(),
  organizacao_id: z.string().uuid("Organização inválida"),
  propriedade_id: z.string().refine(val => val === "all" || z.string().uuid().safeParse(val).success, {
    message: "Selecione uma propriedade válida"
  }).optional(),
  sexo: z.enum(["MACHO", "FEMEA"], {
    errorMap: (issue, ctx) => ({ message: "Selecione o sexo do animal" })
  }),
  faixa_etaria: bovineAgeRangeEnum,
  quantidade: z.coerce.number().int("Quantidade deve ser um número inteiro").min(1, "Quantidade deve ser pelo menos 1").refine(val => !isNaN(val), {
    message: "Insira um valor numérico válido para a quantidade"
  }),
  peso_medio: z.coerce.number().min(0, "Peso médio deve ser positivo").refine(val => !isNaN(val), {
    message: "Insira um valor numérico válido para o peso"
  }).optional(),
  valor_arroba: z.coerce.number().min(0, "Valor da arroba deve ser positivo").refine(val => !isNaN(val), {
    message: "Insira um valor numérico válido para o valor"
  }).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Bovine = z.infer<typeof bovineSchema>;

export const bovineFormSchema = bovineSchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true
});
export type BovineFormValues = z.infer<typeof bovineFormSchema>;

// =======================================
// Price Schema (Preços e Cotações)
// =======================================

// Schema for Price Form
export const priceFormSchema = z.object({
  tipo: z.enum(["COMMODITY", "EXCHANGE_RATE"], {
    errorMap: () => ({ message: "Selecione o tipo de preço" })
  }),
  item_id: z.string().min(1, "Selecione um item"),
  sistema_id: z.string().uuid("ID do sistema inválido").optional(),
  ciclo_id: z.string().uuid("ID do ciclo inválido").optional(),
  unit: z.string().min(1, "Unidade é obrigatória"),
  precos_por_safra: z.record(z.string(), z.coerce.number().min(0, "Preço deve ser maior ou igual a 0"))
});

export type PriceFormValues = z.infer<typeof priceFormSchema>;