-- =============================================================================
-- INDICATORS MODULE - TYPES
-- =============================================================================
-- This file contains all custom types used in the indicators module
-- =============================================================================

-- Commodity types enum
CREATE TYPE IF NOT EXISTS tipo_commodity AS ENUM (
    'SOJA_SEQUEIRO',
    'SOJA_IRRIGADO', 
    'MILHO_SEQUEIRO',
    'MILHO_IRRIGADO',
    'ALGODAO_SEQUEIRO',
    'ALGODAO_IRRIGADO',
    'ARROZ',
    'FEIJAO',
    'TRIGO',
    'SORGO',
    'GIRASSOL',
    'CANOLA',
    'AMENDOIM',
    'BOI_GORDO',
    'BEZERRO',
    'VACA_GORDA'
);

-- Unit types for commodity prices
CREATE TYPE IF NOT EXISTS unidade_preco_commodity AS ENUM (
    'R$/SACA',
    'R$/@',
    'R$/TON',
    'R$/KG',
    'USD/SACA',
    'USD/@',
    'USD/TON',
    'USD/KG',
    'R$/CABECA'
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TYPE tipo_commodity IS 'Tipos de commodities agropecuárias suportados pelo sistema';
COMMENT ON TYPE unidade_preco_commodity IS 'Unidades de medida para preços de commodities';