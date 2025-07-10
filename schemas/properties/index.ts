import { z } from "zod";

// Enum para tipos de propriedades (must match database types.sql)
export const propertyTypeEnum = z.enum(["PROPRIO", "ARRENDADO", "PARCERIA_AGRICOLA"], {
  errorMap: (issue, ctx) => ({ message: "Selecione um tipo de propriedade válido" })
});
export type PropertyType = z.infer<typeof propertyTypeEnum>;

// Enum para status de propriedades
export const propertyStatusEnum = z.enum(["ATIVA", "INATIVA", "EM_NEGOCIACAO", "VENDIDA"], {
  errorMap: (issue, ctx) => ({ message: "Selecione um status válido" })
});
export type PropertyStatus = z.infer<typeof propertyStatusEnum>;

// Enum para tipos de anuência
export const anuenciaTypeEnum = z.enum(["COM_ANUENCIA", "SEM_ANUENCIA"], {
  errorMap: (issue, ctx) => ({ message: "Selecione um tipo de anuência válido" })
});
export type AnuenciaType = z.infer<typeof anuenciaTypeEnum>;

// Enum para tipos de pagamento de arrendamento
export const leasePaymentTypeEnum = z.enum(["SACAS", "DINHEIRO", "MISTO", "PERCENTUAL_PRODUCAO"], {
  errorMap: (issue, ctx) => ({ message: "Selecione um tipo de pagamento válido" })
});
export type LeasePaymentType = z.infer<typeof leasePaymentTypeEnum>;

// Schema para proprietários de propriedades
export const propertyOwnerSchema = z.object({
  id: z.string().uuid().optional(),
  propriedade_id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid().optional(),
  nome: z.string().min(1, "Nome do proprietário é obrigatório"),
  cpf_cnpj: z.string().optional(),
  tipo_pessoa: z.enum(["F", "J"], {
    errorMap: () => ({ message: "Selecione o tipo de pessoa" })
  }).optional(),
  percentual_participacao: z.coerce.number()
    .min(0, "Percentual deve ser maior que 0")
    .max(100, "Percentual não pode exceder 100")
    .optional(),
});

export type PropertyOwner = z.infer<typeof propertyOwnerSchema>;

// Enum para tipos de ônus
export const onusTypeEnum = z.enum(["hipoteca", "alienacao_fiduciaria", "outros"], {
  errorMap: () => ({ message: "Selecione um tipo de ônus válido" })
});
export type OnusType = z.infer<typeof onusTypeEnum>;

// Schema para Propriedade (matches database table exactly)
export const propertySchema = z.object({
  id: z.string().uuid("ID inválido").optional(),
  organizacao_id: z.string().uuid("Organização inválida"),
  nome: z.string().min(1, "Nome da propriedade é obrigatório"),
  // Ano de aquisição só é obrigatório para propriedades próprias
  ano_aquisicao: z.coerce.number().int("Ano de aquisição deve ser um número inteiro").min(1900, "Ano de aquisição deve ser após 1900").nullable().optional().refine(val => val === null || val === undefined || !isNaN(val), {
    message: "Insira um ano válido"
  }),
  proprietario: z.string().nullable(),
  proprietarios: z.array(propertyOwnerSchema).optional().default([]),
  cidade: z.string().nullable(),
  estado: z.string().nullable(),
  numero_matricula: z.string().nullable(),
  area_total: z.coerce.number().min(0, "Área total deve ser positiva ou zero").nullable().refine(val => val === null || !isNaN(val), {
    message: "Insira um valor numérico válido para a área total"
  }),
  area_cultivada: z.coerce.number().min(0, "Área cultivada deve ser positiva ou zero").nullable().refine(val => val === null || !isNaN(val), {
    message: "Insira um valor numérico válido para a área cultivada"
  }),
  valor_atual: z.coerce.number().min(0, "Valor atual deve ser positivo ou zero").nullable().transform(val => val === 0 ? null : val).refine(val => val === null || !isNaN(val), {
    message: "Insira um valor numérico válido para o valor atual"
  }),
  // Novos campos para cálculo de valor
  valor_terra_nua: z.coerce.number().min(0, "Valor da terra nua deve ser positivo ou zero").nullable().optional().refine(val => val === null || val === undefined || !isNaN(val), {
    message: "Insira um valor numérico válido para o valor da terra nua"
  }),
  valor_benfeitoria: z.coerce.number().min(0, "Valor da benfeitoria deve ser positivo ou zero").nullable().optional().refine(val => val === null || val === undefined || !isNaN(val), {
    message: "Insira um valor numérico válido para o valor da benfeitoria"
  }),
  // Campos de ônus
  onus: z.string().nullable(),
  tipo_onus: onusTypeEnum.nullable().optional(),
  banco_onus: z.string().nullable().optional(),
  valor_onus: z.coerce.number().min(0, "Valor do ônus deve ser positivo ou zero").nullable().optional().refine(val => val === null || val === undefined || !isNaN(val), {
    message: "Insira um valor numérico válido para o valor do ônus"
  }),
  area_pecuaria: z.coerce.number().min(0, "Área de pecuária deve ser positiva ou zero").nullable().optional().refine(val => val === null || val === undefined || !isNaN(val), {
    message: "Insira um valor numérico válido para a área de pecuária"
  }),
  avaliacao_terceiro: z.coerce.number().min(0, "Avaliação de terceiro deve ser positiva ou zero").nullable().optional().refine(val => val === null || val === undefined || !isNaN(val), {
    message: "Insira um valor numérico válido para a avaliação de terceiro"
  }),
  documento_onus_url: z.string().nullable().optional(),
  avaliacao_banco: z.coerce.number().nullable().transform(val => val === 0 ? null : val).refine(val => val === null || !isNaN(val), {
    message: "Insira um valor numérico válido para a avaliação do banco"
  }),
  tipo: propertyTypeEnum.default("PROPRIO").refine(val => !!val, {
    message: "Selecione um tipo de propriedade"
  }),
  status: propertyStatusEnum.default("ATIVA").refine(val => !!val, {
    message: "Selecione um status"
  }),
  // Campos adicionais
  imagem: z.string().nullable().optional(),
  cartorio_registro: z.string().nullable().optional(),
  numero_car: z.string().nullable().optional(),
  numero_itr: z.string().nullable().optional(),
  data_inicio: z.coerce.date().nullable().optional(),
  data_termino: z.coerce.date().nullable().optional(),
  tipo_anuencia: z.string().nullable().optional(),
  // Campos de arrendamento
  arrendantes: z.string().nullable().optional(),
  custo_hectare: z.coerce.number().min(0, "Custo por hectare deve ser positivo ou zero").nullable().optional().refine(val => val === null || val === undefined || !isNaN(val), {
    message: "Insira um valor numérico válido para o custo por hectare"
  }),
  tipo_pagamento: z.enum(["SACAS", "DINHEIRO", "MISTO", "PERCENTUAL_PRODUCAO"]).nullable().optional(),
  custos_por_safra: z.record(z.string(), z.number()).nullable().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Property = z.infer<typeof propertySchema>;

// Schema para formulário de propriedades (sem ID e com campos opcionais)
// Schema base para o formulário (sem validações condicionais)
const basePropertyFormSchema = propertySchema.omit({ 
  id: true, 
  organizacao_id: true,
  created_at: true,
  updated_at: true 
});

// Schema refinado com validações condicionais baseadas no tipo de propriedade
export const propertyFormSchema = basePropertyFormSchema
  // Uma única função superRefine para todas as validações condicionais
  .superRefine((data, ctx) => {
    // Validação para propriedades próprias
    if (data.tipo === "PROPRIO") {
      if (!data.ano_aquisicao) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ano de aquisição é obrigatório para propriedades próprias",
          path: ["ano_aquisicao"],
        });
      }
    } 
    // Validação para propriedades arrendadas e parceria agrícola
    else if (data.tipo === "ARRENDADO" || data.tipo === "PARCERIA_AGRICOLA") {
      if (!data.data_inicio) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Data de início é obrigatória para ${data.tipo === "ARRENDADO" ? "propriedades arrendadas" : "parcerias agrícolas"}`,
          path: ["data_inicio"],
        });
      }
      
      if (!data.data_termino) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Data de término é obrigatória para ${data.tipo === "ARRENDADO" ? "propriedades arrendadas" : "parcerias agrícolas"}`,
          path: ["data_termino"],
        });
      }
      
      if (!data.tipo_anuencia) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Tipo de anuência é obrigatório para ${data.tipo === "ARRENDADO" ? "propriedades arrendadas" : "parcerias agrícolas"}`,
          path: ["tipo_anuencia"],
        });
      }
      
      if (!data.arrendantes) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Arrendantes é obrigatório para ${data.tipo === "ARRENDADO" ? "propriedades arrendadas" : "parcerias agrícolas"}`,
          path: ["arrendantes"],
        });
      }
      
      if (!data.custo_hectare || data.custo_hectare <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Custo por hectare é obrigatório para ${data.tipo === "ARRENDADO" ? "propriedades arrendadas" : "parcerias agrícolas"}`,
          path: ["custo_hectare"],
        });
      }
      
      if (!data.tipo_pagamento) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Tipo de pagamento é obrigatório para ${data.tipo === "ARRENDADO" ? "propriedades arrendadas" : "parcerias agrícolas"}`,
          path: ["tipo_pagamento"],
        });
      }
    }
    // Para outros tipos de propriedade, não exigimos campos específicos
  });

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

// Schema para Arrendamento (matches database table exactly)
export const leaseSchema = z.object({
  id: z.string().uuid("ID inválido").optional(),
  organizacao_id: z.string().uuid("Organização inválida"),
  propriedade_id: z.string().uuid("Selecione uma propriedade válida"),
  numero_arrendamento: z.string().min(1, "Número do arrendamento é obrigatório"),
  nome_fazenda: z.string().min(1, "Nome da fazenda é obrigatório"),
  arrendantes: z.string().min(1, "Nome dos arrendantes é obrigatório"),
  data_inicio: z.coerce.date({
    errorMap: () => ({ message: "Data de início inválida" })
  }),
  data_termino: z.coerce.date({
    errorMap: () => ({ message: "Data de término inválida" })
  }),
  area_fazenda: z.coerce.number().min(0, "Área da fazenda deve ser maior ou igual a 0").refine(val => !isNaN(val), {
    message: "Insira um valor numérico válido para a área da fazenda"
  }),
  area_arrendada: z.coerce.number().min(0, "Área arrendada deve ser maior ou igual a 0").refine(val => !isNaN(val), {
    message: "Insira um valor numérico válido para a área arrendada"
  }),
  custo_hectare: z.coerce.number().min(0, "Custo por hectare deve ser positivo ou zero").nullable().refine(val => val === null || !isNaN(val), {
    message: "Insira um valor numérico válido para o custo por hectare"
  }),
  tipo_pagamento: leasePaymentTypeEnum.default("SACAS").refine(val => !!val, {
    message: "Selecione um tipo de pagamento"
  }),
  // Garantir que custos_por_ano tenha pelo menos uma entrada
  custos_por_ano: z.record(z.string(), z.any())
    .refine(data => Object.keys(data).length > 0, {
      message: "É necessário informar pelo menos um custo anual"
    })
    .default({}),
  ativo: z.boolean().default(true),
  observacoes: z.string().nullable().optional(),
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
}).superRefine((data, ctx) => {
  // Validação de datas
  if (data.data_inicio && data.data_termino) {
    const inicio = new Date(data.data_inicio);
    const termino = new Date(data.data_termino);
    
    if (termino <= inicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data de término deve ser posterior à data de início",
        path: ["data_termino"],
      });
    }
  }
  
  // Validação de áreas
  if (data.area_arrendada > data.area_fazenda) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A área arrendada não pode ser maior que a área total da fazenda",
      path: ["area_arrendada"],
    });
  }
});
export type LeaseFormValues = z.infer<typeof leaseFormSchema>;

// Schema para Benfeitoria
export const improvementSchema = z.object({
  id: z.string().uuid("ID inválido").optional(),
  organizacao_id: z.string().uuid("Organização inválida"),
  propriedade_id: z.string().uuid("Selecione uma propriedade válida"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  dimensoes: z.string().nullable().optional(),
  valor: z.coerce.number().min(0, "Valor deve ser positivo ou zero").refine(val => !isNaN(val), {
    message: "Insira um valor numérico válido"
  }),
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