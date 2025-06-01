import { z } from "zod";
import { inventoryTypeEnum, commodityTypeEnum } from "./common";

// Schema para valores por safra
export const safraValuesSchema = z.record(z.string(), z.number().refine(val => !isNaN(val), {
  message: "Insira um valor numérico válido"
}));
export type SafraValuesType = z.infer<typeof safraValuesSchema>;

// Schema para Estoques
export const inventorySchema = z.object({
  id: z.string().uuid("ID inválido").optional(),
  organizacao_id: z.string().uuid("Organização inválida"),
  tipo: inventoryTypeEnum.refine(val => !!val, {
    message: "Selecione um tipo de estoque"
  }),
  valor: z.coerce.number().min(0, "Valor deve ser positivo ou zero").optional().refine(val => val === undefined || !isNaN(val), {
    message: "Insira um valor numérico válido"
  }),
  valores_por_safra: safraValuesSchema.or(z.string()).optional(),
  safra_id: z.string().uuid("Selecione uma safra válida").optional(),
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
  id: z.string().uuid("ID inválido").optional(),
  organizacao_id: z.string().uuid("Organização inválida"),
  commodity: commodityTypeEnum.refine(val => !!val, {
    message: "Selecione uma commodity"
  }),
  valor_total: z.coerce.number().min(0, "Valor total deve ser positivo ou zero").optional().refine(val => val === undefined || !isNaN(val), {
    message: "Insira um valor numérico válido"
  }),
  valores_por_safra: safraValuesSchema.or(z.string()).optional(),
  safra_id: z.string().uuid("Selecione uma safra válida").optional(),
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