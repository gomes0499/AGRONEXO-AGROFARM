-- =============================================================================
-- INDICATORS MODULE - TABLES
-- =============================================================================
-- This file contains all table definitions for the indicators module
-- Using JSONB for multi-year price projections with safra_id integration
-- =============================================================================

-- =============================================================================
-- COMMODITY PRICE PROJECTIONS TABLE (JSONB STRUCTURE)
-- =============================================================================

-- Main table with JSONB structure for multi-year price storage
CREATE TABLE IF NOT EXISTS commodity_price_projections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    
    -- Commodity identification
    commodity_type tipo_commodity NOT NULL,
    unit unidade_preco_commodity NOT NULL DEFAULT 'R$/SACA',
    
    -- Current price (base price for projections)
    current_price DECIMAL(15, 4) NOT NULL,
    
    -- Multi-year price projections as JSONB
    -- Structure: {"2025": 75.50, "2026": 78.00, "2027": 82.50, ...}
    precos_por_ano JSONB NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT uk_commodity_projections_org_safra_type UNIQUE(organizacao_id, safra_id, commodity_type),
    CONSTRAINT chk_precos_por_ano_not_empty CHECK (jsonb_typeof(precos_por_ano) = 'object' AND precos_por_ano != '{}'),
    CONSTRAINT chk_current_price_positive CHECK (current_price > 0)
);


-- =============================================================================
-- CONFIGURATION TABLE FOR INDICATOR THRESHOLDS
-- =============================================================================

-- Table for storing indicator configuration per organization
CREATE TABLE IF NOT EXISTS configuracao_indicadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    
    -- Liquidity thresholds
    limiares_liquidez JSONB NOT NULL DEFAULT '{"baixo": 0.5, "medio": 1.0, "alto": 2.0}',
    
    -- Debt/EBITDA thresholds
    limiares_divida_ebitda JSONB NOT NULL DEFAULT '{"baixo": 2.0, "medio": 3.5, "alto": 5.0}',
    
    -- Debt/Revenue thresholds
    limiares_divida_receita JSONB NOT NULL DEFAULT '{"baixo": 0.3, "medio": 0.5, "alto": 0.7}',
    
    -- Debt/Equity thresholds
    limiares_divida_patrimonio JSONB NOT NULL DEFAULT '{"baixo": 0.4, "medio": 0.6, "alto": 0.8}',
    
    -- LTV (Loan to Value) thresholds
    limiares_ltv JSONB NOT NULL DEFAULT '{"baixo": 0.5, "medio": 0.7, "alto": 0.85}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT uk_config_indicadores_org UNIQUE(organizacao_id)
);

-- =============================================================================
-- SENSITIVITY PARAMETERS TABLE
-- =============================================================================

-- Table for storing sensitivity analysis parameters
CREATE TABLE IF NOT EXISTS parametros_sensibilidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    
    -- Exchange rate variations (percentage)
    variacoes_cambio JSONB NOT NULL DEFAULT '{"cenario_baixo": -0.15, "cenario_base": 0.0, "cenario_alto": 0.20}',
    
    -- Commodity price variations (percentage)
    variacoes_precos_commodities JSONB NOT NULL DEFAULT '{"cenario_baixo": -0.25, "cenario_base": 0.0, "cenario_alto": 0.30}',
    
    -- Productivity variations (percentage)
    variacoes_produtividade JSONB NOT NULL DEFAULT '{"cenario_baixo": -0.20, "cenario_base": 0.0, "cenario_alto": 0.15}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT uk_parametros_sensibilidade UNIQUE(organizacao_id, safra_id)
);


-- =============================================================================
-- COMMENTS
-- =============================================================================

-- Table comments
COMMENT ON TABLE commodity_price_projections IS 'Projeções de preços de commodities usando estrutura JSONB para múltiplos anos por safra';
COMMENT ON TABLE commodity_price_projections_anos IS 'Tabela normalizada para consultas eficientes de preços por ano específico';
COMMENT ON TABLE configuracao_indicadores IS 'Configurações de limiares para indicadores financeiros por organização';
COMMENT ON TABLE parametros_sensibilidade IS 'Parâmetros para análise de sensibilidade por safra';

-- Column comments for commodity_price_projections
COMMENT ON COLUMN commodity_price_projections.precos_por_ano IS 'Preços projetados por ano em formato JSONB: {"2025": 75.50, "2026": 78.00, ...}';
COMMENT ON COLUMN commodity_price_projections.current_price IS 'Preço atual/base usado como referência para as projeções';
COMMENT ON COLUMN commodity_price_projections.commodity_type IS 'Tipo de commodity (SOJA_SEQUEIRO, MILHO_IRRIGADO, etc.)';
COMMENT ON COLUMN commodity_price_projections.unit IS 'Unidade de medida do preço (R$/SACA, R$/@, etc.)';