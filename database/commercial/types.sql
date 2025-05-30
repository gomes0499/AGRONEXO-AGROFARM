-- =============================================================================
-- COMMERCIAL MODULE - TYPES
-- =============================================================================
-- This file contains all custom types used in the commercial module
-- =============================================================================

-- Sale status enum
CREATE TYPE IF NOT EXISTS status_venda AS ENUM (
    'PLANEJADA',
    'EM_ANDAMENTO',
    'CONCLUIDA',
    'CANCELADA'
);

-- Payment method enum
CREATE TYPE IF NOT EXISTS metodo_pagamento AS ENUM (
    'DINHEIRO',
    'BOLETO',
    'TRANSFERENCIA',
    'CARTAO',
    'CHEQUE',
    'BARTER',
    'OUTROS'
);

-- Sale period enum
CREATE TYPE IF NOT EXISTS periodo_venda AS ENUM (
    'PRIMEIRA_SAFRA',
    'SEGUNDA_SAFRA',
    'TERCEIRA_SAFRA',
    'ENTRESSAFRA',
    'ANUAL'
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TYPE status_venda IS 'Status das vendas comerciais';
COMMENT ON TYPE metodo_pagamento IS 'Métodos de pagamento aceitos nas vendas';
COMMENT ON TYPE periodo_venda IS 'Períodos de venda baseados nas safras';