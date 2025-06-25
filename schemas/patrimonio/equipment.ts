import { z } from "zod";
import { yearSchema, monetaryValueSchema } from "./common";

// Schema para Máquinas e Equipamentos
export const equipmentSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  equipamento: z.string().min(1, "Equipamento é obrigatório"),
  equipamento_outro: z.string().optional(),
  ano_fabricacao: yearSchema,
  marca: z.string().min(1, "Marca é obrigatória"),
  marca_outro: z.string().optional(),
  modelo: z.string().optional(),
  quantidade: z.number().int().min(1, "Quantidade deve ser pelo menos 1").default(1),
  valor_unitario: monetaryValueSchema,
  valor_total: monetaryValueSchema.optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type Equipment = z.infer<typeof equipmentSchema>;

// Schema para formulário de máquinas e equipamentos
export const equipmentFormSchema = z.object({
  equipamento: z.string().min(1, "Equipamento é obrigatório"),
  equipamento_outro: z.string().optional(),
  ano_fabricacao: yearSchema,
  marca: z.string().min(1, "Marca é obrigatória"),
  marca_outro: z.string().optional(),
  modelo: z.string().optional(),
  quantidade: z.number().int().min(1, "Quantidade deve ser pelo menos 1"),
  valor_unitario: monetaryValueSchema,
}).refine((data) => {
  // Se equipamento for "OUTROS", equipamento_outro deve ser preenchido
  if (data.equipamento === "OUTROS" && !data.equipamento_outro?.trim()) {
    return false;
  }
  // Se marca for "OUTROS", marca_outro deve ser preenchido
  if (data.marca === "OUTROS" && !data.marca_outro?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Campo 'Outro' deve ser preenchido quando selecionado",
  path: ["equipamento_outro"]
});

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

// Schema para listagem de máquinas e equipamentos
export const equipmentListItemSchema = equipmentSchema.pick({
  id: true,
  equipamento: true,
  ano_fabricacao: true,
  marca: true,
  modelo: true,
  quantidade: true,
  valor_unitario: true,
  valor_total: true,
});

export type EquipmentListItem = z.infer<typeof equipmentListItemSchema>;