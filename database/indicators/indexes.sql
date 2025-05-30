-- =============================================================================
-- INDICATORS MODULE - INDEXES
-- =============================================================================
-- This file contains all indexes for the indicators module tables
-- Optimized for multi-tenant queries and JSONB operations
-- =============================================================================

-- =============================================================================
-- COMMODITY PRICE PROJECTIONS INDEXES
-- =============================================================================

-- Primary organizational and safra filtering
CREATE INDEX IF NOT EXISTS idx_commodity_projections_org 
    ON commodity_price_projections(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_commodity_projections_safra 
    ON commodity_price_projections(safra_id);

CREATE INDEX IF NOT EXISTS idx_commodity_projections_org_safra 
    ON commodity_price_projections(organizacao_id, safra_id);

-- Commodity type filtering
CREATE INDEX IF NOT EXISTS idx_commodity_projections_type 
    ON commodity_price_projections(commodity_type);

CREATE INDEX IF NOT EXISTS idx_commodity_projections_org_type 
    ON commodity_price_projections(organizacao_id, commodity_type);

-- JSONB indexes for efficient price queries
CREATE INDEX IF NOT EXISTS idx_commodity_projections_precos_gin 
    ON commodity_price_projections USING GIN (precos_por_ano);

-- Unit filtering
CREATE INDEX IF NOT EXISTS idx_commodity_projections_unit 
    ON commodity_price_projections(unit);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_commodity_projections_org_safra_type 
    ON commodity_price_projections(organizacao_id, safra_id, commodity_type);

-- Timestamp indexes for temporal queries
CREATE INDEX IF NOT EXISTS idx_commodity_projections_created_at 
    ON commodity_price_projections(created_at);

CREATE INDEX IF NOT EXISTS idx_commodity_projections_updated_at 
    ON commodity_price_projections(updated_at);

-- =============================================================================
-- COMMODITY PRICE PROJECTIONS ANOS (NORMALIZED) INDEXES
-- =============================================================================

-- Primary organizational filtering
CREATE INDEX IF NOT EXISTS idx_commodity_projections_anos_org 
    ON commodity_price_projections_anos(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_commodity_projections_anos_safra 
    ON commodity_price_projections_anos(safra_id);

-- Year-based filtering
CREATE INDEX IF NOT EXISTS idx_commodity_projections_anos_ano 
    ON commodity_price_projections_anos(ano);

CREATE INDEX IF NOT EXISTS idx_commodity_projections_anos_org_ano 
    ON commodity_price_projections_anos(organizacao_id, ano);

-- Commodity type filtering
CREATE INDEX IF NOT EXISTS idx_commodity_projections_anos_type 
    ON commodity_price_projections_anos(commodity_type);

-- Price range queries
CREATE INDEX IF NOT EXISTS idx_commodity_projections_anos_preco 
    ON commodity_price_projections_anos(preco);

-- Composite indexes for efficient range queries
CREATE INDEX IF NOT EXISTS idx_commodity_projections_anos_org_type_ano 
    ON commodity_price_projections_anos(organizacao_id, commodity_type, ano);

-- Foreign key optimization
CREATE INDEX IF NOT EXISTS idx_commodity_projections_anos_projection_id 
    ON commodity_price_projections_anos(commodity_projection_id);

-- =============================================================================
-- CONFIGURACAO INDICADORES INDEXES
-- =============================================================================

-- Primary organizational filtering
CREATE INDEX IF NOT EXISTS idx_config_indicadores_org 
    ON configuracao_indicadores(organizacao_id);

-- JSONB indexes for threshold queries
CREATE INDEX IF NOT EXISTS idx_config_indicadores_liquidez_gin 
    ON configuracao_indicadores USING GIN (limiares_liquidez);

CREATE INDEX IF NOT EXISTS idx_config_indicadores_divida_ebitda_gin 
    ON configuracao_indicadores USING GIN (limiares_divida_ebitda);

CREATE INDEX IF NOT EXISTS idx_config_indicadores_divida_receita_gin 
    ON configuracao_indicadores USING GIN (limiares_divida_receita);

CREATE INDEX IF NOT EXISTS idx_config_indicadores_divida_patrimonio_gin 
    ON configuracao_indicadores USING GIN (limiares_divida_patrimonio);

CREATE INDEX IF NOT EXISTS idx_config_indicadores_ltv_gin 
    ON configuracao_indicadores USING GIN (limiares_ltv);

-- =============================================================================
-- PARAMETROS SENSIBILIDADE INDEXES
-- =============================================================================

-- Primary filtering
CREATE INDEX IF NOT EXISTS idx_parametros_sensibilidade_org 
    ON parametros_sensibilidade(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_parametros_sensibilidade_safra 
    ON parametros_sensibilidade(safra_id);

CREATE INDEX IF NOT EXISTS idx_parametros_sensibilidade_org_safra 
    ON parametros_sensibilidade(organizacao_id, safra_id);

-- JSONB indexes for variation analysis
CREATE INDEX IF NOT EXISTS idx_parametros_sensibilidade_cambio_gin 
    ON parametros_sensibilidade USING GIN (variacoes_cambio);

CREATE INDEX IF NOT EXISTS idx_parametros_sensibilidade_precos_gin 
    ON parametros_sensibilidade USING GIN (variacoes_precos_commodities);

CREATE INDEX IF NOT EXISTS idx_parametros_sensibilidade_produtividade_gin 
    ON parametros_sensibilidade USING GIN (variacoes_produtividade);


-- =============================================================================
-- COMPOSITE MULTI-TABLE INDEXES
-- =============================================================================

-- Cross-module indexes for common join patterns
-- These will be created only if the referenced tables exist

-- Commodity projections with safras
CREATE INDEX IF NOT EXISTS idx_commodity_projections_safra_lookup 
    ON commodity_price_projections(safra_id, organizacao_id, commodity_type);

-- Normalized table for time series analysis
CREATE INDEX IF NOT EXISTS idx_commodity_anos_time_series 
    ON commodity_price_projections_anos(organizacao_id, commodity_type, ano, preco);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON INDEX idx_commodity_projections_precos_gin IS 'GIN index para consultas eficientes em preços JSONB';
COMMENT ON INDEX idx_commodity_projections_org_safra_type IS 'Índice composto para consultas por organização, safra e tipo de commodity';
COMMENT ON INDEX idx_commodity_anos_time_series IS 'Índice otimizado para análises de séries temporais de preços';