-- ==========================================
-- Atualização do tables_only.sql para Módulo de Projeções
-- Remove as tabelas antigas e adiciona as novas estruturas
-- ==========================================

-- Este script deve substituir a seção de "Módulo de Projeções" no tables_only.sql
-- Linhas 638-703 aproximadamente

-- REMOVER as seguintes linhas do tables_only.sql:
/*
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
*/

-- SUBSTITUIR por:

-- ==========================================
-- Tipos enumerados para projeções
-- ==========================================

CREATE TYPE public.projecao_status AS ENUM (
  'ATIVA', 
  'INATIVA', 
  'ARQUIVADA'
);

CREATE TYPE public.safra_formato AS ENUM (
  'SAFRA_COMPLETA',  -- Ex: 2023/24
  'ANO_CIVIL'        -- Ex: 2024
);

CREATE TYPE public.projecao_tipo AS ENUM (
  'CULTURA',
  'DIVIDA', 
  'CAIXA_DISPONIBILIDADES',
  'FLUXO_CAIXA'
);

-- ==========================================
-- Módulo de Projeções
-- ==========================================

-- Tabela principal de configuração de projeções
CREATE TABLE public.projecoes_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  periodo_inicio INT NOT NULL CHECK (periodo_inicio >= 2020 AND periodo_inicio <= 2050),
  periodo_fim INT NOT NULL CHECK (periodo_fim >= 2020 AND periodo_fim <= 2050),
  formato_safra safra_formato NOT NULL DEFAULT 'SAFRA_COMPLETA',
  status projecao_status NOT NULL DEFAULT 'ATIVA',
  eh_padrao BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_periodo_valido CHECK (periodo_fim >= periodo_inicio),
  CONSTRAINT uk_organizacao_nome UNIQUE(organizacao_id, nome)
);

-- Tabela de projeções de culturas
CREATE TABLE public.projecoes_culturas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  projecao_config_id UUID NOT NULL REFERENCES public.projecoes_config(id) ON DELETE CASCADE,
  cultura_id UUID NOT NULL REFERENCES public.culturas(id) ON DELETE RESTRICT,
  sistema_id UUID NOT NULL REFERENCES public.sistemas(id) ON DELETE RESTRICT,
  periodo VARCHAR(20) NOT NULL, -- Ex: "2023/24" ou "2024" dependendo do formato
  
  -- Dados de entrada
  area_plantada DECIMAL(12, 2) NOT NULL CHECK (area_plantada >= 0),
  produtividade DECIMAL(10, 2) NOT NULL CHECK (produtividade >= 0),
  unidade_produtividade VARCHAR(10) NOT NULL DEFAULT 'Sc/ha',
  preco_unitario DECIMAL(10, 2) NOT NULL CHECK (preco_unitario >= 0),
  unidade_preco VARCHAR(10) NOT NULL DEFAULT 'R$/Sc',
  
  -- Custos detalhados
  custo_fertilizantes DECIMAL(15, 2) DEFAULT 0,
  custo_defensivos DECIMAL(15, 2) DEFAULT 0,
  custo_sementes DECIMAL(15, 2) DEFAULT 0,
  custo_combustivel DECIMAL(15, 2) DEFAULT 0,
  custo_mao_obra DECIMAL(15, 2) DEFAULT 0,
  custo_maquinario DECIMAL(15, 2) DEFAULT 0,
  custo_outros DECIMAL(15, 2) DEFAULT 0,
  
  -- Campos calculados automaticamente
  producao_total DECIMAL(15, 2) GENERATED ALWAYS AS (area_plantada * produtividade) STORED,
  receita_bruta DECIMAL(15, 2) GENERATED ALWAYS AS (area_plantada * produtividade * preco_unitario) STORED,
  custo_total DECIMAL(15, 2) GENERATED ALWAYS AS (
    COALESCE(custo_fertilizantes, 0) + 
    COALESCE(custo_defensivos, 0) + 
    COALESCE(custo_sementes, 0) + 
    COALESCE(custo_combustivel, 0) + 
    COALESCE(custo_mao_obra, 0) + 
    COALESCE(custo_maquinario, 0) + 
    COALESCE(custo_outros, 0)
  ) STORED,
  ebitda DECIMAL(15, 2) GENERATED ALWAYS AS (
    (area_plantada * produtividade * preco_unitario) - 
    (COALESCE(custo_fertilizantes, 0) + 
     COALESCE(custo_defensivos, 0) + 
     COALESCE(custo_sementes, 0) + 
     COALESCE(custo_combustivel, 0) + 
     COALESCE(custo_mao_obra, 0) + 
     COALESCE(custo_maquinario, 0) + 
     COALESCE(custo_outros, 0))
  ) STORED,
  margem_ebitda DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE 
      WHEN (area_plantada * produtividade * preco_unitario) = 0 THEN 0
      ELSE (
        ((area_plantada * produtividade * preco_unitario) - 
         (COALESCE(custo_fertilizantes, 0) + 
          COALESCE(custo_defensivos, 0) + 
          COALESCE(custo_sementes, 0) + 
          COALESCE(custo_combustivel, 0) + 
          COALESCE(custo_mao_obra, 0) + 
          COALESCE(custo_maquinario, 0) + 
          COALESCE(custo_outros, 0))) / 
        (area_plantada * produtividade * preco_unitario) * 100
      )
    END
  ) STORED,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uk_projecao_cultura_periodo UNIQUE(projecao_config_id, cultura_id, sistema_id, periodo)
);

-- Tabela de projeções de dívidas
CREATE TABLE public.projecoes_dividas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  projecao_config_id UUID NOT NULL REFERENCES public.projecoes_config(id) ON DELETE CASCADE,
  categoria VARCHAR(100) NOT NULL, -- BANCOS, TERRAS, ARRENDAMENTO, FORNECEDORES, TRADINGS, OUTROS
  subcategoria VARCHAR(100), -- Permite categorizar melhor (ex: Banco do Brasil, Itaú)
  ano INT NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  moeda moeda_tipo NOT NULL DEFAULT 'BRL',
  taxa_juros DECIMAL(6, 2), -- Taxa de juros anual se aplicável
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uk_projecao_divida_categoria_ano UNIQUE(projecao_config_id, categoria, subcategoria, ano)
);

-- Tabela de projeções de caixa e disponibilidades
CREATE TABLE public.projecoes_caixa_disponibilidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  projecao_config_id UUID NOT NULL REFERENCES public.projecoes_config(id) ON DELETE CASCADE,
  ano INT NOT NULL,
  
  -- Disponibilidades
  caixa_bancos DECIMAL(15, 2) NOT NULL DEFAULT 0,
  aplicacoes_financeiras DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Direitos realizáveis
  clientes DECIMAL(15, 2) NOT NULL DEFAULT 0,
  adiantamentos_fornecedores DECIMAL(15, 2) NOT NULL DEFAULT 0,
  emprestimos_a_terceiros DECIMAL(15, 2) NOT NULL DEFAULT 0,
  contratos_recebiveis DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Estoques
  estoque_defensivos DECIMAL(15, 2) NOT NULL DEFAULT 0,
  estoque_fertilizantes DECIMAL(15, 2) NOT NULL DEFAULT 0,
  estoque_sementes DECIMAL(15, 2) NOT NULL DEFAULT 0,
  estoque_almoxarifado DECIMAL(15, 2) NOT NULL DEFAULT 0,
  estoque_combustiveis DECIMAL(15, 2) NOT NULL DEFAULT 0,
  estoque_commodities DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Ativos biológicos
  rebanho DECIMAL(15, 2) NOT NULL DEFAULT 0,
  culturas_permanentes DECIMAL(15, 2) NOT NULL DEFAULT 0,
  ativo_biologico_outros DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Campos calculados
  total_disponibilidades DECIMAL(15, 2) GENERATED ALWAYS AS (
    caixa_bancos + aplicacoes_financeiras
  ) STORED,
  total_direitos_realizaveis DECIMAL(15, 2) GENERATED ALWAYS AS (
    clientes + adiantamentos_fornecedores + emprestimos_a_terceiros + contratos_recebiveis
  ) STORED,
  total_estoques DECIMAL(15, 2) GENERATED ALWAYS AS (
    estoque_defensivos + estoque_fertilizantes + estoque_sementes + 
    estoque_almoxarifado + estoque_combustiveis + estoque_commodities
  ) STORED,
  total_ativo_biologico DECIMAL(15, 2) GENERATED ALWAYS AS (
    rebanho + culturas_permanentes + ativo_biologico_outros
  ) STORED,
  total_geral DECIMAL(15, 2) GENERATED ALWAYS AS (
    caixa_bancos + aplicacoes_financeiras + clientes + 
    adiantamentos_fornecedores + emprestimos_a_terceiros + contratos_recebiveis +
    estoque_defensivos + estoque_fertilizantes + estoque_sementes + 
    estoque_almoxarifado + estoque_combustiveis + estoque_commodities +
    rebanho + culturas_permanentes + ativo_biologico_outros
  ) STORED,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uk_projecao_caixa_ano UNIQUE(projecao_config_id, ano)
);

-- Tabela de projeções de fluxo de caixa
CREATE TABLE public.projecoes_fluxo_caixa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  projecao_config_id UUID NOT NULL REFERENCES public.projecoes_config(id) ON DELETE CASCADE,
  ano INT NOT NULL,
  
  -- Receitas Operacionais
  receitas_agricolas DECIMAL(15, 2) NOT NULL DEFAULT 0,
  receitas_pecuarias DECIMAL(15, 2) NOT NULL DEFAULT 0,
  receitas_servicos DECIMAL(15, 2) NOT NULL DEFAULT 0,
  receitas_vendas_ativos DECIMAL(15, 2) NOT NULL DEFAULT 0,
  outras_receitas DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Despesas Operacionais
  despesas_agricolas DECIMAL(15, 2) NOT NULL DEFAULT 0,
  despesas_pecuarias DECIMAL(15, 2) NOT NULL DEFAULT 0,
  despesas_administrativas DECIMAL(15, 2) NOT NULL DEFAULT 0,
  despesas_comerciais DECIMAL(15, 2) NOT NULL DEFAULT 0,
  arrendamentos DECIMAL(15, 2) NOT NULL DEFAULT 0,
  pro_labore DECIMAL(15, 2) NOT NULL DEFAULT 0,
  outras_despesas DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Investimentos
  investimento_maquinario DECIMAL(15, 2) NOT NULL DEFAULT 0,
  investimento_equipamentos DECIMAL(15, 2) NOT NULL DEFAULT 0,
  investimento_benfeitorias DECIMAL(15, 2) NOT NULL DEFAULT 0,
  investimento_terras DECIMAL(15, 2) NOT NULL DEFAULT 0,
  investimento_tecnologia DECIMAL(15, 2) NOT NULL DEFAULT 0,
  outros_investimentos DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Custos Financeiros
  servico_divida_bancos DECIMAL(15, 2) NOT NULL DEFAULT 0,
  servico_divida_tradings DECIMAL(15, 2) NOT NULL DEFAULT 0,
  servico_divida_fornecedores DECIMAL(15, 2) NOT NULL DEFAULT 0,
  juros_emprestimos DECIMAL(15, 2) NOT NULL DEFAULT 0,
  taxas_bancarias DECIMAL(15, 2) NOT NULL DEFAULT 0,
  outros_custos_financeiros DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Captações/Refinanciamentos
  novas_captacoes DECIMAL(15, 2) NOT NULL DEFAULT 0,
  refinanciamentos DECIMAL(15, 2) NOT NULL DEFAULT 0,
  aportes_capital DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Campos calculados
  total_receitas DECIMAL(15, 2) GENERATED ALWAYS AS (
    receitas_agricolas + receitas_pecuarias + receitas_servicos + 
    receitas_vendas_ativos + outras_receitas
  ) STORED,
  total_despesas_operacionais DECIMAL(15, 2) GENERATED ALWAYS AS (
    despesas_agricolas + despesas_pecuarias + despesas_administrativas + 
    despesas_comerciais + arrendamentos + pro_labore + outras_despesas
  ) STORED,
  total_investimentos DECIMAL(15, 2) GENERATED ALWAYS AS (
    investimento_maquinario + investimento_equipamentos + investimento_benfeitorias +
    investimento_terras + investimento_tecnologia + outros_investimentos
  ) STORED,
  total_custos_financeiros DECIMAL(15, 2) GENERATED ALWAYS AS (
    servico_divida_bancos + servico_divida_tradings + servico_divida_fornecedores +
    juros_emprestimos + taxas_bancarias + outros_custos_financeiros
  ) STORED,
  total_captacoes DECIMAL(15, 2) GENERATED ALWAYS AS (
    novas_captacoes + refinanciamentos + aportes_capital
  ) STORED,
  fluxo_caixa_operacional DECIMAL(15, 2) GENERATED ALWAYS AS (
    (receitas_agricolas + receitas_pecuarias + receitas_servicos + 
     receitas_vendas_ativos + outras_receitas) - 
    (despesas_agricolas + despesas_pecuarias + despesas_administrativas + 
     despesas_comerciais + arrendamentos + pro_labore + outras_despesas)
  ) STORED,
  fluxo_caixa_livre DECIMAL(15, 2) GENERATED ALWAYS AS (
    (receitas_agricolas + receitas_pecuarias + receitas_servicos + 
     receitas_vendas_ativos + outras_receitas) - 
    (despesas_agricolas + despesas_pecuarias + despesas_administrativas + 
     despesas_comerciais + arrendamentos + pro_labore + outras_despesas) -
    (investimento_maquinario + investimento_equipamentos + investimento_benfeitorias +
     investimento_terras + investimento_tecnologia + outros_investimentos) -
    (servico_divida_bancos + servico_divida_tradings + servico_divida_fornecedores +
     juros_emprestimos + taxas_bancarias + outros_custos_financeiros) +
    (novas_captacoes + refinanciamentos + aportes_capital)
  ) STORED,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uk_projecao_fluxo_caixa_ano UNIQUE(projecao_config_id, ano)
);

-- Tabela de cenários de projeção
CREATE TABLE public.projecoes_cenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  projecao_config_id UUID NOT NULL REFERENCES public.projecoes_config(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  eh_cenario_base BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Parâmetros de ajuste
  fator_preco_soja DECIMAL(5, 4) NOT NULL DEFAULT 1.0000,
  fator_preco_milho DECIMAL(5, 4) NOT NULL DEFAULT 1.0000,
  fator_preco_algodao DECIMAL(5, 4) NOT NULL DEFAULT 1.0000,
  fator_produtividade DECIMAL(5, 4) NOT NULL DEFAULT 1.0000,
  fator_custo_insumos DECIMAL(5, 4) NOT NULL DEFAULT 1.0000,
  fator_cambio DECIMAL(5, 4) NOT NULL DEFAULT 1.0000,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uk_projecao_cenario_nome UNIQUE(projecao_config_id, nome)
);

-- Tabela de relatórios consolidados
CREATE TABLE public.projecoes_relatorios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  projecao_config_id UUID NOT NULL REFERENCES public.projecoes_config(id) ON DELETE CASCADE,
  cenario_id UUID REFERENCES public.projecoes_cenarios(id) ON DELETE CASCADE,
  tipo_relatorio VARCHAR(50) NOT NULL, -- DRE, BALANCO, FLUXO_CAIXA, INDICADORES
  periodo_inicio INT NOT NULL,
  periodo_fim INT NOT NULL,
  dados_consolidados JSONB NOT NULL,
  gerado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  gerado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TAMBÉM ADICIONAR aos índices (seção de índices):

-- Índices para projecoes_config
CREATE INDEX idx_projecoes_config_organizacao_id ON public.projecoes_config(organizacao_id);
CREATE INDEX idx_projecoes_config_status ON public.projecoes_config(status);
CREATE INDEX idx_projecoes_config_periodo ON public.projecoes_config(periodo_inicio, periodo_fim);

-- Substituir os índices antigos de projeções por:
CREATE INDEX idx_projecoes_culturas_config_id ON public.projecoes_culturas(projecao_config_id);
CREATE INDEX idx_projecoes_culturas_cultura_sistema ON public.projecoes_culturas(cultura_id, sistema_id);
CREATE INDEX idx_projecoes_culturas_periodo ON public.projecoes_culturas(periodo);
CREATE INDEX idx_projecoes_culturas_receita_bruta ON public.projecoes_culturas(receita_bruta);
CREATE INDEX idx_projecoes_culturas_ebitda ON public.projecoes_culturas(ebitda);

CREATE INDEX idx_projecoes_dividas_config_id ON public.projecoes_dividas(projecao_config_id);
CREATE INDEX idx_projecoes_dividas_categoria ON public.projecoes_dividas(categoria);
CREATE INDEX idx_projecoes_dividas_ano_valor ON public.projecoes_dividas(ano, valor);

CREATE INDEX idx_projecoes_caixa_config_id ON public.projecoes_caixa_disponibilidades(projecao_config_id);
CREATE INDEX idx_projecoes_caixa_total_geral ON public.projecoes_caixa_disponibilidades(total_geral);

CREATE INDEX idx_projecoes_fluxo_config_id ON public.projecoes_fluxo_caixa(projecao_config_id);
CREATE INDEX idx_projecoes_fluxo_livre ON public.projecoes_fluxo_caixa(fluxo_caixa_livre);

CREATE INDEX idx_projecoes_cenarios_config_id ON public.projecoes_cenarios(projecao_config_id);
CREATE INDEX idx_projecoes_relatorios_config_id ON public.projecoes_relatorios(projecao_config_id);
CREATE INDEX idx_projecoes_relatorios_tipo ON public.projecoes_relatorios(tipo_relatorio);

-- TAMBÉM ADICIONAR aos triggers (seção de triggers):

CREATE TRIGGER update_timestamp_projecoes_config
BEFORE UPDATE ON public.projecoes_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Substituir os triggers antigos por:
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

CREATE TRIGGER update_timestamp_projecoes_cenarios
BEFORE UPDATE ON public.projecoes_cenarios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timestamp_projecoes_relatorios
BEFORE UPDATE ON public.projecoes_relatorios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers de auditoria:
CREATE TRIGGER audit_changes_projecoes_config
AFTER INSERT OR UPDATE OR DELETE ON public.projecoes_config
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

CREATE TRIGGER audit_changes_projecoes_cenarios
AFTER INSERT OR UPDATE OR DELETE ON public.projecoes_cenarios
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();

CREATE TRIGGER audit_changes_projecoes_relatorios
AFTER INSERT OR UPDATE OR DELETE ON public.projecoes_relatorios
FOR EACH ROW EXECUTE FUNCTION public.audit_changes();