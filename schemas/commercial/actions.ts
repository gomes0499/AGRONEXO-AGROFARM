import { z } from "zod";
import {
  priceSchema,
  seedSaleSchema,
  livestockSaleSchema,
  commodityStockSchema,
  priceAlertSchema,
} from "./index";

// Schema para ações de preços
export const getPricesSchema = z.object({
  organizacao_id: z.string().uuid(),
  safra_id: z.string().uuid().optional(),
  data_inicio: z.date().optional(),
  data_fim: z.date().optional(),
});

export const getPriceByIdSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
});

export const createPriceSchema = priceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updatePriceSchema = z.object({
  id: z.string().uuid(),
  data: priceSchema
    .omit({
      id: true,
      organizacao_id: true,
      created_at: true,
      updated_at: true,
    })
    .partial(),
});

export const deletePriceSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
});

// Schema para ações de vendas de sementes
export const getSeedSalesSchema = z.object({
  organizacao_id: z.string().uuid(),
  cultura_id: z.string().uuid().optional(),
  ano: z.number().int().positive().optional(),
});

export const getSeedSaleByIdSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
});

export const createSeedSaleSchema = seedSaleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updateSeedSaleSchema = z.object({
  id: z.string().uuid(),
  data: seedSaleSchema
    .omit({
      id: true,
      organizacao_id: true,
      created_at: true,
      updated_at: true,
    })
    .partial(),
});

export const deleteSeedSaleSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
});

// Schema para ações de vendas pecuárias
export const getLivestockSalesSchema = z.object({
  organizacao_id: z.string().uuid(),
  ano: z.number().int().positive().optional(),
});

export const getLivestockSaleByIdSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
});

export const createLivestockSaleSchema = livestockSaleSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updateLivestockSaleSchema = z.object({
  id: z.string().uuid(),
  data: livestockSaleSchema
    .omit({
      id: true,
      organizacao_id: true,
      created_at: true,
      updated_at: true,
    })
    .partial(),
});

export const deleteLivestockSaleSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
});

// Schema para ações de estoque de commodities
export const getCommodityStocksSchema = z.object({
  organizacao_id: z.string().uuid(),
  commodity: z.enum([
    "SOJA",
    "ALGODAO",
    "MILHO",
    "ARROZ",
    "SORGO",
    "CAFE",
    "CACAU",
    "SOJA_CANA",
    "OUTROS",
  ]).optional(),
  data_referencia: z.date().optional(),
});

export const getCommodityStockByIdSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
});

export const createCommodityStockSchema = commodityStockSchema.omit({
  id: true,
  valor_total: true,
  created_at: true,
  updated_at: true,
});

export const updateCommodityStockSchema = z.object({
  id: z.string().uuid(),
  data: commodityStockSchema
    .omit({
      id: true,
      organizacao_id: true,
      valor_total: true,
      created_at: true,
      updated_at: true,
    })
    .partial(),
});

export const deleteCommodityStockSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
});

// Schema para ações de alertas de preços
export const getPriceAlertsSchema = z.object({
  organizacao_id: z.string().uuid(),
  active: z.boolean().optional(),
  commodity: z.enum([
    "SOJA",
    "ALGODAO",
    "MILHO",
    "ARROZ",
    "SORGO",
    "CAFE",
    "CACAU",
    "SOJA_CANA",
    "OUTROS",
  ]).optional(),
});

export const getPriceAlertByIdSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
});

export const createPriceAlertSchema = priceAlertSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const updatePriceAlertSchema = z.object({
  id: z.string().uuid(),
  data: priceAlertSchema
    .omit({
      id: true,
      organizacao_id: true,
      created_at: true,
      updated_at: true,
    })
    .partial(),
});

export const deletePriceAlertSchema = z.object({
  id: z.string().uuid(),
  organizacao_id: z.string().uuid(),
});

// Schema para análises históricas
export const getHistoricalPriceDataSchema = z.object({
  organizacao_id: z.string().uuid(),
  commodity: z.enum([
    "SOJA",
    "ALGODAO",
    "MILHO",
    "ARROZ",
    "SORGO",
    "CAFE",
    "CACAU",
    "SOJA_CANA",
    "OUTROS",
  ]),
  startDate: z.date(),
  endDate: z.date(),
  currency: z.enum(["BRL", "USD"]),
});

export const getPriceComparisonDataSchema = z.object({
  organizacao_id: z.string().uuid(),
  commodities: z.array(
    z.enum([
      "SOJA",
      "ALGODAO",
      "MILHO",
      "ARROZ",
      "SORGO",
      "CAFE",
      "CACAU",
      "SOJA_CANA",
      "OUTROS",
    ])
  ),
  startDate: z.date(),
  endDate: z.date(),
  currency: z.enum(["BRL", "USD"]),
});

export const getSeasonalityDataSchema = z.object({
  organizacao_id: z.string().uuid(),
  commodity: z.enum([
    "SOJA",
    "ALGODAO",
    "MILHO",
    "ARROZ",
    "SORGO",
    "CAFE",
    "CACAU",
    "SOJA_CANA",
    "OUTROS",
  ]),
  years: z.number().int().positive(),
});