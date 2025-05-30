-- =============================================================================
-- PATRIMONIO MODULE - TABLES
-- =============================================================================
-- This file contains all table definitions for the patrimonio module
-- Adding safra_id integration to all tables except equipment
-- =============================================================================

-- =============================================================================
-- LAND ACQUISITION TABLE (AQUISICAO_TERRAS)
-- =============================================================================

-- Land acquisition table with safra_id integration
CREATE TABLE IF NOT EXISTS aquisicao_terras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    
    -- Land acquisition details
    nome_fazenda TEXT NOT NULL,
    ano INTEGER NOT NULL,
    hectares DECIMAL(15, 4) NOT NULL,
    sacas DECIMAL(15, 2),
    tipo tipo_aquisicao_terra NOT NULL DEFAULT 'COMPRA',
    total_sacas DECIMAL(15, 2),
    valor_total DECIMAL(15, 2),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_hectares_positive CHECK (hectares > 0),
    CONSTRAINT chk_sacas_positive CHECK (sacas IS NULL OR sacas > 0),
    CONSTRAINT chk_total_sacas_positive CHECK (total_sacas IS NULL OR total_sacas > 0),
    CONSTRAINT chk_valor_total_positive CHECK (valor_total IS NULL OR valor_total > 0),
    CONSTRAINT chk_ano_valid CHECK (ano >= 1900 AND ano <= EXTRACT(YEAR FROM now()) + 10)
);

-- =============================================================================
-- INVESTMENTS TABLE (INVESTIMENTOS)
-- =============================================================================

-- Investments table with safra_id integration
CREATE TABLE IF NOT EXISTS investimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    categoria categoria_investimento NOT NULL,
    ano INTEGER NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(15, 2) NOT NULL,
    valor_total DECIMAL(15, 2) NOT NULL,
    tipo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_quantidade_positive CHECK (quantidade > 0),
    CONSTRAINT chk_valor_unitario_positive CHECK (valor_unitario > 0),
    CONSTRAINT chk_valor_total_positive CHECK (valor_total > 0),
    CONSTRAINT chk_ano_investimento_valid CHECK (ano >= 1900 AND ano <= EXTRACT(YEAR FROM now()) + 10),
    CONSTRAINT chk_valor_total_consistent CHECK (ABS(valor_total - (valor_unitario * quantidade)) < 0.01)
);

-- =============================================================================
-- ASSET SALES TABLE (VENDAS_ATIVOS)
-- =============================================================================

-- Asset sales table with safra_id integration
CREATE TABLE IF NOT EXISTS vendas_ativos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    
    -- Asset sale details
    categoria categoria_venda_ativo NOT NULL,
    ano INTEGER NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(15, 2) NOT NULL,
    valor_total DECIMAL(15, 2) NOT NULL,
    
    -- Additional details
    descricao TEXT,
    data_venda DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_venda_quantidade_positive CHECK (quantidade > 0),
    CONSTRAINT chk_venda_valor_unitario_positive CHECK (valor_unitario > 0),
    CONSTRAINT chk_venda_valor_total_positive CHECK (valor_total > 0),
    CONSTRAINT chk_venda_ano_valid CHECK (ano >= 1900 AND ano <= EXTRACT(YEAR FROM now()) + 10),
    CONSTRAINT chk_venda_valor_total_consistent CHECK (ABS(valor_total - (valor_unitario * quantidade)) < 0.01),
    CONSTRAINT chk_data_venda_valid CHECK (data_venda IS NULL OR data_venda <= now()::DATE)
);

-- =============================================================================
-- EQUIPMENT TABLE (MAQUINAS_EQUIPAMENTOS)
-- =============================================================================

-- Equipment table WITHOUT safra_id (as requested)
CREATE TABLE IF NOT EXISTS maquinas_equipamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    
    -- Equipment details
    descricao TEXT NOT NULL,
    ano INTEGER NOT NULL,
    marca TEXT,
    modelo TEXT,
    alienado BOOLEAN NOT NULL DEFAULT false,
    numero_chassi TEXT,
    valor_aquisicao DECIMAL(15, 2),
    numero_serie TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_equipamento_ano_valid CHECK (ano >= 1900 AND ano <= EXTRACT(YEAR FROM now()) + 10),
    CONSTRAINT chk_equipamento_valor_positive CHECK (valor_aquisicao IS NULL OR valor_aquisicao > 0)
);

-- =============================================================================
-- INVESTMENT PLANS TABLE (PLANOS_INVESTIMENTO)
-- =============================================================================


-- =============================================================================
-- COMMENTS
-- =============================================================================

-- Table comments
COMMENT ON TABLE aquisicao_terras IS 'Registro de aquisições de terras por safra';
COMMENT ON TABLE investimentos IS 'Registro de investimentos realizados por safra';
COMMENT ON TABLE vendas_ativos IS 'Registro de vendas de ativos por safra';
COMMENT ON TABLE maquinas_equipamentos IS 'Cadastro de máquinas e equipamentos (sem vínculo com safra)';

-- Column comments for aquisicao_terras
COMMENT ON COLUMN aquisicao_terras.safra_id IS 'Referência à safra relacionada à aquisição de terras';
COMMENT ON COLUMN aquisicao_terras.nome_fazenda IS 'Nome da fazenda ou propriedade adquirida';
COMMENT ON COLUMN aquisicao_terras.hectares IS 'Área adquirida em hectares';
COMMENT ON COLUMN aquisicao_terras.sacas IS 'Valor em sacas por hectare';
COMMENT ON COLUMN aquisicao_terras.total_sacas IS 'Valor total em sacas';
COMMENT ON COLUMN aquisicao_terras.tipo IS 'Tipo de aquisição (COMPRA, ARRENDAMENTO_LONGO_PRAZO, etc.)';

-- Column comments for investimentos
COMMENT ON COLUMN investimentos.safra_id IS 'Referência à safra relacionada ao investimento';
COMMENT ON COLUMN investimentos.categoria IS 'Categoria do investimento (EQUIPAMENTO, BENFEITORIA, etc.)';
COMMENT ON COLUMN investimentos.valor_total IS 'Valor total do investimento (quantidade × valor unitário)';

-- Column comments for vendas_ativos
COMMENT ON COLUMN vendas_ativos.safra_id IS 'Referência à safra relacionada à venda do ativo';
COMMENT ON COLUMN vendas_ativos.categoria IS 'Categoria do ativo vendido';
COMMENT ON COLUMN vendas_ativos.data_venda IS 'Data efetiva da venda do ativo';

-- Column comments for maquinas_equipamentos
COMMENT ON COLUMN maquinas_equipamentos.descricao IS 'Descrição detalhada do equipamento';
COMMENT ON COLUMN maquinas_equipamentos.alienado IS 'Indica se o equipamento está alienado/financiado';
