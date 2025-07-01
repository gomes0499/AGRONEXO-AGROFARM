import { z } from "zod";

// Schema baseado na tabela real vendas_ativos
// IMPORTANTE: A coluna 'tipo' não existe no banco, é adicionada virtualmente
export const assetSaleSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  ano: z.coerce.number().min(2000, "Ano deve ser maior que 2000").max(2050, "Ano deve ser menor que 2050").optional(),
  quantidade: z.coerce.number().min(1, "Quantidade deve ser maior que 0"),
  valor_unitario: z.coerce.number().min(0, "Valor unitário deve ser maior ou igual a 0"),
  valor_total: z.coerce.number().optional(), // Calculado automaticamente
  // Campo virtual (não existe no banco) para compatibilidade com a UI
  tipo: z.enum(["REALIZADO", "PLANEJADO"]).default("REALIZADO").optional(),
  safra_id: z.string().uuid().optional(),
  descricao: z.string().optional(),
  data_venda: z.date().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type AssetSale = z.infer<typeof assetSaleSchema>;

// Schema para formulário (sem campos automáticos)
// IMPORTANTE: A coluna 'tipo' não existe no banco, é adicionada virtualmente
export const assetSaleFormSchema = z.object({
  categoria: z.string().min(1, "Categoria é obrigatória"),
  ano: z.coerce.number().min(2000, "Ano deve ser maior que 2000").max(2050, "Ano deve ser menor que 2050").optional(),
  quantidade: z.coerce.number().min(1, "Quantidade deve ser maior que 0"),
  valor_unitario: z.coerce.number().min(0, "Valor unitário deve ser maior ou igual a 0"),
  // Campo virtual para compatibilidade com a UI
  tipo: z.enum(["REALIZADO", "PLANEJADO"]).optional(),
  descricao: z.string().optional(),
  data_venda: z.date().optional(),
  safra_id: z.string().uuid().optional(),
});

export type AssetSaleFormValues = z.infer<typeof assetSaleFormSchema>;

// Multi-safra form schema
export const multiSafraAssetSaleFormSchema = z.object({
  tipo: z.enum(["REALIZADO", "PLANEJADO"]).default("REALIZADO"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  vendas_por_safra: z.record(z.string(), z.object({
    quantidade: z.coerce.number().min(1, "Quantidade deve ser maior que 0"),
    valor_unitario: z.coerce.number().min(0, "Valor unitário deve ser maior ou igual a 0")
  })).refine(data => Object.keys(data).length > 0, "Adicione pelo menos uma venda por safra"),
});
export type MultiSafraAssetSaleFormValues = z.infer<typeof multiSafraAssetSaleFormSchema>;

// Export both schemas for component usage
export { assetSaleFormSchema as singleAssetSaleFormSchema };