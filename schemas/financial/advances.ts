import { z } from "zod";

// Schema para adiantamentos_fornecedores baseado na estrutura atual do banco
export const supplierAdvanceSchema = z.object({
  id: z.string().uuid("ID inválido").optional(),
  organizacao_id: z.string().uuid("Organização inválida"),
  fornecedor_id: z.string().uuid("Selecione um fornecedor válido").optional().refine(val => val !== "", {
    message: "Selecione um fornecedor"
  }),
  valor: z.coerce.number().positive("Valor deve ser positivo").refine(val => !isNaN(val), {
    message: "Insira um valor numérico válido"
  }),
  safra_id: z.string().uuid("Selecione uma safra válida").optional(),
  valores_por_safra: z.union([
    z.record(z.string(), z.number()),
    z.string(),
  ]).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  
  // Campo para a relação com fornecedor
  fornecedor: z.object({
    id: z.string().uuid("ID do fornecedor inválido"),
    nome: z.string().min(1, "Nome do fornecedor é obrigatório")
  }).optional(),
});

export type SupplierAdvance = z.infer<typeof supplierAdvanceSchema>;

export const supplierAdvanceFormSchema = supplierAdvanceSchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true,
  fornecedor: true, // relação, não um campo de formulário
});

export type SupplierAdvanceForm = z.infer<typeof supplierAdvanceFormSchema>;

export const supplierAdvanceListItemSchema = supplierAdvanceSchema.pick({
  id: true,
  valor: true,
  fornecedor_id: true,
  fornecedor: true,
});

export type SupplierAdvanceListItem = z.infer<typeof supplierAdvanceListItemSchema>;
