import { z } from "zod";
import { currencyEnum } from ".";

export const thirdPartyLoanSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  beneficiario: z.string().min(1, "Nome do beneficiário é obrigatório"), 
  valor: z.coerce.number().positive("Valor deve ser positivo"),
  safra_id: z.string().uuid().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type ThirdPartyLoan = z.infer<typeof thirdPartyLoanSchema>;

export const thirdPartyLoanFormSchema = thirdPartyLoanSchema.pick({
  valor: true,
  beneficiario: true,
});

export type ThirdPartyLoanForm = z.infer<typeof thirdPartyLoanFormSchema>;

export const thirdPartyLoanListItemSchema = thirdPartyLoanSchema.pick({
  id: true,
  valor: true,
  beneficiario: true,
});

export type ThirdPartyLoanListItem = z.infer<typeof thirdPartyLoanListItemSchema>;
