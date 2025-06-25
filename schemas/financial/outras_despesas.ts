import * as z from "zod";

// Enum com todas as categorias permitidas pelo banco de dados
export const outrasDespesasCategoriaEnum = z.enum([
  "TRIBUTARIAS",           // Impostos e taxas
  "PRO_LABORE",           // Remuneração dos sócios
  "OUTRAS_OPERACIONAIS",  // Outras despesas operacionais
  "DESPESAS_ADMINISTRATIVAS", // Despesas administrativas gerais
  "DESPESAS_COMERCIAIS",  // Despesas com vendas e marketing
  "DESPESAS_FINANCEIRAS", // Juros e encargos financeiros
  "MANUTENCAO",          // Manutenção de equipamentos e instalações
  "SEGUROS",             // Seguros diversos
  "CONSULTORIAS",        // Serviços de consultoria
  "DEPRECIACAO",         // Depreciação de ativos
  "AMORTIZACAO",         // Amortização de intangíveis
  "ARRENDAMENTOS",       // Despesas com arrendamentos
  "PESSOAL",             // Salários e encargos
  "ENERGIA_COMBUSTIVEL", // Energia elétrica e combustíveis
  "COMUNICACAO",         // Telefone, internet, etc
  "VIAGENS",             // Despesas com viagens
  "MATERIAL_ESCRITORIO", // Material de expediente
  "OUTROS"               // Outras despesas não classificadas
]);

export type OutrasDespesasCategoriaType = z.infer<typeof outrasDespesasCategoriaEnum>;

export const outrasDespesasSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid().optional(),
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: outrasDespesasCategoriaEnum,
  moeda: z.enum(["BRL", "USD"]).default("BRL"),
  valores_por_safra: z.record(z.string(), z.number().nonnegative()).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type OutrasDespesas = z.infer<typeof outrasDespesasSchema>;

export const outrasDespesasFormSchema = outrasDespesasSchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true,
});

export type OutrasDespesasFormValues = z.infer<typeof outrasDespesasFormSchema>;

export const outrasDespesasListItemSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  categoria: outrasDespesasCategoriaEnum,
  moeda: z.enum(["BRL", "USD"]).default("BRL"),
  valores_por_safra: z.record(z.string(), z.number().nonnegative()).optional(),
  total: z.number().optional(),
});

export type OutrasDespesasListItem = z.infer<typeof outrasDespesasListItemSchema>;