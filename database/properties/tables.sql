-- =============================================================================
-- PROPERTIES MODULE - TABLES
-- =============================================================================
-- This file contains all table definitions for the properties module
-- Using JSONB for multi-year lease costs with safra_id integration
-- =============================================================================

-- =============================================================================
-- PROPERTIES TABLE
-- =============================================================================

-- Main properties table (if not already exists in main schema)
CREATE TABLE IF NOT EXISTS propriedades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    
    -- Basic property information
    nome TEXT NOT NULL, -- denominação do imóvel
    ano_aquisicao INTEGER,
    proprietario TEXT,
    cidade TEXT,
    estado TEXT,
    numero_matricula TEXT, -- matrícula
    
    -- Area information
    area_total DECIMAL(15, 4), -- hectares
    area_cultivada DECIMAL(15, 4), -- hectares
    
    -- Financial information
    valor_atual DECIMAL(15, 2),
    onus TEXT,
    avaliacao_banco DECIMAL(15, 2),
    
    -- Property type
    tipo tipo_propriedade NOT NULL DEFAULT 'PROPRIO',
    status status_propriedade NOT NULL DEFAULT 'ATIVA',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_area_total_positive CHECK (area_total IS NULL OR area_total > 0),
    CONSTRAINT chk_area_cultivada_positive CHECK (area_cultivada IS NULL OR area_cultivada > 0),
    CONSTRAINT chk_area_cultivada_lte_total CHECK (area_cultivada IS NULL OR area_total IS NULL OR area_cultivada <= area_total),
    CONSTRAINT chk_valor_atual_positive CHECK (valor_atual IS NULL OR valor_atual > 0),
    CONSTRAINT chk_avaliacao_banco_positive CHECK (avaliacao_banco IS NULL OR avaliacao_banco > 0),
    CONSTRAINT chk_ano_aquisicao_valid CHECK (ano_aquisicao IS NULL OR (ano_aquisicao >= 1900 AND ano_aquisicao <= EXTRACT(YEAR FROM now()) + 10))
);

-- =============================================================================
-- LEASE CONTRACTS TABLE (JSONB STRUCTURE)
-- =============================================================================

-- Restructured lease table with JSONB for multi-year costs and safra_id
CREATE TABLE IF NOT EXISTS arrendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    numero_arrendamento TEXT NOT NULL,
    nome_fazenda TEXT NOT NULL,
    arrendantes TEXT NOT NULL, -- Can be multiple lessors
    data_inicio DATE NOT NULL,
    data_termino DATE NOT NULL,
    area_fazenda DECIMAL(15, 4) NOT NULL, -- Total farm area (hectares)
    area_arrendada DECIMAL(15, 4) NOT NULL, -- Leased area (hectares)
    custo_hectare DECIMAL(15, 4),
    tipo_pagamento tipo_pagamento_arrendamento NOT NULL DEFAULT 'SACAS',
    custos_por_ano JSONB NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT uk_arrendamento_org_safra_numero UNIQUE(organizacao_id, safra_id, numero_arrendamento),
    CONSTRAINT chk_area_fazenda_positive CHECK (area_fazenda > 0),
    CONSTRAINT chk_area_arrendada_positive CHECK (area_arrendada > 0),
    CONSTRAINT chk_area_arrendada_lte_fazenda CHECK (area_arrendada <= area_fazenda),
    CONSTRAINT chk_data_termino_after_inicio CHECK (data_termino > data_inicio),
    CONSTRAINT chk_custos_por_ano_not_empty CHECK (jsonb_typeof(custos_por_ano) = 'object' AND custos_por_ano != '{}'),
    CONSTRAINT chk_custo_hectare_positive CHECK (custo_hectare IS NULL OR custo_hectare > 0)
);


-- =============================================================================
-- PROPERTY IMPROVEMENTS TABLE
-- =============================================================================

-- Table for property improvements/infrastructure
CREATE TABLE IF NOT EXISTS benfeitorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    dimensoes TEXT,
    valor DECIMAL(15, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_valor_benfeitoria_positive CHECK (valor IS NULL OR valor > 0)
);


-- =============================================================================
-- COMMENTS
-- =============================================================================

-- Table comments
COMMENT ON TABLE propriedades IS 'Cadastro de propriedades rurais da organização';
COMMENT ON TABLE arrendamentos IS 'Contratos de arrendamento usando estrutura JSONB para custos anuais por safra';
COMMENT ON TABLE arrendamentos_anos IS 'Tabela normalizada para consultas eficientes de custos de arrendamento por ano';
COMMENT ON TABLE benfeitorias IS 'Benfeitorias e melhorias realizadas nas propriedades';

-- Column comments for arrendamentos
COMMENT ON COLUMN arrendamentos.custos_por_ano IS 'Custos de arrendamento por ano em formato JSONB: {"2025": {"custo_total": 50000, "custo_hectare": 125.50}, ...}';
COMMENT ON COLUMN arrendamentos.safra_id IS 'Referência à safra base do contrato de arrendamento';
COMMENT ON COLUMN arrendamentos.tipo_pagamento IS 'Forma de pagamento do arrendamento (SACAS, DINHEIRO, MISTO, PERCENTUAL_PRODUCAO)';
COMMENT ON COLUMN arrendamentos.area_arrendada IS 'Área efetivamente arrendada em hectares';
COMMENT ON COLUMN arrendamentos.area_fazenda IS 'Área total da fazenda em hectares';

-- Column comments for propriedades
COMMENT ON COLUMN propriedades.nome IS 'Denominação do imóvel rural';
COMMENT ON COLUMN propriedades.numero_matricula IS 'Número da matrícula do imóvel no registro de imóveis';
COMMENT ON COLUMN propriedades.tipo IS 'Tipo de propriedade (PROPRIO, ARRENDADO, PARCERIA, COMODATO)';
COMMENT ON COLUMN propriedades.status IS 'Status atual da propriedade (ATIVA, INATIVA, EM_NEGOCIACAO, VENDIDA)';