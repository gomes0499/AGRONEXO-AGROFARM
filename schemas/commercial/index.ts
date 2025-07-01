import { z } from "zod";

export { priceSchema, priceFormSchema, type Price, type PriceFormValues } from "./prices";
export { seedSaleSchema, seedSaleFormSchema, type SeedSale, type SeedSaleFormValues } from "./seeds";

// Placeholder schemas - these need to be properly implemented
export const livestockSaleSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  ano: z.number(),
  receita_operacional_bruta: z.number(),
  impostos_vendas: z.number(),
  comissao_vendas: z.number(),
  logistica_entregas: z.number(),
  custo_mercadorias_vendidas: z.number(),
  despesas_gerais: z.number(),
  imposto_renda: z.number(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const commodityStockSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  commodity: z.enum(["SOJA", "ALGODAO", "MILHO", "ARROZ", "SORGO", "CAFE", "CACAU", "SOJA_CANA", "OUTROS"]),
  quantidade: z.number(),
  preco_unitario: z.number(),
  valor_total: z.number().optional(),
  data_referencia: z.date(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const priceAlertSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  commodity: z.enum(["SOJA", "ALGODAO", "MILHO", "ARROZ", "SORGO", "CAFE", "CACAU", "SOJA_CANA", "OUTROS"]),
  price_target: z.number(),
  alert_type: z.enum(["ABOVE", "BELOW"]),
  active: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});