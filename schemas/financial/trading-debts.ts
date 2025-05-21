import { z } from "zod";
import { debtModalityEnum, currencyEnum, annualFlowSchema } from "./common";

// Schema para Dívidas com Tradings
export const tradingDebtSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  modalidade: debtModalityEnum,
  empresa_trading: z.string().min(1, "Nome da empresa trading é obrigatório"),
  indexador: z.string().min(1, "Indexador é obrigatório"),
  taxa_real: z.coerce.number().min(0, "Taxa real deve ser positiva"),
  fluxo_pagamento_anual: annualFlowSchema.or(z.string()),
  moeda: currencyEnum.default("BRL"),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type TradingDebt = z.infer<typeof tradingDebtSchema>;

// Schema para formulário de dívidas com tradings
export const tradingDebtFormSchema = tradingDebtSchema.omit({ 
  id: true, 
  organizacao_id: true,
  created_at: true,
  updated_at: true 
});

export type TradingDebtFormValues = z.infer<typeof tradingDebtFormSchema>;

// Schema para listagem de dívidas com tradings (dados simplificados para tabelas)
export const tradingDebtListItemSchema = tradingDebtSchema.pick({
  id: true,
  empresa_trading: true,
  modalidade: true,
  taxa_real: true,
  moeda: true,
});

export type TradingDebtListItem = z.infer<typeof tradingDebtListItemSchema>;