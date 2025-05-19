import { z } from "zod";

// Enum for commodity types
export const CommodityType = z.enum([
  "SOJA_SEQUEIRO",
  "SOJA_IRRIGADO",
  "MILHO_SAFRINHA",
  "ALGODAO_CAPULHO",
  "ARROZ_IRRIGADO",
  "SORGO",
  "FEIJAO",
  "DOLAR_ALGODAO",
  "DOLAR_SOJA",
  "DOLAR_FECHAMENTO"
]);

export type CommodityTypeEnum = z.infer<typeof CommodityType>;

// Mapping for display names
export const commodityDisplayNames: Record<CommodityTypeEnum, string> = {
  SOJA_SEQUEIRO: "Soja Sequeiro",
  SOJA_IRRIGADO: "Soja Irrigado",
  MILHO_SAFRINHA: "Milho Safrinha",
  ALGODAO_CAPULHO: "Algodão (capulho)",
  ARROZ_IRRIGADO: "Arroz Irrigado",
  SORGO: "Sorgo",
  FEIJAO: "Feijão (sem tipo)",
  DOLAR_ALGODAO: "Dólar Algodão - 30/09",
  DOLAR_SOJA: "Dólar Soja - 31/05",
  DOLAR_FECHAMENTO: "Dólar Fechamento - 31/12"
};

// Mapping for units
export const commodityUnits: Record<CommodityTypeEnum, string> = {
  SOJA_SEQUEIRO: "R$/Saca",
  SOJA_IRRIGADO: "R$/Saca",
  MILHO_SAFRINHA: "R$/Saca",
  ALGODAO_CAPULHO: "R$/@",
  ARROZ_IRRIGADO: "R$/Saca",
  SORGO: "R$/Saca",
  FEIJAO: "R$/Saca",
  DOLAR_ALGODAO: "R$",
  DOLAR_SOJA: "R$",
  DOLAR_FECHAMENTO: "R$"
};

// Types for commodity prices
export type CommodityPriceType = {
  id: string;
  organizacaoId: string;
  commodityType: CommodityTypeEnum;
  unit: string;
  currentPrice: number;
  price2025: number;
  price2026: number;
  price2027: number;
  price2028: number;
  price2029: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CommodityPriceCreateType = Omit<CommodityPriceType, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

export type CommodityPriceUpdateType = Partial<CommodityPriceCreateType> & {
  id: string;
};

// Base schema for commodity prices
const commodityPriceBaseSchema = z.object({
  organizacaoId: z.string().uuid({ message: "ID da organização inválido" }),
  commodityType: CommodityType,
  unit: z.string().min(1, { message: "Unidade é obrigatória" }),
  currentPrice: z.number().nonnegative({ message: "Preço deve ser positivo ou zero" }),
  price2025: z.number().nonnegative({ message: "Preço deve ser positivo ou zero" }),
  price2026: z.number().nonnegative({ message: "Preço deve ser positivo ou zero" }),
  price2027: z.number().nonnegative({ message: "Preço deve ser positivo ou zero" }),
  price2028: z.number().nonnegative({ message: "Preço deve ser positivo ou zero" }),
  price2029: z.number().nonnegative({ message: "Preço deve ser positivo ou zero" }),
});

// Schema for creating a new commodity price record
export const commodityPriceCreateSchema = commodityPriceBaseSchema.extend({
  id: z.string().uuid({ message: "ID inválido" }).optional(),
});

// Schema for updating an existing commodity price record
export const commodityPriceUpdateSchema = commodityPriceBaseSchema
  .partial()
  .extend({
    id: z.string().uuid({ message: "ID inválido" }),
  });

// Schema for retrieving a commodity price record
export const commodityPriceSchema = commodityPriceBaseSchema.extend({
  id: z.string().uuid({ message: "ID inválido" }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Default values for commodity prices
export const defaultCommodityPrices: Record<CommodityTypeEnum, CommodityPriceCreateType> = {
  SOJA_SEQUEIRO: {
    organizacaoId: "",
    commodityType: "SOJA_SEQUEIRO",
    unit: "R$/Saca",
    currentPrice: 125,
    price2025: 125,
    price2026: 125,
    price2027: 125,
    price2028: 125,
    price2029: 125
  },
  SOJA_IRRIGADO: {
    organizacaoId: "",
    commodityType: "SOJA_IRRIGADO",
    unit: "R$/Saca",
    currentPrice: 130,
    price2025: 130,
    price2026: 130,
    price2027: 130,
    price2028: 130,
    price2029: 130
  },
  MILHO_SAFRINHA: {
    organizacaoId: "",
    commodityType: "MILHO_SAFRINHA",
    unit: "R$/Saca",
    currentPrice: 60,
    price2025: 60,
    price2026: 60,
    price2027: 60,
    price2028: 60,
    price2029: 60
  },
  ALGODAO_CAPULHO: {
    organizacaoId: "",
    commodityType: "ALGODAO_CAPULHO",
    unit: "R$/@",
    currentPrice: 132,
    price2025: 132,
    price2026: 132,
    price2027: 132,
    price2028: 132,
    price2029: 132
  },
  ARROZ_IRRIGADO: {
    organizacaoId: "",
    commodityType: "ARROZ_IRRIGADO",
    unit: "R$/Saca",
    currentPrice: 125,
    price2025: 125,
    price2026: 125,
    price2027: 125,
    price2028: 125,
    price2029: 125
  },
  SORGO: {
    organizacaoId: "",
    commodityType: "SORGO",
    unit: "R$/Saca",
    currentPrice: 50,
    price2025: 50,
    price2026: 50,
    price2027: 50,
    price2028: 50,
    price2029: 50
  },
  FEIJAO: {
    organizacaoId: "",
    commodityType: "FEIJAO",
    unit: "R$/Saca",
    currentPrice: 170,
    price2025: 170,
    price2026: 170,
    price2027: 170,
    price2028: 170,
    price2029: 170
  },
  DOLAR_ALGODAO: {
    organizacaoId: "",
    commodityType: "DOLAR_ALGODAO",
    unit: "R$",
    currentPrice: 5.4481,
    price2025: 5.4481,
    price2026: 5.4481,
    price2027: 5.4481,
    price2028: 5.4481,
    price2029: 5.4481
  },
  DOLAR_SOJA: {
    organizacaoId: "",
    commodityType: "DOLAR_SOJA",
    unit: "R$",
    currentPrice: 5.1972,
    price2025: 5.1972,
    price2026: 5.1972,
    price2027: 5.1972,
    price2028: 5.1972,
    price2029: 5.1972
  },
  DOLAR_FECHAMENTO: {
    organizacaoId: "",
    commodityType: "DOLAR_FECHAMENTO",
    unit: "R$",
    currentPrice: 5.7000,
    price2025: 5.7000,
    price2026: 5.7000,
    price2027: 5.7000,
    price2028: 5.7000,
    price2029: 5.7000
  }
};

// Forms schema for commodity prices
export const commodityPriceFormSchema = commodityPriceBaseSchema.omit({
  organizacaoId: true,
});