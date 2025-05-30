import { z } from "zod";
import { inventoryTypeEnum, commodityTypeEnum } from "./common";

// Schema para valores por safra
export const safraValuesSchema = z.record(z.string(), z.number());
export type SafraValuesType = z.infer<typeof safraValuesSchema>;

// Schema para Estoques
export const inventorySchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  tipo: inventoryTypeEnum,
  valor: z.coerce.number().min(0, "Valor deve ser positivo").optional(),
  valores_por_safra: safraValuesSchema.or(z.string()).optional(),
  safra_id: z.string().uuid().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Inventory = z.infer<typeof inventorySchema>;

// Schema para formulário de estoques
export const inventoryFormSchema = inventorySchema.omit({ 
  id: true, 
  organizacao_id: true,
  created_at: true,
  updated_at: true 
});

export type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

// Schema para listagem de estoques (dados simplificados para tabelas)
export const inventoryListItemSchema = inventorySchema.pick({
  id: true,
  tipo: true,
  valor: true,
});

export type InventoryListItem = z.infer<typeof inventoryListItemSchema>;

// Schema para Estoques de Commodities
export const commodityInventorySchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  commodity: commodityTypeEnum,
  valor_total: z.coerce.number().min(0, "Valor total deve ser positivo").optional(),
  valores_por_safra: safraValuesSchema.or(z.string()).optional(),
  safra_id: z.string().uuid().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type CommodityInventory = z.infer<typeof commodityInventorySchema>;

// Schema para formulário de estoques de commodities
export const commodityInventoryFormSchema = commodityInventorySchema.omit({ 
  id: true, 
  organizacao_id: true,
  created_at: true,
  updated_at: true 
});

export type CommodityInventoryFormValues = z.infer<typeof commodityInventoryFormSchema>;

// Schema para listagem de estoques de commodities (dados simplificados para tabelas)
export const commodityInventoryListItemSchema = commodityInventorySchema.pick({
  id: true,
  commodity: true,
  valor_total: true,
});

export type CommodityInventoryListItem = z.infer<typeof commodityInventoryListItemSchema>;