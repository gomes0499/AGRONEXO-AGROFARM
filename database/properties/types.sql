-- =============================================================================
-- PROPERTIES MODULE - TYPES
-- =============================================================================
-- This file contains all custom types used in the properties module
-- =============================================================================

-- Property types enum
CREATE TYPE IF NOT EXISTS tipo_propriedade AS ENUM (
    'PROPRIO',
    'ARRENDADO',
    'PARCERIA',
    'COMODATO'
);

-- Property ownership status
CREATE TYPE IF NOT EXISTS status_propriedade AS ENUM (
    'ATIVA',
    'INATIVA',
    'EM_NEGOCIACAO',
    'VENDIDA'
);

-- Lease payment types
CREATE TYPE IF NOT EXISTS tipo_pagamento_arrendamento AS ENUM (
    'SACAS',
    'DINHEIRO',
    'MISTO',
    'PERCENTUAL_PRODUCAO'
);


-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TYPE tipo_propriedade IS 'Tipos de propriedade: própria, arrendada, parceria ou comodato';
COMMENT ON TYPE status_propriedade IS 'Status atual da propriedade no sistema';
COMMENT ON TYPE tipo_pagamento_arrendamento IS 'Formas de pagamento para contratos de arrendamento';
