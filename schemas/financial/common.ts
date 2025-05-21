import { z } from "zod";

// Enums para o módulo financeiro
export const debtModalityEnum = z.enum(["CUSTEIO", "INVESTIMENTOS"]);
export type DebtModalityType = z.infer<typeof debtModalityEnum>;

export const currencyEnum = z.enum(["BRL", "USD", "EUR", "SOJA"]);
export type CurrencyType = z.infer<typeof currencyEnum>;

export const liquidityFactorEnum = z.enum(["CAIXA", "BANCO", "INVESTIMENTO"]);
export type LiquidityFactorType = z.infer<typeof liquidityFactorEnum>;

export const inventoryTypeEnum = z.enum([
  "FERTILIZANTES", 
  "DEFENSIVOS", 
  "ALMOXARIFADO",
  "OUTROS"
]);
export type InventoryType = z.infer<typeof inventoryTypeEnum>;

export const commodityTypeEnum = z.enum([
  "SOJA", 
  "ALGODAO", 
  "MILHO",
  "MILHETO",
  "SORGO",
  "FEIJAO_GURUTUBA",
  "FEIJAO_CARIOCA",
  "MAMONA",
  "SEM_PASTAGEM",
  "CAFE",
  "TRIGO",
  "PECUARIA",
  "OUTROS"
]);
export type CommodityType = z.infer<typeof commodityTypeEnum>;

// Helpers para validação de JSON
export const annualFlowSchema = z.record(z.string(), z.number());
export type AnnualFlowType = z.infer<typeof annualFlowSchema>;