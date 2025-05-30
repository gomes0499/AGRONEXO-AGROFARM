-- =============================================================================
-- PATRIMONIO MODULE - INDEXES
-- =============================================================================
-- This file contains all indexes for the patrimonio module tables
-- Optimized for multi-tenant queries and safra-based filtering
-- =============================================================================

-- =============================================================================
-- AQUISICAO TERRAS INDEXES
-- =============================================================================

-- Primary organizational and safra filtering
CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_org 
    ON aquisicao_terras(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_safra 
    ON aquisicao_terras(safra_id);

CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_org_safra 
    ON aquisicao_terras(organizacao_id, safra_id);

-- Year-based filtering
CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_ano 
    ON aquisicao_terras(ano);

CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_org_ano 
    ON aquisicao_terras(organizacao_id, ano);

-- Type filtering
CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_tipo 
    ON aquisicao_terras(tipo);

-- Area and value-based queries
CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_hectares 
    ON aquisicao_terras(hectares);

CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_valor_total 
    ON aquisicao_terras(valor_total);

-- Farm name search
CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_nome_fazenda 
    ON aquisicao_terras(nome_fazenda);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_org_safra_ano 
    ON aquisicao_terras(organizacao_id, safra_id, ano);

-- Timestamp indexes
CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_created_at 
    ON aquisicao_terras(created_at);

-- =============================================================================
-- INVESTIMENTOS INDEXES
-- =============================================================================

-- Primary organizational and safra filtering
CREATE INDEX IF NOT EXISTS idx_investimentos_org 
    ON investimentos(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_investimentos_safra 
    ON investimentos(safra_id);

CREATE INDEX IF NOT EXISTS idx_investimentos_org_safra 
    ON investimentos(organizacao_id, safra_id);

-- Category filtering
CREATE INDEX IF NOT EXISTS idx_investimentos_categoria 
    ON investimentos(categoria);

CREATE INDEX IF NOT EXISTS idx_investimentos_org_categoria 
    ON investimentos(organizacao_id, categoria);

-- Year-based filtering
CREATE INDEX IF NOT EXISTS idx_investimentos_ano 
    ON investimentos(ano);

CREATE INDEX IF NOT EXISTS idx_investimentos_org_ano 
    ON investimentos(organizacao_id, ano);

-- Value-based queries
CREATE INDEX IF NOT EXISTS idx_investimentos_valor_total 
    ON investimentos(valor_total);

CREATE INDEX IF NOT EXISTS idx_investimentos_valor_unitario 
    ON investimentos(valor_unitario);

-- Quantity filtering
CREATE INDEX IF NOT EXISTS idx_investimentos_quantidade 
    ON investimentos(quantidade);

-- Type filtering (additional specification)
CREATE INDEX IF NOT EXISTS idx_investimentos_tipo 
    ON investimentos(tipo);

-- Composite indexes for analysis
CREATE INDEX IF NOT EXISTS idx_investimentos_org_safra_categoria 
    ON investimentos(organizacao_id, safra_id, categoria);

CREATE INDEX IF NOT EXISTS idx_investimentos_org_categoria_ano 
    ON investimentos(organizacao_id, categoria, ano);

-- =============================================================================
-- VENDAS ATIVOS INDEXES
-- =============================================================================

-- Primary organizational and safra filtering
CREATE INDEX IF NOT EXISTS idx_vendas_ativos_org 
    ON vendas_ativos(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_vendas_ativos_safra 
    ON vendas_ativos(safra_id);

CREATE INDEX IF NOT EXISTS idx_vendas_ativos_org_safra 
    ON vendas_ativos(organizacao_id, safra_id);

-- Category filtering
CREATE INDEX IF NOT EXISTS idx_vendas_ativos_categoria 
    ON vendas_ativos(categoria);

-- Year-based filtering
CREATE INDEX IF NOT EXISTS idx_vendas_ativos_ano 
    ON vendas_ativos(ano);

CREATE INDEX IF NOT EXISTS idx_vendas_ativos_org_ano 
    ON vendas_ativos(organizacao_id, ano);

-- Value-based queries
CREATE INDEX IF NOT EXISTS idx_vendas_ativos_valor_total 
    ON vendas_ativos(valor_total);

-- Sale date filtering
CREATE INDEX IF NOT EXISTS idx_vendas_ativos_data_venda 
    ON vendas_ativos(data_venda);

CREATE INDEX IF NOT EXISTS idx_vendas_ativos_org_data_venda 
    ON vendas_ativos(organizacao_id, data_venda);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_vendas_ativos_org_safra_categoria 
    ON vendas_ativos(organizacao_id, safra_id, categoria);

-- Text search on descriptions
CREATE INDEX IF NOT EXISTS idx_vendas_ativos_descricao_text 
    ON vendas_ativos USING GIN (to_tsvector('portuguese', descricao));

-- =============================================================================
-- MAQUINAS EQUIPAMENTOS INDEXES
-- =============================================================================

-- Primary organizational filtering (no safra_id as requested)
CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_org 
    ON maquinas_equipamentos(organizacao_id);

-- Year filtering
CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_ano 
    ON maquinas_equipamentos(ano);

-- Brand filtering
CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_marca 
    ON maquinas_equipamentos(marca);

-- Alienated status
CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_alienado 
    ON maquinas_equipamentos(alienado);

-- Value-based queries
CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_valor_aquisicao 
    ON maquinas_equipamentos(valor_aquisicao);

-- Serial numbers and chassi
CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_numero_chassi 
    ON maquinas_equipamentos(numero_chassi);

CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_numero_serie 
    ON maquinas_equipamentos(numero_serie);

-- Text search on descriptions
CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_descricao_text 
    ON maquinas_equipamentos USING GIN (to_tsvector('portuguese', descricao));

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_org_ano_alienado 
    ON maquinas_equipamentos(organizacao_id, ano, alienado);


-- =============================================================================
-- COMPOSITE MULTI-TABLE INDEXES
-- =============================================================================

-- Cross-module indexes for common join patterns

-- Investment analysis across tables
CREATE INDEX IF NOT EXISTS idx_investimentos_safra_lookup 
    ON investimentos(safra_id, organizacao_id, categoria, valor_total);

-- Asset management overview
CREATE INDEX IF NOT EXISTS idx_vendas_ativos_safra_lookup 
    ON vendas_ativos(safra_id, organizacao_id, categoria, valor_total);

-- Land acquisition by safra
CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_safra_lookup 
    ON aquisicao_terras(safra_id, organizacao_id, hectares, valor_total);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON INDEX idx_investimentos_org_safra_categoria IS 'Índice composto para análise de investimentos por organização, safra e categoria';
COMMENT ON INDEX idx_vendas_ativos_org_safra_categoria IS 'Índice composto para análise de vendas de ativos por organização, safra e categoria';
COMMENT ON INDEX idx_aquisicao_terras_org_safra_ano IS 'Índice composto para consultas de aquisição de terras por organização, safra e ano';
COMMENT ON INDEX idx_maquinas_equipamentos_org_ano_alienado IS 'Índice composto para gestão de equipamentos por organização, ano e status de alienação';
