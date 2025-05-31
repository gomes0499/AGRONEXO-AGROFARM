import * as z from "zod";

// Enum com todas as categorias permitidas pelo banco de dados
export const outrasDespesasCategoriaEnum = z.enum([
  "TRIBUTARIAS", "PRO_LABORE", "OUTRAS_OPERACIONAIS", "DESPESAS_ADMINISTRATIVAS", 
  "DESPESAS_COMERCIAIS", "DESPESAS_FINANCEIRAS", "MANUTENCAO", "SEGUROS", 
  "CONSULTORIAS", "OUTROS"
]);

export type OutrasDespesasCategoriaType = z.infer<typeof outrasDespesasCategoriaEnum>;

export const outrasDespesasSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid().optional(),
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: outrasDespesasCategoriaEnum,
  valores_por_safra: z.record(z.string(), z.number().nonnegative()).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type OutrasDespesas = z.infer<typeof outrasDespesasSchema>;

export const outrasDespesasFormSchema = outrasDespesasSchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true,
});

export type OutrasDespesasFormValues = z.infer<typeof outrasDespesasFormSchema>;

export const outrasDespesasListItemSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  categoria: outrasDespesasCategoriaEnum,
  valores_por_safra: z.record(z.string(), z.number().nonnegative()).optional(),
  total: z.number().optional(),
});

export type OutrasDespesasListItem = z.infer<typeof outrasDespesasListItemSchema>;