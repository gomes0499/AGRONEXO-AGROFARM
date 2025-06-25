import * as z from "zod";

export const dividasTerrasSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid().optional(),
  nome: z.string().min(1, "Nome é obrigatório"),
  propriedade_id: z.string().uuid().optional(),
  moeda: z.enum(["BRL", "USD"]).default("BRL"),
  valores_por_safra: z.record(z.string(), z.number().nonnegative()).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type DividasTerras = z.infer<typeof dividasTerrasSchema>;

export const dividasTerrasFormSchema = dividasTerrasSchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true,
});

export type DividasTerrasFormValues = z.infer<typeof dividasTerrasFormSchema>;

export const dividasTerrasListItemSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  propriedade_nome: z.string().optional(),
  propriedade_id: z.string().uuid().optional(),
  moeda: z.enum(["BRL", "USD"]).default("BRL"),
  valores_por_safra: z.record(z.string(), z.number().nonnegative()).optional(),
  total: z.number().optional(),
});

export type DividasTerrasListItem = z.infer<typeof dividasTerrasListItemSchema>;