import { z } from "zod";

// Schema para adiantamentos_fornecedores baseado na estrutura atual do banco
export const supplierAdvanceSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  fornecedor_id: z.string().uuid().optional(),
  valor: z.coerce.number().positive("Valor deve ser positivo"),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  
  // Campo para a relação com fornecedor
  fornecedor: z.object({
    id: z.string().uuid(),
    nome: z.string()
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
