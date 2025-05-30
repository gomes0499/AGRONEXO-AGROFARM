-- ==========================================
-- SR-Consultoria: Production Module Types
-- ==========================================
-- 
-- Custom types and enums for production module
-- Multi-tenant architecture support
--
-- Generated with Claude Code: https://claude.ai/code
-- ==========================================

-- ==========================================
-- PRODUCTION COST CATEGORIES
-- ==========================================

-- Enum for production cost categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'custo_producao_categoria') THEN
        CREATE TYPE custo_producao_categoria AS ENUM (
            'CALCARIO',
            'FERTILIZANTE',
            'SEMENTES',
            'TRATAMENTO_SEMENTES',
            'HERBICIDA',
            'INSETICIDA',
            'FUNGICIDA',
            'OUTROS',
            'BENEFICIAMENTO',
            'SERVICOS',
            'ADMINISTRATIVO'
        );
    END IF;
END $$;

-- ==========================================
-- LIVESTOCK OPERATION TYPES
-- ==========================================

-- Enum for livestock cycles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ciclo_pecuario') THEN
        CREATE TYPE ciclo_pecuario AS ENUM (
            'CONFINAMENTO',
            'PASTO',
            'SEMICONFINAMENTO',
            'INTENSIVO',
            'EXTENSIVO'
        );
    END IF;
END $$;

-- Enum for livestock origins
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'origem_animal') THEN
        CREATE TYPE origem_animal AS ENUM (
            'PROPRIO',
            'TERCEIROS',
            'COMPRADO',
            'ARRENDADO'
        );
    END IF;
END $$;

-- Enum for livestock price units
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unidade_preco_animal') THEN
        CREATE TYPE unidade_preco_animal AS ENUM (
            'CABECA',
            'KG',
            'ARROBA',
            'LOTE',
            'TONELADA'
        );
    END IF;
END $$;

-- ==========================================
-- PRODUCTIVITY UNITS
-- ==========================================

-- Enum for productivity measurement units
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unidade_produtividade') THEN
        CREATE TYPE unidade_produtividade AS ENUM (
            'sc/ha',    -- sacas por hectare
            '@/ha',     -- arrobas por hectare
            'kg/ha',    -- quilogramas por hectare
            'ton/ha'    -- toneladas por hectare
        );
    END IF;
END $$;

-- ==========================================
-- AREA MEASUREMENT TYPES
-- ==========================================

-- Enum for area units (if needed for conversions)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unidade_area') THEN
        CREATE TYPE unidade_area AS ENUM (
            'ha',       -- hectares (default)
            'm2',       -- metros quadrados
            'alqueire', -- alqueire paulista
            'alq_mg'    -- alqueire mineiro
        );
    END IF;
END $$;

-- ==========================================
-- PRODUCTION SYSTEM TYPES
-- ==========================================

-- Enum for common production systems
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_sistema_producao') THEN
        CREATE TYPE tipo_sistema_producao AS ENUM (
            'SEQUEIRO',
            'IRRIGADO',
            'MISTO',
            'ORGANICO',
            'CONVENCIONAL',
            'PLANTIO_DIRETO',
            'PLANTIO_CONVENCIONAL'
        );
    END IF;
END $$;

-- ==========================================
-- CULTURE TYPES
-- ==========================================

-- Enum for common crop types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_cultura') THEN
        CREATE TYPE tipo_cultura AS ENUM (
            'SOJA',
            'MILHO',
            'ALGODAO',
            'FEIJAO',
            'ARROZ',
            'TRIGO',
            'SORGO',
            'GIRASSOL',
            'CANA_ACUCAR',
            'CAFE',
            'PASTAGEM',
            'OUTROS'
        );
    END IF;
END $$;

-- ==========================================
-- CYCLE TYPES
-- ==========================================

-- Enum for production cycles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_ciclo') THEN
        CREATE TYPE tipo_ciclo AS ENUM (
            'PRIMEIRA_SAFRA',
            'SEGUNDA_SAFRA',
            'TERCEIRA_SAFRA',
            'SAFRINHA',
            'INVERNO',
            'VERAO'
        );
    END IF;
END $$;

-- ==========================================
-- ANIMAL TYPES
-- ==========================================

-- Enum for animal types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_animal') THEN
        CREATE TYPE tipo_animal AS ENUM (
            'BOVINO',
            'SUINO',
            'OVINO',
            'CAPRINO',
            'EQUINO',
            'AVES',
            'BUBALINO',
            'OUTROS'
        );
    END IF;
END $$;

-- Enum for animal categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_animal') THEN
        CREATE TYPE categoria_animal AS ENUM (
            'BEZERRO_MACHO',
            'BEZERRO_FEMEA',
            'NOVILHO',
            'NOVILHA',
            'BOI',
            'VACA',
            'TOURO',
            'MATRIZ',
            'REPRODUTOR',
            'ENGORDA',
            'CRIA',
            'RECRIA',
            'TERMINACAO'
        );
    END IF;
END $$;

-- ==========================================
-- COMPOSITE TYPES FOR COMPLEX DATA
-- ==========================================

-- Type for safra values (used in multi-safra operations)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safra_valor') THEN
        CREATE TYPE safra_valor AS (
            safra_id UUID,
            valor DECIMAL,
            unidade TEXT,
            observacoes TEXT
        );
    END IF;
END $$;

-- Type for area breakdown by culture
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'area_cultura') THEN
        CREATE TYPE area_cultura AS (
            cultura_id UUID,
            cultura_nome TEXT,
            area_total DECIMAL,
            percentual DECIMAL
        );
    END IF;
END $$;

-- Type for productivity metrics
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'metrica_produtividade') THEN
        CREATE TYPE metrica_produtividade AS (
            cultura_id UUID,
            safra_id UUID,
            produtividade_media DECIMAL,
            produtividade_minima DECIMAL,
            produtividade_maxima DECIMAL,
            unidade TEXT
        );
    END IF;
END $$;

-- Type for cost breakdown
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'custo_breakdown') THEN
        CREATE TYPE custo_breakdown AS (
            categoria custo_producao_categoria,
            valor_total DECIMAL,
            percentual DECIMAL,
            quantidade_registros INTEGER
        );
    END IF;
END $$;

-- ==========================================
-- DOMAIN TYPES FOR VALIDATION
-- ==========================================

-- Domain for positive decimals
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'decimal_positivo') THEN
        CREATE DOMAIN decimal_positivo AS DECIMAL
        CHECK (VALUE > 0);
    END IF;
END $$;

-- Domain for area values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'area_hectares') THEN
        CREATE DOMAIN area_hectares AS DECIMAL(10,4)
        CHECK (VALUE > 0 AND VALUE <= 1000000);
    END IF;
END $$;

-- Domain for productivity values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'produtividade_valor') THEN
        CREATE DOMAIN produtividade_valor AS DECIMAL(10,4)
        CHECK (VALUE > 0 AND VALUE <= 1000);
    END IF;
END $$;

-- Domain for monetary values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'valor_monetario') THEN
        CREATE DOMAIN valor_monetario AS DECIMAL(15,2)
        CHECK (VALUE >= 0);
    END IF;
END $$;

-- Domain for percentage values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'percentual') THEN
        CREATE DOMAIN percentual AS DECIMAL(5,2)
        CHECK (VALUE >= 0 AND VALUE <= 100);
    END IF;
END $$;

-- ==========================================
-- TYPE COMMENTS
-- ==========================================

COMMENT ON TYPE custo_producao_categoria IS 'Categorias de custos de produção agrícola';
COMMENT ON TYPE ciclo_pecuario IS 'Tipos de ciclos pecuários';
COMMENT ON TYPE origem_animal IS 'Origem dos animais no rebanho';
COMMENT ON TYPE unidade_preco_animal IS 'Unidades de precificação de animais';
COMMENT ON TYPE unidade_produtividade IS 'Unidades de medida de produtividade';
COMMENT ON TYPE unidade_area IS 'Unidades de medida de área';
COMMENT ON TYPE tipo_sistema_producao IS 'Tipos de sistemas de produção';
COMMENT ON TYPE tipo_cultura IS 'Tipos de culturas agrícolas';
COMMENT ON TYPE tipo_ciclo IS 'Tipos de ciclos produtivos';
COMMENT ON TYPE tipo_animal IS 'Tipos de animais para pecuária';
COMMENT ON TYPE categoria_animal IS 'Categorias de animais por idade/função';
COMMENT ON TYPE safra_valor IS 'Estrutura para valores por safra';
COMMENT ON TYPE area_cultura IS 'Breakdown de área por cultura';
COMMENT ON TYPE metrica_produtividade IS 'Métricas de produtividade por cultura/safra';
COMMENT ON TYPE custo_breakdown IS 'Breakdown de custos por categoria';
COMMENT ON DOMAIN decimal_positivo IS 'Valor decimal que deve ser positivo';
COMMENT ON DOMAIN area_hectares IS 'Área em hectares com validação de range';
COMMENT ON DOMAIN produtividade_valor IS 'Valor de produtividade com validação';
COMMENT ON DOMAIN valor_monetario IS 'Valor monetário não negativo';
COMMENT ON DOMAIN percentual IS 'Valor percentual entre 0 e 100';

-- Success message
SELECT 'Production Module Types created successfully!' as status;