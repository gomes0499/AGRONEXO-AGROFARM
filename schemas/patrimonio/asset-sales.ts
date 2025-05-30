import { z } from "zod";

// Schema baseado na tabela real vendas_ativos
export const assetSaleSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  ano: z.coerce.number().min(2000, "Ano deve ser maior que 2000").max(2050, "Ano deve ser menor que 2050"),
  quantidade: z.coerce.number().min(1, "Quantidade deve ser maior que 0"),
  valor_unitario: z.coerce.number().min(0, "Valor unitário deve ser maior ou igual a 0"),
  valor_total: z.coerce.number().optional(), // Calculado automaticamente
  tipo: z.enum(["REALIZADO", "PLANEJADO"]).default("REALIZADO"),
  safra_id: z.string().uuid().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type AssetSale = z.infer<typeof assetSaleSchema>;

// Schema para formulário (sem campos automáticos)
export const assetSaleFormSchema = z.object({
  categoria: z.string().min(1, "Categoria é obrigatória"),
  quantidade: z.coerce.number().min(1, "Quantidade deve ser maior que 0"),
  valor_unitario: z.coerce.number().min(0, "Valor unitário deve ser maior ou igual a 0"),
  tipo: z.enum(["REALIZADO", "PLANEJADO"]),
  safra_id: z.string().uuid().optional(),
});

export type AssetSaleFormValues = z.infer<typeof assetSaleFormSchema>;