import { z } from "zod";

// Enum para tipos de propriedades (must match database types.sql)
export const propertyTypeEnum = z.enum(["PROPRIO", "ARRENDADO", "PARCERIA", "COMODATO"]);
export type PropertyType = z.infer<typeof propertyTypeEnum>;

// Enum para status de propriedades
export const propertyStatusEnum = z.enum(["ATIVA", "INATIVA", "EM_NEGOCIACAO", "VENDIDA"]);
export type PropertyStatus = z.infer<typeof propertyStatusEnum>;

// Enum para tipos de anuência
export const anuenciaTypeEnum = z.enum(["COM_ANUENCIA", "SEM_ANUENCIA"]);
export type AnuenciaType = z.infer<typeof anuenciaTypeEnum>;

// Enum para tipos de pagamento de arrendamento
export const leasePaymentTypeEnum = z.enum(["SACAS", "DINHEIRO", "MISTO", "PERCENTUAL_PRODUCAO"]);
export type LeasePaymentType = z.infer<typeof leasePaymentTypeEnum>;

// Schema para Propriedade (matches database table exactly)
export const propertySchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1, "Nome da propriedade é obrigatório"),
  ano_aquisicao: z.coerce.number().int().min(1900).nullable(),
  proprietario: z.string().nullable(),
  cidade: z.string().nullable(),
  estado: z.string().nullable(),
  numero_matricula: z.string().nullable(),
  area_total: z.coerce.number().min(0, "Área total deve ser positiva").nullable(),
  area_cultivada: z.coerce.number().min(0, "Área cultivada deve ser positiva").nullable(),
  valor_atual: z.coerce.number().min(0, "Valor atual deve ser positivo").nullable(),
  onus: z.string().nullable(),
  avaliacao_banco: z.coerce.number().nullable(),
  tipo: propertyTypeEnum.default("PROPRIO"),
  status: propertyStatusEnum.default("ATIVA"),
  // Campos adicionais
  imagem: z.string().nullable().optional(),
  cartorio_registro: z.string().nullable().optional(),
  numero_car: z.string().nullable().optional(),
  data_inicio: z.coerce.date().nullable().optional(),
  data_termino: z.coerce.date().nullable().optional(),
  tipo_anuencia: z.string().nullable().optional(),
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

// Schema para Arrendamento (matches database table exactly)
export const leaseSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  propriedade_id: z.string().uuid(),
  safra_id: z.string().uuid(),
  numero_arrendamento: z.string().min(1, "Número do arrendamento é obrigatório"),
  nome_fazenda: z.string().min(1, "Nome da fazenda é obrigatório"),
  arrendantes: z.string().min(1, "Nome dos arrendantes é obrigatório"),
  data_inicio: z.coerce.date(),
  data_termino: z.coerce.date(),
  area_fazenda: z.coerce.number().min(0, "Área da fazenda deve ser positiva"),
  area_arrendada: z.coerce.number().min(0, "Área arrendada deve ser positiva"),
  custo_hectare: z.coerce.number().min(0, "Custo por hectare deve ser positivo").nullable(),
  tipo_pagamento: leasePaymentTypeEnum.default("SACAS"),
  custos_por_ano: z.record(z.string(), z.any()).default({}), // JSONB format: {"safra_id": value}
  ativo: z.boolean().default(true),
  observacoes: z.string().nullable().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Lease = z.infer<typeof leaseSchema> & {
  safra?: {
    id: string;
    nome: string;
    ano_inicio: number;
    ano_fim: number;
  };
};

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