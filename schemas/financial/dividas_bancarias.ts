import * as z from "zod";

// Let's define a categoryEnum here for now
const categoriaDividaBancariaEnum = z.enum(["CUSTEIO", "INVESTIMENTO", "OUTROS"]);
const moedaEnum = z.enum(["BRL", "USD"]);
const tipoDividaBancariaEnum = z.enum(["BANCO", "TRADING", "OUTROS"]);
const indexadorEnum = z.enum(["CDI", "SELIC", "IPCA", "PRE_FIXADO", "DOLAR"]);

export const dividasBancariasSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid().optional(),
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: categoriaDividaBancariaEnum,
  tipo: tipoDividaBancariaEnum.default("BANCO"),
  indexador: indexadorEnum.default("CDI"),
  taxa_real: z.number().min(0).default(6.5),
  valores_por_safra: z.record(z.string(), z.number().nonnegative()).optional(),
  moeda: moedaEnum.default("BRL"),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type DividasBancarias = z.infer<typeof dividasBancariasSchema>;

export const dividasBancariasFormSchema = dividasBancariasSchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true,
});

export type DividasBancariasFormValues = z.infer<typeof dividasBancariasFormSchema>;

export const dividasBancariasListItemSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  categoria: categoriaDividaBancariaEnum,
  tipo: tipoDividaBancariaEnum.default("BANCO"),
  indexador: indexadorEnum.default("CDI"),
  taxa_real: z.number().min(0).default(6.5),
  valores_por_safra: z.record(z.string(), z.number().nonnegative()).optional(),
  moeda: moedaEnum.default("BRL"),
  total: z.number().optional(),
});

export type DividasBancariasListItem = z.infer<typeof dividasBancariasListItemSchema>;