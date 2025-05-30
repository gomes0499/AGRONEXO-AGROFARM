import { z } from "zod";

// Schema para valores por safra
export const safraValuesSchema = z.record(z.string(), z.number());
export type SafraValuesType = z.infer<typeof safraValuesSchema>;

// Enum para categorias de caixa e disponibilidades
export const caixaDisponibilidadesCategoriaEnum = z.enum([
  "CAIXA_BANCOS",         // Caixa, bancos e aplicações
  "CLIENTES",             // Valores a receber de clientes
  "ADIANTAMENTOS",        // Adiantamentos a fornecedores
  "EMPRESTIMOS",          // Empréstimos a terceiros
  "ESTOQUE_DEFENSIVOS",   // Estoques de defensivos
  "ESTOQUE_FERTILIZANTES", // Estoques de fertilizantes
  "ESTOQUE_ALMOXARIFADO", // Estoques de almoxarifado
  "ESTOQUE_COMMODITIES",  // Estoques de commodities
  "SEMOVENTES",           // Rebanho (semoventes)
  "ATIVO_BIOLOGICO"       // Ativo biológico (culturas permanentes)
]);
export type CaixaDisponibilidadesCategoriaType = z.infer<typeof caixaDisponibilidadesCategoriaEnum>;

// Schema para Caixa e Disponibilidades
export const caixaDisponibilidadesSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  safra_id: z.string().uuid(),
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: caixaDisponibilidadesCategoriaEnum,
  valores_por_safra: safraValuesSchema.or(z.string()).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type CaixaDisponibilidades = z.infer<typeof caixaDisponibilidadesSchema>;

// Schema para formulário de Caixa e Disponibilidades
export const caixaDisponibilidadesFormSchema = caixaDisponibilidadesSchema.omit({ 
  id: true, 
  organizacao_id: true,
  created_at: true,
  updated_at: true 
});

export type CaixaDisponibilidadesFormValues = z.infer<typeof caixaDisponibilidadesFormSchema>;

// Schema para listagem de Caixa e Disponibilidades (dados simplificados para tabelas)
export const caixaDisponibilidadesListItemSchema = caixaDisponibilidadesSchema.pick({
  id: true,
  nome: true,
  categoria: true,
  valores_por_safra: true,
});

export type CaixaDisponibilidadesListItem = z.infer<typeof caixaDisponibilidadesListItemSchema>;