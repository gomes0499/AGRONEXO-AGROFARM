import { z } from "zod";

// Schema para valores por safra
export const safraValuesSchema = z.record(z.string(), z.number());
export type SafraValuesType = z.infer<typeof safraValuesSchema>;

// Enum para categorias de receitas financeiras
export const receitaFinanceiraCategoriaEnum = z.enum([
  "JUROS_APLICACOES",     // Juros de aplicações financeiras
  "RENDIMENTOS_FUNDOS",   // Rendimentos de fundos de investimento
  "DESCONTOS_OBTIDOS",    // Descontos obtidos em pagamentos
  "VARIACAO_CAMBIAL",     // Variação cambial positiva
  "HEDGE",                // Resultados com hedge
  "DIVIDENDOS",           // Dividendos recebidos
  "OUTRAS_RECEITAS"       // Outras receitas financeiras
]);
export type ReceitaFinanceiraCategoriaType = z.infer<typeof receitaFinanceiraCategoriaEnum>;

// Schema para Receitas Financeiras
export const receitaFinanceiraSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  categoria: receitaFinanceiraCategoriaEnum,
  descricao: z.string().min(1, "Descrição é obrigatória"),
  moeda: z.enum(["BRL", "USD"]).default("BRL"),
  valor: z.number().min(0),
  safra_id: z.string().uuid().optional(),
  data_receita: z.string().optional(),
  taxa_cambio_referencia: z.number().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  // Campo virtual para compatibilidade
  nome: z.string().optional(),
  valores_por_safra: safraValuesSchema.or(z.string()).optional(),
});

export type ReceitaFinanceira = z.infer<typeof receitaFinanceiraSchema>;

// Schema para formulário de Receitas Financeiras
export const receitaFinanceiraFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: receitaFinanceiraCategoriaEnum,
  descricao: z.string().optional(),
  moeda: z.enum(["BRL", "USD"]).default("BRL"),
  valores_por_safra: z.record(z.string(), z.number().min(0)).default({}),
});

export type ReceitaFinanceiraFormValues = z.infer<typeof receitaFinanceiraFormSchema>;

// Schema para listagem de Receitas Financeiras
export const receitaFinanceiraListItemSchema = receitaFinanceiraSchema.pick({
  id: true,
  nome: true,
  categoria: true,
  valores_por_safra: true,
  descricao: true,
});

export type ReceitaFinanceiraListItem = z.infer<typeof receitaFinanceiraListItemSchema>;