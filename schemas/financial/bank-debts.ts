import { z } from "zod";
import { 
  debtModalityEnum, 
  currencyEnum, 
  annualFlowSchema, 
  financialInstitutionTypeEnum,
  debtStatusEnum 
} from "./common";

// Schema para Dívidas Bancárias (matches database table exactly)
export const bankDebtSchema = z.object({
  id: z.string().uuid("ID inválido").optional(),
  organizacao_id: z.string().uuid("Selecione uma organização válida"),
  safra_id: z.string().uuid("Selecione uma safra válida"), // Required in database
  tipo: financialInstitutionTypeEnum.refine(val => !!val, {
    message: "Selecione um tipo de instituição financeira"
  }),
  modalidade: debtModalityEnum.refine(val => !!val, {
    message: "Selecione uma modalidade de dívida"
  }),
  instituicao_bancaria: z.string().min(1, "Nome da instituição bancária é obrigatório"),
  ano_contratacao: z.coerce.number().int().min(2000, "O ano de contratação deve ser maior ou igual a 2000").max(2100, "O ano de contratação não pode ser maior que 2100"),
  indexador: z.string().min(1, "Indexador é obrigatório"),
  taxa_real: z.coerce.number().min(-10, "A taxa real não pode ser menor que -10%").max(100, "A taxa real não pode ser maior que 100%"),
  fluxo_pagamento_anual: annualFlowSchema.or(z.string()).default({}), // JSONB format: {"safra_id": value}
  moeda: currencyEnum.default("BRL"),
  status: debtStatusEnum.default("ATIVA"),
  observacoes: z.string().nullable(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type BankDebt = z.infer<typeof bankDebtSchema>;

// Schema para formulário de dívidas bancárias
export const bankDebtFormSchema = bankDebtSchema.omit({ 
  id: true, 
  organizacao_id: true,
  created_at: true,
  updated_at: true 
});

export type BankDebtFormValues = z.infer<typeof bankDebtFormSchema>;

// Schema para listagem de dívidas bancárias (dados simplificados para tabelas)
export const bankDebtListItemSchema = bankDebtSchema.pick({
  id: true,
  instituicao_bancaria: true,
  modalidade: true,
  ano_contratacao: true,
  taxa_real: true,
  fluxo_pagamento_anual: true,
  moeda: true,
});

export type BankDebtListItem = z.infer<typeof bankDebtListItemSchema>;