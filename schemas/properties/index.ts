import { z } from "zod";

// Enum para tipos de propriedades
export const propertyTypeEnum = z.enum(["PROPRIO", "ARRENDADO"]);
export type PropertyType = z.infer<typeof propertyTypeEnum>;

// Schema para Propriedade
export const propertySchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1, "Nome da propriedade é obrigatório"),
  ano_aquisicao: z.coerce.number().int().min(1900).nullable(),
  proprietario: z.string().min(1, "Nome do proprietário é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().min(2, "Estado é obrigatório").max(2, "Use a sigla do estado (2 caracteres)"),
  numero_matricula: z.string().min(1, "Número da matrícula é obrigatório"),
  area_total: z.coerce.number().min(0, "Área total deve ser positiva"),
  area_cultivada: z.coerce.number().min(0, "Área cultivada deve ser positiva").nullable(),
  valor_atual: z.coerce.number().min(0, "Valor atual deve ser positivo").nullable(),
  onus: z.string().nullable().optional(),
  avaliacao_banco: z.coerce.number().nullable().optional(),
  tipo: propertyTypeEnum,
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Property = z.infer<typeof propertySchema>;

// Schema para formulário de propriedades (sem ID e com campos opcionais)
export const propertyFormSchema = propertySchema.omit({ 
  id: true, 
  organizacao_id: true,
  created_at: true,
  updated_at: true 
});
export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

// Schema para Arrendamento
export const leaseSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  propriedade_id: z.string().uuid(),
  numero_arrendamento: z.string().min(1, "Número do arrendamento é obrigatório"),
  area_fazenda: z.coerce.number().min(0, "Área da fazenda deve ser positiva"),
  area_arrendada: z.coerce.number().min(0, "Área arrendada deve ser positiva"),
  nome_fazenda: z.string().min(1, "Nome da fazenda é obrigatório"),
  arrendantes: z.string().min(1, "Nome dos arrendantes é obrigatório"),
  data_inicio: z.coerce.date(),
  data_termino: z.coerce.date(),
  custo_hectare: z.coerce.number().min(0, "Custo por hectare deve ser positivo"),
  custo_ano: z.coerce.number().min(0, "Custo anual deve ser positivo"),
  custos_projetados_anuais: z.record(z.string(), z.number()).or(z.string()),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Lease = z.infer<typeof leaseSchema>;

// Schema para formulário de arrendamentos
export const leaseFormSchema = leaseSchema.omit({ 
  id: true, 
  organizacao_id: true,
  created_at: true,
  updated_at: true
});
export type LeaseFormValues = z.infer<typeof leaseFormSchema>;

// Schema para Benfeitoria
export const improvementSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  propriedade_id: z.string().uuid(),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  dimensoes: z.string().nullable().optional(),
  valor: z.coerce.number().min(0, "Valor deve ser positivo"),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Improvement = z.infer<typeof improvementSchema>;

// Schema para formulário de benfeitorias
export const improvementFormSchema = improvementSchema.omit({ 
  id: true, 
  organizacao_id: true,
  created_at: true,
  updated_at: true 
});
export type ImprovementFormValues = z.infer<typeof improvementFormSchema>;