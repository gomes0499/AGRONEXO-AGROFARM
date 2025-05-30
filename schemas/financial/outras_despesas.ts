import * as z from "zod";

export const outrasDespesasSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid().optional(),
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.enum(["ARRENDAMENTO", "PRO_LABORE", "DIVISAO_LUCROS", "FINANCEIRAS", "TRIBUTARIAS", "OUTROS"]),
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
  categoria: z.enum(["ARRENDAMENTO", "PRO_LABORE", "DIVISAO_LUCROS", "FINANCEIRAS", "TRIBUTARIAS", "OUTROS"]),
  valores_por_safra: z.record(z.string(), z.number().nonnegative()).optional(),
  total: z.number().optional(),
});

export type OutrasDespesasListItem = z.infer<typeof outrasDespesasListItemSchema>;