-- Schema SR-Consultoria - Apenas tabelas, tipos, índices e triggers
-- SEM políticas de RLS

-- ==========================================
-- Configuração inicial
-- ==========================================

-- Extensões necessárias (caso ainda não existam)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- para busca textual
CREATE EXTENSION IF NOT EXISTS "postgis"; -- para dados geoespaciais (opcional)

-- ==========================================
-- Tipos enumerados (ENUM)
-- ==========================================

-- Funções de usuário
CREATE TYPE public.user_role AS ENUM (
  'PROPRIETARIO', 
  'ADMINISTRADOR', 
  'MEMBRO'
);

-- Status de convites
CREATE TYPE public.invite_status AS ENUM (
  'PENDENTE', 
  'ACEITO', 
  'RECUSADO', 
  'EXPIRADO'
);

-- Categoria de custo de produção
CREATE TYPE public.custo_producao_categoria AS ENUM (
  'CALCARIO', 
  'FERTILIZANTE', 
  'SEMENTES', 
  'TRATAMENTO_SEMENTES', 
  'HERBICIDA', 
  'INSETICIDA', 
  'FUNGICIDA', 
  'OUTROS', 
  'BENEFICIAMENTO', 
  'SERVICOS', 
  'ADMINISTRATIVO'
);

-- Tipo de propriedade
CREATE TYPE public.propriedade_tipo AS ENUM (
  'PROPRIO', 
  'ARRENDADO'
);

-- Modalidade de dívida
CREATE TYPE public.divida_modalidade AS ENUM (
  'CUSTEIO', 
  'INVESTIMENTOS'
);

-- Moeda
CREATE TYPE public.moeda_tipo AS ENUM (
  'BRL', 
  'USD'
);

-- Tipo de fator de liquidez
CREATE TYPE public.fator_liquidez_tipo AS ENUM (
  'CAIXA', 
  'BANCO', 
  'INVESTIMENTO'
);

-- Tipo de estoque
CREATE TYPE public.estoque_tipo AS ENUM (
  'FERTILIZANTES', 
  'DEFENSIVOS', 
  'ALMOXARIFADO',
  'SEMENTES',
  'MAQUINAS_E_EQUIPAMENTOS',
  'OUTROS'
);

-- Tipo de commodity
CREATE TYPE public.commodity_tipo AS ENUM (
  'SOJA', 
  'ALGODAO', 
  'MILHO',
  'ARROZ',
  'SORGO',
  'CAFE',
  'CACAU',
  'SOJA_CANA',
  'OUTROS'
);

-- Ciclo de operação pecuária
CREATE TYPE public.operacao_pecuaria_ciclo AS ENUM (
  'CONFINAMENTO', 
  'PASTO', 
  'SEMICONFINAMENTO'
);

-- Origem de operação pecuária
CREATE TYPE public.operacao_pecuaria_origem AS ENUM (
  'PROPRIO', 
  'TERCEIRO'
);

-- Tipo de alerta
CREATE TYPE public.alerta_tipo AS ENUM (
  'LIQUIDEZ', 
  'DIVIDA', 
  'FLUXO_CAIXA', 
  'VENCIMENTO', 
  'SAFRA', 
  'MERCADO'
);

-- Nível de urgência de alerta
CREATE TYPE public.alerta_urgencia AS ENUM (
  'BAIXO', 
  'MEDIO', 
  'ALTO', 
  'CRITICO'
);

-- Canal de envio de alerta
CREATE TYPE public.alerta_canal_envio AS ENUM (
  'EMAIL', 
  'SMS', 
  'SISTEMA'
);

-- ==========================================
-- Tabelas principais
-- ==========================================

-- Tabela de organizações (tenants)
CREATE TABLE public.organizacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo TEXT,
  endereco TEXT,
  telefone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  cpf VARCHAR(14),
  cnpj VARCHAR(18),
  cep VARCHAR(9),
  numero VARCHAR(10),
  complemento VARCHAR(255),
  bairro VARCHAR(255),
  cidade VARCHAR(255),
  estado VARCHAR(2),
  inscricao_estadual VARCHAR(20),
  perfil_linkedin VARCHAR(255),
  perfil_instagram VARCHAR(255),
  canal_youtube VARCHAR(255),
  perfil_x VARCHAR(255),
  perfil_tiktok VARCHAR(255),
  pagina_facebook VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de associação entre usuários e organizações
CREATE TABLE public.associacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  funcao user_role NOT NULL DEFAULT 'MEMBRO',
  eh_proprietario BOOLEAN NOT NULL DEFAULT FALSE,
  data_adicao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(usuario_id, organizacao_id)
);

-- Tabela de convites
CREATE TABLE public.convites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  funcao user_role NOT NULL DEFAULT 'MEMBRO',
  status invite_status NOT NULL DEFAULT 'PENDENTE',
  ultimo_envio TIMESTAMPTZ,
  expira_em TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- Módulo de Propriedades e Terras
-- ==========================================

-- Tabela de propriedades
CREATE TABLE public.propriedades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  ano_aquisicao INT,
  proprietario VARCHAR(255) NOT NULL,
  cidade VARCHAR(255) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  numero_matricula VARCHAR(50),
  area_total DECIMAL(12, 2) NOT NULL, -- hectares
  area_cultivada DECIMAL(12, 2), -- hectares
  valor_atual DECIMAL(15, 2),
  onus TEXT,
  avaliacao_banco DECIMAL(15, 2),
  tipo propriedade_tipo NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de arrendamentos
CREATE TABLE public.arrendamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  propriedade_id UUID NOT NULL REFERENCES public.propriedades(id) ON DELETE CASCADE,
  numero_arrendamento VARCHAR(50),
  area_fazenda DECIMAL(12, 2) NOT NULL, -- hectares
  area_arrendada DECIMAL(12, 2) NOT NULL, -- hectares
  nome_fazenda VARCHAR(255) NOT NULL,
  arrendantes TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_termino DATE NOT NULL,
  custo_hectare DECIMAL(10, 2) NOT NULL, -- sacas
  custo_ano DECIMAL(10, 2) NOT NULL, -- sacas
  custos_projetados_anuais JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de benfeitorias
CREATE TABLE public.benfeitorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  propriedade_id UUID NOT NULL REFERENCES public.propriedades(id) ON DELETE CASCADE,
  descricao VARCHAR(255) NOT NULL,
  dimensoes VARCHAR(100),
  valor DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- Módulo de Produção
-- ==========================================

-- Tabela de culturas
CREATE TABLE public.culturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organizacao_id, nome)
);

-- Tabela de sistemas
CREATE TABLE public.sistemas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL, -- ex: SEQUEIRO, IRRIGADO
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organizacao_id, nome)
);

-- Tabela de ciclos
CREATE TABLE public.ciclos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL, -- ex: 1ª SAFRA, 2ª SAFRA
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organizacao_id, nome)
);

-- Tabela de safras
CREATE TABLE public.safras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL, -- ex: "2023/24"
  ano_inicio INT NOT NULL,
  ano_fim INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organizacao_id, nome)
);

-- Tabela de áreas de plantio
CREATE TABLE public.areas_plantio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  propriedade_id UUID NOT NULL REFERENCES public.propriedades(id) ON DELETE CASCADE,
  cultura_id UUID NOT NULL REFERENCES public.culturas(id) ON DELETE RESTRICT,
  sistema_id UUID NOT NULL REFERENCES public.sistemas(id) ON DELETE RESTRICT,
  ciclo_id UUID NOT NULL REFERENCES public.ciclos(id) ON DELETE RESTRICT,
  safra_id UUID NOT NULL REFERENCES public.safras(id) ON DELETE RESTRICT,
  area DECIMAL(12, 2) NOT NULL, -- hectares
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de produtividades
CREATE TABLE public.produtividades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  cultura_id UUID NOT NULL REFERENCES public.culturas(id) ON DELETE RESTRICT,
  sistema_id UUID NOT NULL REFERENCES public.sistemas(id) ON DELETE RESTRICT,
  safra_id UUID NOT NULL REFERENCES public.safras(id) ON DELETE RESTRICT,
  produtividade DECIMAL(10, 2) NOT NULL,
  unidade VARCHAR(10) NOT NULL, -- sc/ha, @/ha, kg/ha
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de custos de produção
CREATE TABLE public.custos_producao (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  cultura_id UUID NOT NULL REFERENCES public.culturas(id) ON DELETE RESTRICT,
  sistema_id UUID NOT NULL REFERENCES public.sistemas(id) ON DELETE RESTRICT,
  safra_id UUID NOT NULL REFERENCES public.safras(id) ON DELETE RESTRICT,
  categoria custo_producao_categoria NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de rebanhos
CREATE TABLE public.rebanhos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  tipo_animal VARCHAR(100) NOT NULL,
  categoria VARCHAR(100) NOT NULL, -- macho/fêmea por faixa etária
  quantidade INT NOT NULL,
  preco_unitario DECIMAL(15, 2) NOT NULL,
  propriedade_id UUID NOT NULL REFERENCES public.propriedades(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de operações pecuárias
CREATE TABLE public.operacoes_pecuarias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  ciclo operacao_pecuaria_ciclo NOT NULL,
  origem operacao_pecuaria_origem NOT NULL,
  propriedade_id UUID NOT NULL REFERENCES public.propriedades(id) ON DELETE CASCADE,
  volume_abate_por_safra JSONB NOT NULL, -- volume de abate/ano por safra
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- Módulo Comercial
-- ==========================================

-- Tabela de preços
CREATE TABLE public.precos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  safra_id UUID NOT NULL REFERENCES public.safras(id) ON DELETE RESTRICT,
  dolar_algodao DECIMAL(10, 2),
  dolar_milho DECIMAL(10, 2),
  dolar_soja DECIMAL(10, 2),
  dolar_fechamento DECIMAL(10, 2),
  preco_algodao DECIMAL(10, 4), -- USD/lb
  preco_caroco_algodao DECIMAL(10, 2), -- R$/ton
  preco_unitario_caroco_algodao DECIMAL(10, 2), -- R$/@
  preco_algodao_bruto DECIMAL(10, 2), -- R$/@
  preco_milho DECIMAL(10, 2), -- R$/saca
  preco_soja_usd DECIMAL(10, 2), -- U$/saca
  preco_soja_brl DECIMAL(10, 2), -- R$/saca
  outros_precos JSONB, -- preços de outras culturas
  data_referencia DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de vendas de sementes
CREATE TABLE public.vendas_sementes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  cultura_id UUID NOT NULL REFERENCES public.culturas(id) ON DELETE RESTRICT,
  ano INT NOT NULL,
  receita_operacional_bruta DECIMAL(15, 2) NOT NULL,
  impostos_vendas DECIMAL(15, 2) NOT NULL,
  comissao_vendas DECIMAL(15, 2) NOT NULL,
  logistica_entregas DECIMAL(15, 2) NOT NULL,
  custo_mercadorias_vendidas DECIMAL(15, 2) NOT NULL,
  despesas_gerais DECIMAL(15, 2) NOT NULL,
  imposto_renda DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de vendas pecuárias
CREATE TABLE public.vendas_pecuaria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  ano INT NOT NULL,
  receita_operacional_bruta DECIMAL(15, 2) NOT NULL,
  impostos_vendas DECIMAL(15, 2) NOT NULL,
  comissao_vendas DECIMAL(15, 2) NOT NULL,
  logistica_entregas DECIMAL(15, 2) NOT NULL,
  custo_mercadorias_vendidas DECIMAL(15, 2) NOT NULL,
  despesas_gerais DECIMAL(15, 2) NOT NULL,
  imposto_renda DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- Módulo Financeiro
-- ==========================================

-- Tabela de dívidas bancárias
CREATE TABLE public.dividas_bancarias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  modalidade divida_modalidade NOT NULL,
  instituicao_bancaria VARCHAR(255) NOT NULL,
  ano_contratacao INT NOT NULL,
  indexador VARCHAR(50) NOT NULL,
  taxa_real DECIMAL(6, 2) NOT NULL, -- % ao ano
  fluxo_pagamento_anual JSONB NOT NULL, -- valores de 2021 a 2033
  moeda moeda_tipo NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de dívidas com tradings
CREATE TABLE public.dividas_trading (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  modalidade divida_modalidade NOT NULL,
  empresa_trading VARCHAR(255) NOT NULL,
  indexador VARCHAR(50) NOT NULL,
  taxa_real DECIMAL(6, 2) NOT NULL, -- % ao ano
  fluxo_pagamento_anual JSONB NOT NULL, -- valores de 2021 a 2033
  moeda moeda_tipo NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de dívidas de imóveis
CREATE TABLE public.dividas_imoveis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  propriedade_id UUID NOT NULL REFERENCES public.propriedades(id) ON DELETE CASCADE,
  credor VARCHAR(255) NOT NULL,
  data_aquisicao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  moeda moeda_tipo NOT NULL DEFAULT 'BRL',
  valor_total DECIMAL(15, 2) NOT NULL,
  fluxo_pagamento_anual JSONB NOT NULL, -- valores de 2018 a 2038
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de fornecedores
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  moeda moeda_tipo NOT NULL DEFAULT 'BRL',
  valores_por_ano JSONB NOT NULL, -- valores de 2025 a 2033
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de fatores de liquidez
CREATE TABLE public.fatores_liquidez (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  tipo fator_liquidez_tipo NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de estoques
CREATE TABLE public.estoques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  tipo estoque_tipo NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de estoques de commodities
CREATE TABLE public.estoques_commodities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  commodity commodity_tipo NOT NULL,
  quantidade DECIMAL(12, 2) NOT NULL,
  valor_unitario DECIMAL(10, 2) NOT NULL,
  valor_total DECIMAL(15, 2) NOT NULL,
  data_referencia DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de contratos recebíveis
CREATE TABLE public.contratos_recebiveis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  fornecedor VARCHAR(255) NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  data_vencimento DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de adiantamentos a fornecedores
CREATE TABLE public.adiantamentos_fornecedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  valor DECIMAL(15, 2) NOT NULL,
  data_adiantamento DATE NOT NULL DEFAULT CURRENT_DATE,
  data_previsao_entrega DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de empréstimos a terceiros
CREATE TABLE public.emprestimos_terceiros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  beneficiario VARCHAR(255) NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  taxa_juros DECIMAL(6, 2),
  data_emprestimo DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- Módulo Patrimonial
-- ==========================================

-- Tabela de máquinas e equipamentos
CREATE TABLE public.maquinas_equipamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  descricao VARCHAR(255) NOT NULL,
  ano INT NOT NULL,
  marca VARCHAR(100) NOT NULL,
  alienado BOOLEAN NOT NULL DEFAULT FALSE,
  numero_chassi VARCHAR(100),
  valor_aquisicao DECIMAL(15, 2) NOT NULL,
  data_aquisicao DATE NOT NULL,
  valor_atual DECIMAL(15, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de investimentos
CREATE TABLE public.investimentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  categoria VARCHAR(100) NOT NULL, -- EQUIPAMENTO, TRATOR_COLHEITADEIRA_PULVERIZADOR, etc.
  ano INT NOT NULL,
  quantidade INT NOT NULL,
  valor_unitario DECIMAL(15, 2) NOT NULL,
  valor_total DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de vendas de ativos
CREATE TABLE public.vendas_ativos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  categoria VARCHAR(100) NOT NULL,
  ano INT NOT NULL,
  quantidade INT NOT NULL,
  valor_unitario DECIMAL(15, 2) NOT NULL,
  valor_total DECIMAL(15, 2) NOT NULL,
  data_venda DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de planos de investimento
CREATE TABLE public.planos_investimento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  categoria VARCHAR(100) NOT NULL,
  ano INT NOT NULL,
  quantidade INT NOT NULL,
  valor_unitario DECIMAL(15, 2) NOT NULL,
  valor_total DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de planos de aquisição de terras
CREATE TABLE public.planos_aquisicao_terras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome_fazenda VARCHAR(255) NOT NULL,
  ano INT NOT NULL,
  hectares DECIMAL(12, 2) NOT NULL,
  sacas DECIMAL(10, 2) NOT NULL,
  total_sacas DECIMAL(12, 2) NOT NULL,
  valor_total DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- Módulo de Projeções
-- ==========================================

-- Tabela de projeções de culturas
CREATE TABLE public.projecoes_culturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  cultura_id UUID NOT NULL REFERENCES public.culturas(id) ON DELETE RESTRICT,
  ciclo_id UUID NOT NULL REFERENCES public.ciclos(id) ON DELETE RESTRICT,
  sistema_id UUID NOT NULL REFERENCES public.sistemas(id) ON DELETE RESTRICT,
  safra_id UUID NOT NULL REFERENCES public.safras(id) ON DELETE RESTRICT,
  area DECIMAL(12, 2) NOT NULL, -- hectares
  produtividade DECIMAL(10, 2) NOT NULL,
  unidade VARCHAR(10) NOT NULL,
  preco DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de projeções de dívidas
CREATE TABLE public.projecoes_dividas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  categoria VARCHAR(100) NOT NULL, -- BANCOS, TERRAS, ARRENDAMENTO, etc.
  ano INT NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de projeções de caixa e disponibilidades
CREATE TABLE public.projecoes_caixa_disponibilidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  ano INT NOT NULL,
  caixa_bancos DECIMAL(15, 2) NOT NULL,
  clientes DECIMAL(15, 2) NOT NULL,
  adiantamentos_fornecedores DECIMAL(15, 2) NOT NULL,
  emprestimos_a_terceiros DECIMAL(15, 2) NOT NULL,
  estoque_defensivos DECIMAL(15, 2) NOT NULL,
  estoque_fertilizantes DECIMAL(15, 2) NOT NULL,
  estoque_almoxarifado DECIMAL(15, 2) NOT NULL,
  estoque_commodities DECIMAL(15, 2) NOT NULL,
  rebanho DECIMAL(15, 2) NOT NULL,
  ativo_biologico DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organizacao_id, ano)
);

-- Tabela de projeções de fluxo de caixa
CREATE TABLE public.projecoes_fluxo_caixa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  ano INT NOT NULL,
  outras_despesas JSONB NOT NULL, -- arrendamento, pró-labore, outras
  receitas_agricolas DECIMAL(15, 2) NOT NULL,
  despesas_agricolas DECIMAL(15, 2) NOT NULL,
  investimentos JSONB NOT NULL, -- maquinários, outros
  custos_financeiros JSONB NOT NULL, -- serviço da dívida, pagamentos, refinanciamentos
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organizacao_id, ano)
);

-- ==========================================
-- Módulo de Indicadores
-- ==========================================

-- Tabela de configurações de indicadores
CREATE TABLE public.configuracoes_indicadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  limiares_liquidez JSONB NOT NULL,
  limiares_divida_ebitda JSONB NOT NULL,
  limiares_divida_receita JSONB NOT NULL,
  limiares_divida_patrimonio JSONB NOT NULL,
  limiares_ltv JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organizacao_id)
);

-- Tabela de parâmetros de sensibilidade
CREATE TABLE public.parametros_sensibilidade (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  variacoes_cambio JSONB NOT NULL,
  variacoes_precos_commodities JSONB NOT NULL,
  variacoes_produtividade JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organizacao_id)
);

-- Tabela de cenários de quebra de safra
CREATE TABLE public.cenarios_quebra_safra (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  percentual_reducao_produtividade DECIMAL(5, 2) NOT NULL,
  cultura_afetada_id UUID NOT NULL REFERENCES public.culturas(id) ON DELETE RESTRICT,
  safra_afetada_id UUID NOT NULL REFERENCES public.safras(id) ON DELETE RESTRICT,
  impacto_projetado_fluxo_caixa DECIMAL(15, 2) NOT NULL,
  impacto_indicadores_divida JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de alertas
CREATE TABLE public.alertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  tipo alerta_tipo NOT NULL,
  condicao_ativacao TEXT NOT NULL,
  nivel_urgencia alerta_urgencia NOT NULL DEFAULT 'MEDIO',
  destinatarios JSONB NOT NULL, -- array de strings
  frequencia_verificacao VARCHAR(100) NOT NULL,
  canal_envio alerta_canal_envio NOT NULL DEFAULT 'SISTEMA',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  ultima_verificacao TIMESTAMPTZ,
  ultima_notificacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- Tabela de Auditoria
-- ==========================================

CREATE TABLE public.auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organizacao_id UUID REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  tabela VARCHAR(100) NOT NULL,
  operacao VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
  registro_id UUID NOT NULL,
  valores_antigos JSONB,
  valores_novos JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- Índices para otimização de performance
-- ==========================================

-- Índices para melhorar consultas pelo tenant
CREATE INDEX idx_organizacoes_slug ON public.organizacoes(slug);
CREATE INDEX idx_associacoes_organizacao_id ON public.associacoes(organizacao_id);
CREATE INDEX idx_associacoes_usuario_id ON public.associacoes(usuario_id);
CREATE INDEX idx_convites_organizacao_id ON public.convites(organizacao_id);
CREATE INDEX idx_convites_email ON public.convites(email);

-- Índices para módulo de propriedades
CREATE INDEX idx_propriedades_organizacao_id ON public.propriedades(organizacao_id);
CREATE INDEX idx_arrendamentos_organizacao_id ON public.arrendamentos(organizacao_id);
CREATE INDEX idx_arrendamentos_propriedade_id ON public.arrendamentos(propriedade_id);
CREATE INDEX idx_benfeitorias_organizacao_id ON public.benfeitorias(organizacao_id);
CREATE INDEX idx_benfeitorias_propriedade_id ON public.benfeitorias(propriedade_id);

-- Índices para módulo de produção
CREATE INDEX idx_culturas_organizacao_id ON public.culturas(organizacao_id);
CREATE INDEX idx_sistemas_organizacao_id ON public.sistemas(organizacao_id);
CREATE INDEX idx_ciclos_organizacao_id ON public.ciclos(organizacao_id);
CREATE INDEX idx_safras_organizacao_id ON public.safras(organizacao_id);
CREATE INDEX idx_areas_plantio_organizacao_id ON public.areas_plantio(organizacao_id);
CREATE INDEX idx_areas_plantio_safra_id ON public.areas_plantio(safra_id);
CREATE INDEX idx_produtividades_organizacao_id ON public.produtividades(organizacao_id);
CREATE INDEX idx_produtividades_cultura_safra ON public.produtividades(cultura_id, safra_id);
CREATE INDEX idx_custos_producao_organizacao_id ON public.custos_producao(organizacao_id);
CREATE INDEX idx_custos_producao_cultura_safra ON public.custos_producao(cultura_id, safra_id);
CREATE INDEX idx_rebanhos_organizacao_id ON public.rebanhos(organizacao_id);
CREATE INDEX idx_operacoes_pecuarias_organizacao_id ON public.operacoes_pecuarias(organizacao_id);

-- Índices para módulo comercial
CREATE INDEX idx_precos_organizacao_id ON public.precos(organizacao_id);
CREATE INDEX idx_precos_safra_id ON public.precos(safra_id);
CREATE INDEX idx_vendas_sementes_organizacao_id ON public.vendas_sementes(organizacao_id);
CREATE INDEX idx_vendas_pecuaria_organizacao_id ON public.vendas_pecuaria(organizacao_id);

-- Índices para módulo financeiro
CREATE INDEX idx_dividas_bancarias_organizacao_id ON public.dividas_bancarias(organizacao_id);
CREATE INDEX idx_dividas_trading_organizacao_id ON public.dividas_trading(organizacao_id);
CREATE INDEX idx_dividas_imoveis_organizacao_id ON public.dividas_imoveis(organizacao_id);
CREATE INDEX idx_dividas_imoveis_propriedade_id ON public.dividas_imoveis(propriedade_id);
CREATE INDEX idx_fornecedores_organizacao_id ON public.fornecedores(organizacao_id);
CREATE INDEX idx_fatores_liquidez_organizacao_id ON public.fatores_liquidez(organizacao_id);
CREATE INDEX idx_estoques_organizacao_id ON public.estoques(organizacao_id);
CREATE INDEX idx_estoques_commodities_organizacao_id ON public.estoques_commodities(organizacao_id);
CREATE INDEX idx_contratos_recebiveis_organizacao_id ON public.contratos_recebiveis(organizacao_id);
CREATE INDEX idx_adiantamentos_fornecedores_organizacao_id ON public.adiantamentos_fornecedores(organizacao_id);
CREATE INDEX idx_emprestimos_terceiros_organizacao_id ON public.emprestimos_terceiros(organizacao_id);

-- Índices para módulo patrimonial
CREATE INDEX idx_maquinas_equipamentos_organizacao_id ON public.maquinas_equipamentos(organizacao_id);
CREATE INDEX idx_investimentos_organizacao_id ON public.investimentos(organizacao_id);
CREATE INDEX idx_vendas_ativos_organizacao_id ON public.vendas_ativos(organizacao_id);
CREATE INDEX idx_planos_investimento_organizacao_id ON public.planos_investimento(organizacao_id);
CREATE INDEX idx_planos_aquisicao_terras_organizacao_id ON public.planos_aquisicao_terras(organizacao_id);

-- Índices para módulo de projeções
CREATE INDEX idx_projecoes_culturas_organizacao_id ON public.projecoes_culturas(organizacao_id);
CREATE INDEX idx_projecoes_culturas_safra_id ON public.projecoes_culturas(safra_id);
CREATE INDEX idx_projecoes_dividas_organizacao_id ON public.projecoes_dividas(organizacao_id);
CREATE INDEX idx_projecoes_dividas_ano ON public.projecoes_dividas(ano);
CREATE INDEX idx_projecoes_caixa_disponibilidades_organizacao_id ON public.projecoes_caixa_disponibilidades(organizacao_id);
CREATE INDEX idx_projecoes_caixa_disponibilidades_ano ON public.projecoes_caixa_disponibilidades(ano);
CREATE INDEX idx_projecoes_fluxo_caixa_organizacao_id ON public.projecoes_fluxo_caixa(organizacao_id);
CREATE INDEX idx_projecoes_fluxo_caixa_ano ON public.projecoes_fluxo_caixa(ano);

-- Índices para módulo de indicadores
CREATE INDEX idx_configuracoes_indicadores_organizacao_id ON public.configuracoes_indicadores(organizacao_id);
CREATE INDEX idx_parametros_sensibilidade_organizacao_id ON public.parametros_sensibilidade(organizacao_id);
CREATE INDEX idx_cenarios_quebra_safra_organizacao_id ON public.cenarios_quebra_safra(organizacao_id);
CREATE INDEX idx_alertas_organizacao_id ON public.alertas(organizacao_id);
CREATE INDEX idx_alertas_tipo ON public.alertas(tipo);

-- Índice para auditoria
CREATE INDEX idx_auditoria_organizacao_id ON public.auditoria(organizacao_id);
CREATE INDEX idx_auditoria_usuario_id ON public.auditoria(usuario_id);
CREATE INDEX idx_auditoria_tabela ON public.auditoria(tabela);
CREATE INDEX idx_auditoria_registro_id ON public.auditoria(registro_id);
CREATE INDEX idx_auditoria_created_at ON public.auditoria(created_at);

-- ==========================================
-- Funções para triggers
-- ==========================================

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar auditoria
CREATE OR REPLACE FUNCTION public.audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_id UUID;
  org_id UUID;
  has_org_field BOOLEAN;
BEGIN
  -- Tenta obter o ID do usuário atual (requer funções de autenticação configuradas)
  user_id := (SELECT auth.uid());
  
  -- Verifica se a tabela tem o campo organizacao_id
  has_org_field := EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = TG_TABLE_SCHEMA 
    AND table_name = TG_TABLE_NAME 
    AND column_name = 'organizacao_id'
  );
  
  -- Obtém o ID da organização apenas se a tabela tiver esse campo
  IF has_org_field THEN
    IF TG_OP = 'DELETE' THEN
      org_id := OLD.organizacao_id;
    ELSE 
      org_id := NEW.organizacao_id;
    END IF;
  ELSE
    org_id := NULL; -- Se a tabela não tiver organizacao_id, define como NULL
  END IF;
  
  -- Insere o registro de auditoria
  INSERT INTO public.auditoria(
    usuario_id,
    organizacao_id,
    tabela,
    operacao,
    registro_id,
    valores_antigos,
    valores_novos,
    ip_address,
    user_agent
  )
  VALUES (
    user_id,
    org_id,
    TG_TABLE_NAME,
    TG_OP,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id 
      ELSE NEW.id 
    END,
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD)
      ELSE NULL
    END,
    CASE 
      WHEN TG_OP = 'DELETE' THEN NULL
      ELSE to_jsonb(NEW)
    END,
    NULL, -- Seria necessário um middleware para capturar isso
    NULL  -- Seria necessário um middleware para capturar isso
  );
  
  -- Retorno adequado conforme a operação
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular totais automáticos
CREATE OR REPLACE FUNCTION public.calcular_totais_automaticos()
RETURNS TRIGGER AS $$
BEGIN
  -- Exemplos de cálculos automáticos
  IF TG_TABLE_NAME = 'estoques_commodities' THEN
    NEW.valor_total := NEW.quantidade * NEW.valor_unitario;
  ELSIF TG_TABLE_NAME = 'investimentos' THEN
    NEW.valor_total := NEW.quantidade * NEW.valor_unitario;
  ELSIF TG_TABLE_NAME = 'vendas_ativos' THEN
    NEW.valor_total := NEW.quantidade * NEW.valor_unitario;
  ELSIF TG_TABLE_NAME = 'planos_investimento' THEN
    NEW.valor_total := NEW.quantidade * NEW.valor_unitario;
  ELSIF TG_TABLE_NAME = 'planos_aquisicao_terras' THEN
    NEW.total_sacas := NEW.hectares * NEW.sacas;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Aplicação de Triggers
-- ==========================================

-- Triggers de timestamp updated_at para cada tabela
CREATE TRIGGER update_timestamp_organizacoes
BEFORE UPDATE ON public.organizacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_associacoes
BEFORE UPDATE ON public.associacoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_convites
BEFORE UPDATE ON public.convites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_propriedades
BEFORE UPDATE ON public.propriedades
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_arrendamentos
BEFORE UPDATE ON public.arrendamentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_benfeitorias
BEFORE UPDATE ON public.benfeitorias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_culturas
BEFORE UPDATE ON public.culturas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_sistemas
BEFORE UPDATE ON public.sistemas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_ciclos
BEFORE UPDATE ON public.ciclos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_safras
BEFORE UPDATE ON public.safras
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_areas_plantio
BEFORE UPDATE ON public.areas_plantio
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_produtividades
BEFORE UPDATE ON public.produtividades
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_custos_producao
BEFORE UPDATE ON public.custos_producao
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_rebanhos
BEFORE UPDATE ON public.rebanhos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_operacoes_pecuarias
BEFORE UPDATE ON public.operacoes_pecuarias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_precos
BEFORE UPDATE ON public.precos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_vendas_sementes
BEFORE UPDATE ON public.vendas_sementes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_vendas_pecuaria
BEFORE UPDATE ON public.vendas_pecuaria
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_dividas_bancarias
BEFORE UPDATE ON public.dividas_bancarias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_dividas_trading
BEFORE UPDATE ON public.dividas_trading
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_dividas_imoveis
BEFORE UPDATE ON public.dividas_imoveis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_fornecedores
BEFORE UPDATE ON public.fornecedores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_fatores_liquidez
BEFORE UPDATE ON public.fatores_liquidez
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_estoques
BEFORE UPDATE ON public.estoques
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_estoques_commodities
BEFORE UPDATE ON public.estoques_commodities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_contratos_recebiveis
BEFORE UPDATE ON public.contratos_recebiveis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_adiantamentos_fornecedores
BEFORE UPDATE ON public.adiantamentos_fornecedores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_emprestimos_terceiros
BEFORE UPDATE ON public.emprestimos_terceiros
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_maquinas_equipamentos
BEFORE UPDATE ON public.maquinas_equipamentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_investimentos
BEFORE UPDATE ON public.investimentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_vendas_ativos
BEFORE UPDATE ON public.vendas_ativos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_planos_investimento
BEFORE UPDATE ON public.planos_investimento
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_planos_aquisicao_terras
BEFORE UPDATE ON public.planos_aquisicao_terras
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_projecoes_culturas
BEFORE UPDATE ON public.projecoes_culturas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_projecoes_dividas
BEFORE UPDATE ON public.projecoes_dividas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_projecoes_caixa_disponibilidades
BEFORE UPDATE ON public.projecoes_caixa_disponibilidades
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_projecoes_fluxo_caixa
BEFORE UPDATE ON public.projecoes_fluxo_caixa
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_configuracoes_indicadores
BEFORE UPDATE ON public.configuracoes_indicadores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_parametros_sensibilidade
BEFORE UPDATE ON public.parametros_sensibilidade
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_cenarios_quebra_safra
BEFORE UPDATE ON public.cenarios_quebra_safra
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_alertas
BEFORE UPDATE ON public.alertas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para cálculos automáticos
CREATE TRIGGER calcular_totais_estoques_commodities
BEFORE INSERT OR UPDATE ON public.estoques_commodities
FOR EACH ROW EXECUTE FUNCTION public.calcular_totais_automaticos();

CREATE TRIGGER calcular_totais_investimentos
BEFORE INSERT OR UPDATE ON public.investimentos
FOR EACH ROW EXECUTE FUNCTION public.calcular_totais_automaticos();

CREATE TRIGGER calcular_totais_vendas_ativos
BEFORE INSERT OR UPDATE ON public.vendas_ativos
FOR EACH ROW EXECUTE FUNCTION public.calcular_totais_automaticos();

CREATE TRIGGER calcular_totais_planos_investimento
BEFORE INSERT OR UPDATE ON public.planos_investimento
FOR EACH ROW EXECUTE FUNCTION public.calcular_totais_automaticos();

CREATE TRIGGER calcular_totais_planos_aquisicao_terras
BEFORE INSERT OR UPDATE ON public.planos_aquisicao_terras
FOR EACH ROW EXECUTE FUNCTION public.calcular_totais_automaticos();

-- Triggers de auditoria
CREATE TRIGGER audit_changes_organizacoes
AFTER INSERT OR UPDATE OR DELETE ON public.organizacoes
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_associacoes
AFTER INSERT OR UPDATE OR DELETE ON public.associacoes
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_convites
AFTER INSERT OR UPDATE OR DELETE ON public.convites
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_propriedades
AFTER INSERT OR UPDATE OR DELETE ON public.propriedades
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_arrendamentos
AFTER INSERT OR UPDATE OR DELETE ON public.arrendamentos
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_benfeitorias
AFTER INSERT OR UPDATE OR DELETE ON public.benfeitorias
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_culturas
AFTER INSERT OR UPDATE OR DELETE ON public.culturas
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_sistemas
AFTER INSERT OR UPDATE OR DELETE ON public.sistemas
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_ciclos
AFTER INSERT OR UPDATE OR DELETE ON public.ciclos
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_safras
AFTER INSERT OR UPDATE OR DELETE ON public.safras
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_areas_plantio
AFTER INSERT OR UPDATE OR DELETE ON public.areas_plantio
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_produtividades
AFTER INSERT OR UPDATE OR DELETE ON public.produtividades
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_custos_producao
AFTER INSERT OR UPDATE OR DELETE ON public.custos_producao
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_rebanhos
AFTER INSERT OR UPDATE OR DELETE ON public.rebanhos
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_operacoes_pecuarias
AFTER INSERT OR UPDATE OR DELETE ON public.operacoes_pecuarias
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_precos
AFTER INSERT OR UPDATE OR DELETE ON public.precos
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_vendas_sementes
AFTER INSERT OR UPDATE OR DELETE ON public.vendas_sementes
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_vendas_pecuaria
AFTER INSERT OR UPDATE OR DELETE ON public.vendas_pecuaria
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_dividas_bancarias
AFTER INSERT OR UPDATE OR DELETE ON public.dividas_bancarias
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_dividas_trading
AFTER INSERT OR UPDATE OR DELETE ON public.dividas_trading
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_dividas_imoveis
AFTER INSERT OR UPDATE OR DELETE ON public.dividas_imoveis
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_fornecedores
AFTER INSERT OR UPDATE OR DELETE ON public.fornecedores
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_fatores_liquidez
AFTER INSERT OR UPDATE OR DELETE ON public.fatores_liquidez
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_estoques
AFTER INSERT OR UPDATE OR DELETE ON public.estoques
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_estoques_commodities
AFTER INSERT OR UPDATE OR DELETE ON public.estoques_commodities
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_contratos_recebiveis
AFTER INSERT OR UPDATE OR DELETE ON public.contratos_recebiveis
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_adiantamentos_fornecedores
AFTER INSERT OR UPDATE OR DELETE ON public.adiantamentos_fornecedores
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_emprestimos_terceiros
AFTER INSERT OR UPDATE OR DELETE ON public.emprestimos_terceiros
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_maquinas_equipamentos
AFTER INSERT OR UPDATE OR DELETE ON public.maquinas_equipamentos
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_investimentos
AFTER INSERT OR UPDATE OR DELETE ON public.investimentos
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_vendas_ativos
AFTER INSERT OR UPDATE OR DELETE ON public.vendas_ativos
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_planos_investimento
AFTER INSERT OR UPDATE OR DELETE ON public.planos_investimento
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_planos_aquisicao_terras
AFTER INSERT OR UPDATE OR DELETE ON public.planos_aquisicao_terras
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_projecoes_culturas
AFTER INSERT OR UPDATE OR DELETE ON public.projecoes_culturas
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_projecoes_dividas
AFTER INSERT OR UPDATE OR DELETE ON public.projecoes_dividas
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_projecoes_caixa_disponibilidades
AFTER INSERT OR UPDATE OR DELETE ON public.projecoes_caixa_disponibilidades
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_projecoes_fluxo_caixa
AFTER INSERT OR UPDATE OR DELETE ON public.projecoes_fluxo_caixa
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_configuracoes_indicadores
AFTER INSERT OR UPDATE OR DELETE ON public.configuracoes_indicadores
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_parametros_sensibilidade
AFTER INSERT OR UPDATE OR DELETE ON public.parametros_sensibilidade
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_cenarios_quebra_safra
AFTER INSERT OR UPDATE OR DELETE ON public.cenarios_quebra_safra
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_alertas
AFTER INSERT OR UPDATE OR DELETE ON public.alertas
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();