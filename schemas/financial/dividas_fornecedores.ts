import { z } from "zod";
import { currencyEnum, categoriaFornecedorEnum } from "./common";

// Schema para valores por safra
export const valoresPorSafraSchema = z.record(z.string(), z.number());
export type ValoresPorSafraType = z.infer<typeof valoresPorSafraSchema>;

// Schema para Dívidas de Fornecedores
export const dividasFornecedoresSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: categoriaFornecedorEnum,
  valores_por_safra: valoresPorSafraSchema.or(z.string()).optional(),
  moeda: currencyEnum.default("BRL"),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type DividasFornecedores = z.infer<typeof dividasFornecedoresSchema>;

// Schema para formulário de Dívidas de Fornecedores
export const dividasFornecedoresFormSchema = dividasFornecedoresSchema.omit({ 
  id: true, 
  organizacao_id: true,
  created_at: true,
  updated_at: true 
});

export type DividasFornecedoresFormValues = z.infer<typeof dividasFornecedoresFormSchema>;

// Schema para listagem de Dívidas de Fornecedores
export const dividasFornecedoresListItemSchema = dividasFornecedoresSchema.pick({
  id: true,
  nome: true,
  categoria: true,
  valores_por_safra: true,
  moeda: true
});

export type DividasFornecedoresListItem = z.infer<typeof dividasFornecedoresListItemSchema>;