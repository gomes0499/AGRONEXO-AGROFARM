import { z } from "zod";

// Schema completo para vendas de sementes
// Incluir todos os campos usados no formulário
export const seedSaleSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  propriedade_id: z.string().uuid(),
  cultura_id: z.string().uuid(),
  safra_id: z.string().uuid(),
  receita_operacional_bruta: z.number().nonnegative(),
  impostos_vendas: z.number().nonnegative(),
  comissao_vendas: z.number().nonnegative(),
  logistica_entregas: z.number().nonnegative(),
  custo_mercadorias_vendidas: z.number().nonnegative(),
  despesas_gerais: z.number().nonnegative(),
  imposto_renda: z.number().nonnegative(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

// Schema para formulário de vendas de sementes (sem campos de sistema)
export const seedSaleFormSchema = seedSaleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type SeedSale = z.infer<typeof seedSaleSchema>;
export type SeedSaleFormValues = z.infer<typeof seedSaleFormSchema>;