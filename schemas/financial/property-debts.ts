import { z } from "zod";
import { currencyEnum, annualFlowSchema } from "./common";

// Schema para Dívidas de Imóveis
export const propertyDebtSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  propriedade_id: z.string().uuid().optional(),
  denominacao_imovel: z.string().min(1, "Denominação do imóvel é obrigatória"),
  credor: z.string().min(1, "Nome do credor é obrigatório"),
  data_aquisicao: z.coerce.date(),
  data_vencimento: z.coerce.date(),
  moeda: currencyEnum.default("BRL"),
  valor_total: z.coerce.number().min(0, "Valor total deve ser positivo"),
  fluxo_pagamento_anual: annualFlowSchema.or(z.string()),
  safra_id: z.string().uuid().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type PropertyDebt = z.infer<typeof propertyDebtSchema>;

// Schema para formulário de dívidas de imóveis
export const propertyDebtFormSchema = propertyDebtSchema.omit({ 
  id: true, 
  organizacao_id: true,
  created_at: true,
  updated_at: true 
});

export type PropertyDebtFormValues = z.infer<typeof propertyDebtFormSchema>;

// Schema para listagem de dívidas de imóveis (dados simplificados para tabelas)
export const propertyDebtListItemSchema = propertyDebtSchema.pick({
  id: true,
  propriedade_id: true,
  credor: true,
  valor_total: true,
  data_vencimento: true,
  moeda: true,
});

export type PropertyDebtListItem = z.infer<typeof propertyDebtListItemSchema>;