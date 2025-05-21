import { z } from "zod";
import { currencyEnum } from "./common";

// Schema para valores anuais
export const annualValuesSchema = z.record(z.string(), z.number());
export type AnnualValuesType = z.infer<typeof annualValuesSchema>;

// Schema para Fornecedores
export const supplierSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1, "Nome do fornecedor é obrigatório"),
  moeda: currencyEnum.default("BRL"),
  valores_por_ano: annualValuesSchema.or(z.string()),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Supplier = z.infer<typeof supplierSchema>;

// Schema para formulário de fornecedores
export const supplierFormSchema = supplierSchema.omit({ 
  id: true, 
  organizacao_id: true,
  created_at: true,
  updated_at: true 
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

// Schema para listagem de fornecedores (dados simplificados para tabelas)
export const supplierListItemSchema = supplierSchema.pick({
  id: true,
  nome: true,
  moeda: true,
});

export type SupplierListItem = z.infer<typeof supplierListItemSchema>;