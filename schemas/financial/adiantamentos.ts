import { z } from "zod";

// Schema para adiantamentos baseado na nova estrutura da tabela
export const adiantamentoSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1, "Nome é obrigatório"),
  valores_por_safra: z.record(z.string(), z.number()),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
});

export type Adiantamento = z.infer<typeof adiantamentoSchema>;

export const adiantamentoFormSchema = adiantamentoSchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true,
});

export type AdiantamentoForm = z.infer<typeof adiantamentoFormSchema>;

export const adiantamentoListItemSchema = adiantamentoSchema.pick({
  id: true,
  nome: true,
  valores_por_safra: true,
});

export type AdiantamentoListItem = z.infer<typeof adiantamentoListItemSchema>;