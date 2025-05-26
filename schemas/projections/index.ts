import { z } from "zod";

// ==========================================
// SCHEMAS SIMPLIFICADOS PARA PROJEÇÕES
// ==========================================

// Enums
export const safraFormatoEnum = z.enum(['SAFRA_COMPLETA', 'ANO_CIVIL']);
export const projecaoStatusEnum = z.enum(['ATIVA', 'INATIVA', 'ARQUIVADA']);
export const projecaoDividaCategoriaEnum = z.enum([
  'BANCOS',
  'ADIANTAMENTO_CLIENTES', 
  'TERRAS',
  'ARRENDAMENTO',
  'FORNECEDORES',
  'TRADINGS',
  'OUTROS'
]);

// Schema para configuração de projeção
export const projecaoConfigSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  nome: z.string().min(1, "Nome da projeção é obrigatório"),
  descricao: z.string().optional(),
  periodo_inicio: z.coerce.number().min(2020).max(2050),
  periodo_fim: z.coerce.number().min(2020).max(2050),
  formato_safra: safraFormatoEnum,
  status: projecaoStatusEnum.default('ATIVA'),
  eh_padrao: z.boolean().default(false),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type ProjecaoConfig = z.infer<typeof projecaoConfigSchema>;

// Schema para formulário de configuração
export const projecaoConfigFormSchema = projecaoConfigSchema.omit({
  id: true,
  organizacao_id: true,
  created_at: true,
  updated_at: true,
});

export type ProjecaoConfigFormValues = z.infer<typeof projecaoConfigFormSchema>;

// Schema para projeção de cultura
export const projecaoCulturaSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  projecao_config_id: z.string().uuid(),
  cultura_id: z.string().uuid(),
  sistema_id: z.string().uuid(),
  ciclo_id: z.string().uuid(),
  safra_id: z.string().uuid(),
  periodo: z.string(),
  area_plantada: z.coerce.number().min(0),
  produtividade: z.coerce.number().min(0),
  unidade_produtividade: z.string(),
  preco_unitario: z.coerce.number().min(0),
  unidade_preco: z.string(),
  custo_por_hectare: z.coerce.number().min(0),
  observacoes: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type ProjecaoCultura = z.infer<typeof projecaoCulturaSchema>;

export const projecaoCulturaFormSchema = projecaoCulturaSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type ProjecaoCulturaFormValues = z.infer<typeof projecaoCulturaFormSchema>;

// Schema para projeção de dívida
export const projecaoDividaSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  projecao_config_id: z.string().uuid(),
  categoria: projecaoDividaCategoriaEnum,
  periodo: z.string(),
  valor: z.coerce.number(),
  observacoes: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type ProjecaoDivida = z.infer<typeof projecaoDividaSchema>;

export const projecaoDividaFormSchema = projecaoDividaSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type ProjecaoDividaFormValues = z.infer<typeof projecaoDividaFormSchema>;

// Schema para fluxo de caixa
export const projecaoFluxoCaixaSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  projecao_config_id: z.string().uuid(),
  periodo: z.string(),
  receitas_agricolas: z.coerce.number(),
  despesas_agricolas: z.coerce.number(),
  outras_despesas: z.coerce.number(),
  total_investimentos: z.coerce.number(),
  total_financeiras: z.coerce.number(),
  observacoes: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type ProjecaoFluxoCaixa = z.infer<typeof projecaoFluxoCaixaSchema>;

export const projecaoFluxoCaixaFormSchema = projecaoFluxoCaixaSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type ProjecaoFluxoCaixaFormValues = z.infer<typeof projecaoFluxoCaixaFormSchema>;

// Schema para caixa e disponibilidades  
export const projecaoCaixaSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  projecao_config_id: z.string().uuid(),
  periodo: z.string(),
  caixa_bancos: z.coerce.number().default(0),
  clientes: z.coerce.number().default(0),
  adiantamentos_fornecedores: z.coerce.number().default(0),
  emprestimos_terceiros: z.coerce.number().default(0),
  estoque_defensivos: z.coerce.number().default(0),
  estoque_fertilizantes: z.coerce.number().default(0),
  estoque_almoxarifado: z.coerce.number().default(0),
  estoque_commodities: z.coerce.number().default(0),
  rebanho: z.coerce.number().default(0),
  ativo_biologico: z.coerce.number().default(0),
  observacoes: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type ProjecaoCaixa = z.infer<typeof projecaoCaixaSchema>;

export const projecaoCaixaFormSchema = projecaoCaixaSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type ProjecaoCaixaFormValues = z.infer<typeof projecaoCaixaFormSchema>;

// Schema para cenários
export const projecaoCenarioSchema = z.object({
  id: z.string().uuid().optional(),
  organizacao_id: z.string().uuid(),
  projecao_config_id: z.string().uuid(),
  nome: z.string().min(1, "Nome do cenário é obrigatório"),
  descricao: z.string().optional(),
  variacoes_preco: z.record(z.number()).optional(),
  variacoes_produtividade: z.record(z.number()).optional(),
  variacao_cambio: z.coerce.number().optional(),
  observacoes: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type ProjecaoCenario = z.infer<typeof projecaoCenarioSchema>;

export const projecaoCenarioFormSchema = projecaoCenarioSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type ProjecaoCenarioFormValues = z.infer<typeof projecaoCenarioFormSchema>;