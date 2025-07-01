import { z } from "zod";

// Schema para preços de commodities
export const priceSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  safra_id: z.string().uuid(),
  dolar_algodao: z.number().min(0, "Valor deve ser maior ou igual a 0").nullable().optional(),
  dolar_milho: z.number().min(0, "Valor deve ser maior ou igual a 0").nullable().optional(),
  dolar_soja: z.number().min(0, "Valor deve ser maior ou igual a 0").nullable().optional(),
  dolar_fechamento: z.number().min(0, "Valor deve ser maior ou igual a 0").nullable().optional(),
  preco_algodao: z.number().min(0, "Valor deve ser maior ou igual a 0").nullable().optional(), // USD/lb
  preco_caroco_algodao: z.number().min(0, "Valor deve ser maior ou igual a 0").nullable().optional(), // R$/ton
  preco_unitario_caroco_algodao: z.number().min(0, "Valor deve ser maior ou igual a 0").nullable().optional(), // R$/@
  preco_algodao_bruto: z.number().min(0, "Valor deve ser maior ou igual a 0").nullable().optional(), // R$/@
  preco_milho: z.number().min(0, "Valor deve ser maior ou igual a 0").nullable().optional(), // R$/saca
  preco_soja_usd: z.number().min(0, "Valor deve ser maior ou igual a 0").nullable().optional(), // U$/saca
  preco_soja_brl: z.number().min(0, "Valor deve ser maior ou igual a 0").nullable().optional(), // R$/saca
  outros_precos: z.record(z.string(), z.number().min(0, "Valor deve ser maior ou igual a 0")).nullable().optional(), // preços de outras culturas
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