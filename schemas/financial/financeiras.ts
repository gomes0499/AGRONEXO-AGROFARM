import { z } from "zod";

// Schema para valores por safra
export const safraValuesSchema = z.record(z.string(), z.number());
export type SafraValuesType = z.infer<typeof safraValuesSchema>;

// Enum para categorias de financeiras
export const financeirasCategoriasEnum = z.enum([
  "OUTROS_CREDITOS",           // Outros créditos
  "REFINANCIAMENTO_BANCOS",    // Refinanciamentos - Bancos
  "REFINANCIAMENTO_CLIENTES",  // Refinanciamentos - Adto Clientes
  "NOVAS_LINHAS_CREDITO"       // Novas linhas de crédito
]);
export type FinanceirasCategoriaType = z.infer<typeof financeirasCategoriasEnum>;

// Schema para Financeiras
export const financeirasSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  safra_id: z.string().uuid(),
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: financeirasCategoriasEnum,
  valores_por_safra: safraValuesSchema.or(z.string()).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Financeiras = z.infer<typeof financeirasSchema>;

// Schema para formulário de Financeiras
export const financeirasFormSchema = financeirasSchema.omit({ 
  id: true, 
  organizacao_id: true,
  created_at: true,
  updated_at: true 
});

export type FinanceirasFormValues = z.infer<typeof financeirasFormSchema>;

// Schema para listagem de Financeiras (dados simplificados para tabelas)
export const financeirasListItemSchema = financeirasSchema.pick({
  id: true,
  nome: true,
  categoria: true,
  valores_por_safra: true,
});

export type FinanceirasListItem = z.infer<typeof financeirasListItemSchema>;