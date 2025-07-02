import { z } from "zod";

// Enums para o módulo patrimonial
export const assetCategoryEnum = z.enum([
  "EQUIPAMENTO", 
  "TRATOR_COLHEITADEIRA_PULVERIZADOR", 
  "AERONAVE", 
  "VEICULO", 
  "BENFEITORIA", 
  "INVESTIMENTO_SOLO",
  "MAQUINARIO_AGRICOLA",
  "INFRAESTRUTURA",
  "TECNOLOGIA",
  "OUTROS"
]);
export type AssetCategoryType = z.infer<typeof assetCategoryEnum>;

// Enum para tipos de patrimônio
export const patrimonioTipoEnum = z.enum(["REALIZADO", "PLANEJADO"]);
export type PatrimonioTipoType = z.infer<typeof patrimonioTipoEnum>;

// Helper para validação de anos
export const yearSchema = z.coerce.number().int().min(1900).max(2100);
export type YearType = z.infer<typeof yearSchema>;

// Helper para valores monetários
export const monetaryValueSchema = z.coerce.number().min(0, "O valor deve ser positivo");
export type MonetaryValueType = z.infer<typeof monetaryValueSchema>;

// Helper para quantidade
export const quantitySchema = z.coerce.number().int().min(1, "A quantidade deve ser pelo menos 1");
export type QuantityType = z.infer<typeof quantitySchema>;

// Helper para hectares
export const hectaresSchema = z.coerce.number().positive("A área deve ser positiva");
export type HectaresType = z.infer<typeof hectaresSchema>;

// Helper para sacas
export const sacasSchema = z.coerce.number().positive("O valor em sacas deve ser positivo");
export type SacasType = z.infer<typeof sacasSchema>;