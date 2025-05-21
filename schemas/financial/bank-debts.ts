import { z } from "zod";
import { debtModalityEnum, currencyEnum, annualFlowSchema } from "./common";

// Schema para Dívidas Bancárias
export const bankDebtSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  modalidade: debtModalityEnum,
  instituicao_bancaria: z.string().min(1, "Nome da instituição bancária é obrigatório"),
  ano_contratacao: z.coerce.number().int().min(1900, "Ano de contratação inválido"),
  indexador: z.string().min(1, "Indexador é obrigatório"),
  taxa_real: z.coerce.number().min(0, "Taxa real deve ser positiva"),
  fluxo_pagamento_anual: annualFlowSchema.or(z.string()),
  moeda: currencyEnum.default("BRL"),
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