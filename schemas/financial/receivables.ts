import { z } from "zod";
import { commodityTypeEnum } from "./common";

export const receivableContractSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  commodity: commodityTypeEnum, // Campo obrigatório
  valor: z.coerce.number().positive("Valor deve ser positivo"),
  safra_id: z.string().uuid().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type ReceivableContract = z.infer<typeof receivableContractSchema>;

export const receivableContractFormSchema = receivableContractSchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true,
});

export type ReceivableContractForm = z.infer<typeof receivableContractFormSchema>;

export const receivableContractListItemSchema = receivableContractSchema.pick({
  id: true,
  commodity: true,
  valor: true,
});

export type ReceivableContractListItem = z.infer<typeof receivableContractListItemSchema>;
