import { z } from "zod";

// Schema para a enum de tipo de commodity
export const commodityTypeEnum = z.enum([
  "SOJA",
  "ALGODAO",
  "MILHO",
  "ARROZ",
  "SORGO",
  "CAFE",
  "CACAU",
  "SOJA_CANA",
  "OUTROS",
]);

export type CommodityType = z.infer<typeof commodityTypeEnum>;

// Schema para a enum de tipo de moeda
export const currencyTypeEnum = z.enum(["BRL", "USD"]);

export type CurrencyType = z.infer<typeof currencyTypeEnum>;

// Schema para preços de commodities
export const priceSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  safra_id: z.string().uuid(),
  dolar_algodao: z.number().positive().nullable().optional(),
  dolar_milho: z.number().positive().nullable().optional(),
  dolar_soja: z.number().positive().nullable().optional(),
  dolar_fechamento: z.number().positive().nullable().optional(),
  preco_algodao: z.number().positive().nullable().optional(), // USD/lb
  preco_caroco_algodao: z.number().positive().nullable().optional(), // R$/ton
  preco_unitario_caroco_algodao: z.number().positive().nullable().optional(), // R$/@
  preco_algodao_bruto: z.number().positive().nullable().optional(), // R$/@
  preco_milho: z.number().positive().nullable().optional(), // R$/saca
  preco_soja_usd: z.number().positive().nullable().optional(), // U$/saca
  preco_soja_brl: z.number().positive().nullable().optional(), // R$/saca
  outros_precos: z.record(z.string(), z.number().positive()).nullable().optional(), // preços de outras culturas
  data_referencia: z.date().default(() => new Date()),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

// Schema para formulário de preços (sem campos de sistema)
export const priceFormSchema = priceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type Price = z.infer<typeof priceSchema>;
export type PriceFormValues = z.infer<typeof priceFormSchema>;

// Vendas de sementes são importadas do módulo seeds.ts

// Schema para vendas pecuárias
export const livestockSaleSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  propriedade_id: z.string().uuid(),
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

// Schema para formulário de vendas pecuárias (sem campos de sistema)
export const livestockSaleFormSchema = livestockSaleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type LivestockSale = z.infer<typeof livestockSaleSchema>;
export type LivestockSaleFormValues = z.infer<typeof livestockSaleFormSchema>;

// Schema para estoque de commodities
export const commodityStockSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  commodity: commodityTypeEnum,
  quantidade: z.number().positive(),
  valor_unitario: z.number().positive(),
  valor_total: z.number().positive(),
  data_referencia: z.date().default(() => new Date()),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

// Schema para formulário de estoque de commodities (sem campos de sistema e valor_total que é calculado)
export const commodityStockFormSchema = commodityStockSchema.omit({
  id: true,
  valor_total: true,
  created_at: true,
  updated_at: true,
});

export type CommodityStock = z.infer<typeof commodityStockSchema>;
export type CommodityStockFormValues = z.infer<typeof commodityStockFormSchema>;

// Importamos o schema de vendas de sementes
import { seedSaleSchema } from './seeds';

// Schema para dashboard comercial (união de dados)
export const commercialDashboardSchema = z.object({
  prices: z.array(priceSchema).optional(),
  seedSales: z.array(seedSaleSchema).optional(),
  livestockSales: z.array(livestockSaleSchema).optional(),
  commodityStocks: z.array(commodityStockSchema).optional(),
});

export type CommercialDashboard = z.infer<typeof commercialDashboardSchema>;

// Schema para análise de preços históricos
export const historicalPriceAnalysisSchema = z.object({
  commodity: commodityTypeEnum,
  startDate: z.date(),
  endDate: z.date(),
  interval: z.enum(["daily", "weekly", "monthly", "yearly"]),
  currency: currencyTypeEnum,
  includeStats: z.boolean().default(true),
});

export type HistoricalPriceAnalysis = z.infer<typeof historicalPriceAnalysisSchema>;

// Schema para comparação de preços
export const priceComparisonSchema = z.object({
  commodities: z.array(commodityTypeEnum),
  startDate: z.date(),
  endDate: z.date(),
  normalizeValues: z.boolean().default(true),
  currency: currencyTypeEnum,
});

export type PriceComparison = z.infer<typeof priceComparisonSchema>;

// Schema para dados de sazonalidade
export const seasonalityDataSchema = z.object({
  commodity: commodityTypeEnum,
  years: z.number().int().positive(),
  monthlyAverage: z.boolean().default(true),
});

export type SeasonalityData = z.infer<typeof seasonalityDataSchema>;

// Schema para alerta de preços
export const priceAlertSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  commodity: commodityTypeEnum,
  price_threshold: z.number().positive(),
  condition: z.enum(["greater_than", "less_than"]),
  active: z.boolean().default(true),
  currency: currencyTypeEnum,
  email_notification: z.boolean().default(true),
  sms_notification: z.boolean().default(false),
  system_notification: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const priceAlertFormSchema = priceAlertSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type PriceAlert = z.infer<typeof priceAlertSchema>;
export type PriceAlertFormValues = z.infer<typeof priceAlertFormSchema>;

// Exportações consolidadas
export * from './actions';
export * from './seeds';