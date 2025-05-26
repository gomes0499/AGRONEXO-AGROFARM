import { z } from "zod";

// Schema baseado na tabela real aquisicao_terras
export const landAcquisitionSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  nome_fazenda: z.string().min(1, "Nome da fazenda é obrigatório"),
  ano: z.coerce.number().min(2000, "Ano deve ser maior que 2000").max(2050, "Ano deve ser menor que 2050"),
  hectares: z.coerce.number().min(0, "Hectares deve ser maior ou igual a 0"),
  sacas: z.coerce.number().min(0, "Sacas deve ser maior ou igual a 0"),
  total_sacas: z.coerce.number().optional(), // Calculado automaticamente
  valor_total: z.coerce.number().min(0, "Valor total deve ser maior ou igual a 0"),
  tipo: z.enum(["REALIZADO", "PLANEJADO"]).default("PLANEJADO"),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type LandAcquisition = z.infer<typeof landAcquisitionSchema>;

// Schema para formulário (sem campos automáticos)
export const landAcquisitionFormSchema = z.object({
  nome_fazenda: z.string().min(1, "Nome da fazenda é obrigatório"),
  ano: z.coerce.number().min(2000, "Ano deve ser maior que 2000").max(2050, "Ano deve ser menor que 2050"),
  hectares: z.coerce.number().min(0, "Hectares deve ser maior ou igual a 0"),
  sacas: z.coerce.number().min(0, "Sacas deve ser maior ou igual a 0"),
  valor_total: z.coerce.number().min(0, "Valor total deve ser maior ou igual a 0"),
  tipo: z.enum(["REALIZADO", "PLANEJADO"]),
});

export type LandAcquisitionFormValues = z.infer<typeof landAcquisitionFormSchema>;