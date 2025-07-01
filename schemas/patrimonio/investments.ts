import { z } from "zod";
import { assetCategoryEnum, yearSchema, monetaryValueSchema, quantitySchema, patrimonioTipoEnum } from "./common";

// Schema para investimentos (unificado para realizados e planejados)
export const investmentSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  ano: yearSchema,
  quantidade: quantitySchema,
  valor_unitario: monetaryValueSchema,
  valor_total: monetaryValueSchema.optional(),
  tipo: patrimonioTipoEnum.default("REALIZADO"),
  safra_id: z.string().uuid().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Investment = z.infer<typeof investmentSchema>;

// Form schema
export const investmentFormSchema = z.object({
  categoria: z.string().min(1, "Categoria é obrigatória"),
  quantidade: quantitySchema,
  valor_unitario: monetaryValueSchema,
  tipo: patrimonioTipoEnum,
  safra_id: z.string().uuid().optional(),
  ano: yearSchema.optional(), // Campo opcional para permitir cálculo dinâmico
});
export type InvestmentFormValues = z.infer<typeof investmentFormSchema>;

// Multi-safra form schema
export const multiSafraInvestmentFormSchema = z.object({
  categoria: z.string().min(1, "Categoria é obrigatória"),
  tipo: patrimonioTipoEnum,
  investimentos_por_safra: z.record(z.string(), z.object({
    quantidade: quantitySchema,
    valor_unitario: monetaryValueSchema
  })).refine(data => Object.keys(data).length > 0, "Adicione pelo menos um investimento por safra"),
});
export type MultiSafraInvestmentFormValues = z.infer<typeof multiSafraInvestmentFormSchema>;

// List schema
export const investmentListItemSchema = investmentSchema.pick({
  id: true,
  categoria: true,
  ano: true,
  quantidade: true,
  valor_unitario: true,
  valor_total: true,
  tipo: true,
});
export type InvestmentListItem = z.infer<typeof investmentListItemSchema>;

// Export both schemas for component usage
export { investmentFormSchema as singleInvestmentFormSchema };