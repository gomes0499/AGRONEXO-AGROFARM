-- =============================================================================
-- PATRIMONIO MODULE - TYPES
-- =============================================================================
-- This file contains all custom types used in the patrimonio module
-- =============================================================================

-- Investment categories enum
CREATE TYPE IF NOT EXISTS categoria_investimento AS ENUM (
    'EQUIPAMENTO',
    'TRATOR_COLHEITADEIRA_PULVERIZADOR',
    'AERONAVE',
    'VEICULO',
    'BENFEITORIA',
    'INVESTIMENTO_SOLO',
    'MAQUINARIO_AGRICOLA',
    'INFRAESTRUTURA',
    'TECNOLOGIA',
    'OUTROS'
);

-- Asset sale categories
CREATE TYPE IF NOT EXISTS categoria_venda_ativo AS ENUM (
    'EQUIPAMENTO',
    'TRATOR',
    'COLHEITADEIRA',
    'PULVERIZADOR',
    'AERONAVE',
    'VEICULO',
    'MAQUINARIO',
    'OUTROS'
);

-- Land acquisition types
CREATE TYPE IF NOT EXISTS tipo_aquisicao_terra AS ENUM (
    'COMPRA',
    'ARRENDAMENTO_LONGO_PRAZO',
    'PARCERIA',
    'OUTROS'
);

-- Equipment status
CREATE TYPE IF NOT EXISTS status_equipamento AS ENUM (
    'ATIVO',
    'INATIVO',
    'MANUTENCAO',
    'VENDIDO',
    'ALIENADO'
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TYPE categoria_investimento IS 'Categorias de investimentos em patrimônio';
COMMENT ON TYPE categoria_venda_ativo IS 'Categorias para vendas de ativos';
COMMENT ON TYPE tipo_aquisicao_terra IS 'Tipos de aquisição de terras';
COMMENT ON TYPE status_equipamento IS 'Status dos equipamentos e máquinas';