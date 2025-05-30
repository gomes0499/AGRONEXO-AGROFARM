import { z } from "zod";
import { liquidityFactorEnum } from "./common";

// Schema para valores por safra
export const safraValuesSchema = z.record(z.string(), z.number());
export type SafraValuesType = z.infer<typeof safraValuesSchema>;

// Schema para Fatores de Liquidez
export const liquidityFactorSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  tipo: liquidityFactorEnum,
  valor: z.coerce.number().min(0, "Valor deve ser positivo").optional(), // Manter compatibilidade
  valores_por_safra: safraValuesSchema.or(z.string()).optional(),
  banco: z.string().optional(),
  safra_id: z.string().uuid().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type LiquidityFactor = z.infer<typeof liquidityFactorSchema>;

// Schema para formulário de fatores de liquidez
export const liquidityFactorFormSchema = liquidityFactorSchema.omit({ 
  id: true, 
  organizacao_id: true,
  created_at: true,
  updated_at: true 
});

export type LiquidityFactorFormValues = z.infer<typeof liquidityFactorFormSchema>;

// Schema para listagem de fatores de liquidez (dados simplificados para tabelas)
export const liquidityFactorListItemSchema = liquidityFactorSchema.pick({
  id: true,
  tipo: true,
  valor: true,
  banco: true,
});

export type LiquidityFactorListItem = z.infer<typeof liquidityFactorListItemSchema>;