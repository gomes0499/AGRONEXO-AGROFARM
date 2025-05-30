-- =============================================================================
-- PROPERTIES MODULE - INDEXES
-- =============================================================================
-- This file contains all indexes for the properties module tables
-- Optimized for multi-tenant queries and JSONB operations
-- =============================================================================

-- =============================================================================
-- PROPRIEDADES INDEXES
-- =============================================================================

-- Primary organizational filtering
CREATE INDEX IF NOT EXISTS idx_propriedades_org 
    ON propriedades(organizacao_id);

-- Property type and status filtering
CREATE INDEX IF NOT EXISTS idx_propriedades_tipo 
    ON propriedades(tipo);

CREATE INDEX IF NOT EXISTS idx_propriedades_status 
    ON propriedades(status);

CREATE INDEX IF NOT EXISTS idx_propriedades_org_tipo 
    ON propriedades(organizacao_id, tipo);

CREATE INDEX IF NOT EXISTS idx_propriedades_org_status 
    ON propriedades(organizacao_id, status);

-- Location-based filtering
CREATE INDEX IF NOT EXISTS idx_propriedades_cidade 
    ON propriedades(cidade);

CREATE INDEX IF NOT EXISTS idx_propriedades_estado 
    ON propriedades(estado);

CREATE INDEX IF NOT EXISTS idx_propriedades_org_estado 
    ON propriedades(organizacao_id, estado);

-- Area-based queries
CREATE INDEX IF NOT EXISTS idx_propriedades_area_total 
    ON propriedades(area_total);

CREATE INDEX IF NOT EXISTS idx_propriedades_area_cultivada 
    ON propriedades(area_cultivada);

-- Financial value queries
CREATE INDEX IF NOT EXISTS idx_propriedades_valor_atual 
    ON propriedades(valor_atual);

-- Document number lookup
CREATE INDEX IF NOT EXISTS idx_propriedades_matricula 
    ON propriedades(numero_matricula);

-- Timestamp indexes for temporal queries
CREATE INDEX IF NOT EXISTS idx_propriedades_created_at 
    ON propriedades(created_at);

CREATE INDEX IF NOT EXISTS idx_propriedades_updated_at 
    ON propriedades(updated_at);

-- =============================================================================
-- ARRENDAMENTOS INDEXES
-- =============================================================================

-- Primary organizational and safra filtering
CREATE INDEX IF NOT EXISTS idx_arrendamentos_org 
    ON arrendamentos(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_safra 
    ON arrendamentos(safra_id);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_org_safra 
    ON arrendamentos(organizacao_id, safra_id);

-- Property relationship
CREATE INDEX IF NOT EXISTS idx_arrendamentos_propriedade 
    ON arrendamentos(propriedade_id);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_org_propriedade 
    ON arrendamentos(organizacao_id, propriedade_id);

-- Contract identification
CREATE INDEX IF NOT EXISTS idx_arrendamentos_numero 
    ON arrendamentos(numero_arrendamento);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_org_numero 
    ON arrendamentos(organizacao_id, numero_arrendamento);

-- Contract status and dates
CREATE INDEX IF NOT EXISTS idx_arrendamentos_ativo 
    ON arrendamentos(ativo);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_data_inicio 
    ON arrendamentos(data_inicio);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_data_termino 
    ON arrendamentos(data_termino);

-- Payment type filtering
CREATE INDEX IF NOT EXISTS idx_arrendamentos_tipo_pagamento 
    ON arrendamentos(tipo_pagamento);

-- Area-based queries
CREATE INDEX IF NOT EXISTS idx_arrendamentos_area_arrendada 
    ON arrendamentos(area_arrendada);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_area_fazenda 
    ON arrendamentos(area_fazenda);

-- JSONB indexes for efficient cost queries
CREATE INDEX IF NOT EXISTS idx_arrendamentos_custos_gin 
    ON arrendamentos USING GIN (custos_por_ano);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_arrendamentos_org_safra_ativo 
    ON arrendamentos(organizacao_id, safra_id, ativo);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_org_propriedade_safra 
    ON arrendamentos(organizacao_id, propriedade_id, safra_id);

-- Contract period queries
CREATE INDEX IF NOT EXISTS idx_arrendamentos_periodo 
    ON arrendamentos(data_inicio, data_termino);

-- =============================================================================
-- ARRENDAMENTOS ANOS (NORMALIZED) INDEXES
-- =============================================================================

-- Primary organizational filtering
CREATE INDEX IF NOT EXISTS idx_arrendamentos_anos_org 
    ON arrendamentos_anos(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_anos_safra 
    ON arrendamentos_anos(safra_id);

-- Year-based filtering
CREATE INDEX IF NOT EXISTS idx_arrendamentos_anos_ano 
    ON arrendamentos_anos(ano);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_anos_org_ano 
    ON arrendamentos_anos(organizacao_id, ano);

-- Property filtering
CREATE INDEX IF NOT EXISTS idx_arrendamentos_anos_propriedade 
    ON arrendamentos_anos(propriedade_id);

-- Cost range queries
CREATE INDEX IF NOT EXISTS idx_arrendamentos_anos_custo_total 
    ON arrendamentos_anos(custo_total);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_anos_custo_hectare 
    ON arrendamentos_anos(custo_hectare);

-- Payment type filtering
CREATE INDEX IF NOT EXISTS idx_arrendamentos_anos_tipo_pagamento 
    ON arrendamentos_anos(tipo_pagamento);

-- Composite indexes for efficient range queries
CREATE INDEX IF NOT EXISTS idx_arrendamentos_anos_org_propriedade_ano 
    ON arrendamentos_anos(organizacao_id, propriedade_id, ano);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_anos_org_tipo_ano 
    ON arrendamentos_anos(organizacao_id, tipo_pagamento, ano);

-- Foreign key optimization
CREATE INDEX IF NOT EXISTS idx_arrendamentos_anos_arrendamento_id 
    ON arrendamentos_anos(arrendamento_id);

-- Time series analysis
CREATE INDEX IF NOT EXISTS idx_arrendamentos_anos_time_series 
    ON arrendamentos_anos(organizacao_id, propriedade_id, ano, custo_hectare);

-- =============================================================================
-- BENFEITORIAS INDEXES
-- =============================================================================

-- Primary organizational filtering
CREATE INDEX IF NOT EXISTS idx_benfeitorias_org 
    ON benfeitorias(organizacao_id);

-- Property relationship
CREATE INDEX IF NOT EXISTS idx_benfeitorias_propriedade 
    ON benfeitorias(propriedade_id);

CREATE INDEX IF NOT EXISTS idx_benfeitorias_org_propriedade 
    ON benfeitorias(organizacao_id, propriedade_id);

-- Value-based queries
CREATE INDEX IF NOT EXISTS idx_benfeitorias_valor 
    ON benfeitorias(valor);

-- Text search on descriptions
CREATE INDEX IF NOT EXISTS idx_benfeitorias_descricao_text 
    ON benfeitorias USING GIN (to_tsvector('portuguese', descricao));


-- =============================================================================
-- COMPOSITE MULTI-TABLE INDEXES
-- =============================================================================

-- Cross-module indexes for common join patterns
-- These will be created only if the referenced tables exist

-- Lease contracts with safras
CREATE INDEX IF NOT EXISTS idx_arrendamentos_safra_lookup 
    ON arrendamentos(safra_id, organizacao_id, ativo);

-- Property management overview
CREATE INDEX IF NOT EXISTS idx_propriedades_management_overview 
    ON propriedades(organizacao_id, status, tipo, area_total);

-- Active lease summary
CREATE INDEX IF NOT EXISTS idx_arrendamentos_active_summary 
    ON arrendamentos(organizacao_id, ativo, data_termino) 
    WHERE ativo = true;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON INDEX idx_arrendamentos_custos_gin IS 'GIN index para consultas eficientes em custos JSONB de arrendamento';
COMMENT ON INDEX idx_arrendamentos_org_safra_ativo IS 'Índice composto para consultas por organização, safra e contratos ativos';
COMMENT ON INDEX idx_arrendamentos_anos_time_series IS 'Índice otimizado para análises de séries temporais de custos de arrendamento';
COMMENT ON INDEX idx_benfeitorias_descricao_text IS 'Índice de busca textual para descrições de benfeitorias';
