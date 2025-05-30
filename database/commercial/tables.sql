-- =============================================================================
-- COMMERCIAL MODULE - TABLES
-- =============================================================================
-- This file contains all table definitions for the commercial module
-- Includes livestock sales (vendas_pecuaria) and seed sales (vendas_sementes)
-- =============================================================================

-- =============================================================================
-- LIVESTOCK SALES TABLE (VENDAS_PECUARIA)
-- =============================================================================

-- Livestock sales table with safra_id and propriedade_id integration
CREATE TABLE IF NOT EXISTS vendas_pecuaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    
    -- Financial details
    receita_operacional_bruta DECIMAL(15, 2) NOT NULL,
    impostos_vendas DECIMAL(15, 2) DEFAULT 0,
    comissao_vendas DECIMAL(15, 2) DEFAULT 0,
    logistica_entregas DECIMAL(15, 2) DEFAULT 0,
    custo_mercadorias_vendidas DECIMAL(15, 2) DEFAULT 0,
    despesas_gerais DECIMAL(15, 2) DEFAULT 0,
    imposto_renda DECIMAL(15, 2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_receita_bruta_positive CHECK (receita_operacional_bruta > 0),
    CONSTRAINT chk_impostos_vendas_non_negative CHECK (impostos_vendas >= 0),
    CONSTRAINT chk_comissao_vendas_non_negative CHECK (comissao_vendas >= 0),
    CONSTRAINT chk_logistica_entregas_non_negative CHECK (logistica_entregas >= 0),
    CONSTRAINT chk_custo_mercadorias_non_negative CHECK (custo_mercadorias_vendidas >= 0),
    CONSTRAINT chk_despesas_gerais_non_negative CHECK (despesas_gerais >= 0),
    CONSTRAINT chk_imposto_renda_non_negative CHECK (imposto_renda >= 0)
);

-- =============================================================================
-- SEED SALES TABLE (VENDAS_SEMENTES)
-- =============================================================================

-- Seed sales table with safra_id, propriedade_id and cultura_id integration
CREATE TABLE IF NOT EXISTS vendas_sementes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    cultura_id UUID NOT NULL REFERENCES culturas(id) ON DELETE RESTRICT,
    
    -- Financial details
    receita_operacional_bruta DECIMAL(15, 2) NOT NULL,
    impostos_vendas DECIMAL(15, 2) DEFAULT 0,
    comissao_vendas DECIMAL(15, 2) DEFAULT 0,
    logistica_entregas DECIMAL(15, 2) DEFAULT 0,
    custo_mercadorias_vendidas DECIMAL(15, 2) DEFAULT 0,
    despesas_gerais DECIMAL(15, 2) DEFAULT 0,
    imposto_renda DECIMAL(15, 2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_sementes_receita_bruta_positive CHECK (receita_operacional_bruta > 0),
    CONSTRAINT chk_sementes_impostos_vendas_non_negative CHECK (impostos_vendas >= 0),
    CONSTRAINT chk_sementes_comissao_vendas_non_negative CHECK (comissao_vendas >= 0),
    CONSTRAINT chk_sementes_logistica_entregas_non_negative CHECK (logistica_entregas >= 0),
    CONSTRAINT chk_sementes_custo_mercadorias_non_negative CHECK (custo_mercadorias_vendidas >= 0),
    CONSTRAINT chk_sementes_despesas_gerais_non_negative CHECK (despesas_gerais >= 0),
    CONSTRAINT chk_sementes_imposto_renda_non_negative CHECK (imposto_renda >= 0)
);

-- =============================================================================
-- COMMERCIAL PRICES TABLE (PRECOS_COMERCIAIS)
-- =============================================================================

-- Table for storing commercial prices by safra and culture (optional enhancement)
CREATE TABLE IF NOT EXISTS precos_comerciais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    cultura_id UUID REFERENCES culturas(id) ON DELETE RESTRICT, -- NULL for livestock
    
    -- Price details
    tipo_produto TEXT NOT NULL, -- 'SEMENTES', 'PECUARIA', 'COMMODITIES'
    descricao_produto TEXT NOT NULL,
    preco_unitario DECIMAL(15, 4) NOT NULL,
    unidade TEXT NOT NULL, -- 'KG', 'SACA', 'CABEÇA', 'TON', etc.
    
    -- Market reference
    mercado_referencia TEXT,
    data_cotacao DATE DEFAULT now(),
    
    -- Status
    ativo BOOLEAN NOT NULL DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_preco_unitario_positive CHECK (preco_unitario > 0),
    CONSTRAINT chk_data_cotacao_valid CHECK (data_cotacao <= now()::DATE),
    CONSTRAINT uk_precos_comerciais_org_safra_produto UNIQUE(organizacao_id, safra_id, tipo_produto, descricao_produto)
);

-- =============================================================================
-- SALES PLANNING TABLE (PLANEJAMENTO_VENDAS)
-- =============================================================================

-- Table for sales planning and forecasting (optional enhancement)
CREATE TABLE IF NOT EXISTS planejamento_vendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    propriedade_id UUID REFERENCES propriedades(id) ON DELETE CASCADE,
    cultura_id UUID REFERENCES culturas(id) ON DELETE RESTRICT, -- NULL for livestock
    
    -- Planning details
    tipo_venda TEXT NOT NULL, -- 'SEMENTES', 'PECUARIA'
    volume_planejado DECIMAL(15, 4) NOT NULL,
    unidade TEXT NOT NULL,
    preco_esperado DECIMAL(15, 4) NOT NULL,
    receita_esperada DECIMAL(15, 2) NOT NULL,
    
    -- Timing
    periodo_venda periodo_venda NOT NULL DEFAULT 'PRIMEIRA_SAFRA',
    data_planejada DATE,
    
    -- Status
    status status_venda NOT NULL DEFAULT 'PLANEJADA',
    observacoes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_volume_planejado_positive CHECK (volume_planejado > 0),
    CONSTRAINT chk_preco_esperado_positive CHECK (preco_esperado > 0),
    CONSTRAINT chk_receita_esperada_positive CHECK (receita_esperada > 0),
    CONSTRAINT chk_receita_volume_consistent CHECK (ABS(receita_esperada - (volume_planejado * preco_esperado)) < 0.01)
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

-- Table comments
COMMENT ON TABLE vendas_pecuaria IS 'Vendas de pecuária por propriedade e safra';
COMMENT ON TABLE vendas_sementes IS 'Vendas de sementes por propriedade, safra e cultura';
COMMENT ON TABLE precos_comerciais IS 'Preços comerciais de referência por safra e produto';
COMMENT ON TABLE planejamento_vendas IS 'Planejamento e projeções de vendas';

-- Column comments for vendas_pecuaria
COMMENT ON COLUMN vendas_pecuaria.receita_operacional_bruta IS 'Receita bruta total das vendas de pecuária';
COMMENT ON COLUMN vendas_pecuaria.propriedade_id IS 'Propriedade onde ocorreu a venda';
COMMENT ON COLUMN vendas_pecuaria.safra_id IS 'Safra relacionada à venda';
COMMENT ON COLUMN vendas_pecuaria.impostos_vendas IS 'Impostos incidentes sobre as vendas';
COMMENT ON COLUMN vendas_pecuaria.comissao_vendas IS 'Comissões pagas sobre as vendas';
COMMENT ON COLUMN vendas_pecuaria.logistica_entregas IS 'Custos de logística e entregas';
COMMENT ON COLUMN vendas_pecuaria.custo_mercadorias_vendidas IS 'Custo direto das mercadorias vendidas';
COMMENT ON COLUMN vendas_pecuaria.despesas_gerais IS 'Despesas gerais relacionadas às vendas';
COMMENT ON COLUMN vendas_pecuaria.imposto_renda IS 'Imposto de renda sobre as vendas';

-- Column comments for vendas_sementes
COMMENT ON COLUMN vendas_sementes.receita_operacional_bruta IS 'Receita bruta total das vendas de sementes';
COMMENT ON COLUMN vendas_sementes.propriedade_id IS 'Propriedade onde ocorreu a venda';
COMMENT ON COLUMN vendas_sementes.safra_id IS 'Safra relacionada à venda';
COMMENT ON COLUMN vendas_sementes.cultura_id IS 'Cultura das sementes vendidas';
COMMENT ON COLUMN vendas_sementes.impostos_vendas IS 'Impostos incidentes sobre as vendas';
COMMENT ON COLUMN vendas_sementes.comissao_vendas IS 'Comissões pagas sobre as vendas';
COMMENT ON COLUMN vendas_sementes.logistica_entregas IS 'Custos de logística e entregas';
COMMENT ON COLUMN vendas_sementes.custo_mercadorias_vendidas IS 'Custo direto das mercadorias vendidas';
COMMENT ON COLUMN vendas_sementes.despesas_gerais IS 'Despesas gerais relacionadas às vendas';
COMMENT ON COLUMN vendas_sementes.imposto_renda IS 'Imposto de renda sobre as vendas';

-- Column comments for precos_comerciais
COMMENT ON COLUMN precos_comerciais.tipo_produto IS 'Tipo do produto (SEMENTES, PECUARIA, COMMODITIES)';
COMMENT ON COLUMN precos_comerciais.preco_unitario IS 'Preço unitário do produto';
COMMENT ON COLUMN precos_comerciais.unidade IS 'Unidade de medida (KG, SACA, CABEÇA, TON, etc.)';
COMMENT ON COLUMN precos_comerciais.mercado_referencia IS 'Mercado ou bolsa de referência para o preço';

-- Column comments for planejamento_vendas
COMMENT ON COLUMN planejamento_vendas.tipo_venda IS 'Tipo de venda planejada (SEMENTES, PECUARIA)';
COMMENT ON COLUMN planejamento_vendas.volume_planejado IS 'Volume planejado para venda';
COMMENT ON COLUMN planejamento_vendas.preco_esperado IS 'Preço esperado por unidade';
COMMENT ON COLUMN planejamento_vendas.receita_esperada IS 'Receita total esperada (volume × preço)';
COMMENT ON COLUMN planejamento_vendas.periodo_venda IS 'Período planejado para a venda';
COMMENT ON COLUMN planejamento_vendas.status IS 'Status atual do planejamento';