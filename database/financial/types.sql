-- ==========================================
-- SR-Consultoria: Financial Module Types
-- ==========================================
-- 
-- Custom types and enums for financial module
-- Multi-tenant architecture with multi-year JSONB support
--
-- Generated with Claude Code: https://claude.ai/code
-- ==========================================

-- ==========================================
-- DEBT AND PAYMENT TYPES
-- ==========================================

-- Enum for debt modality
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'divida_modalidade') THEN
        CREATE TYPE divida_modalidade AS ENUM (
            'CUSTEIO',
            'INVESTIMENTOS'
        );
    END IF;
END $$;

-- Enum for currency types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moeda_tipo') THEN
        CREATE TYPE moeda_tipo AS ENUM (
            'BRL',
            'USD',
            'EUR',
            'SOJA'
        );
    END IF;
END $$;

-- Enum for indexer types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'indexador_tipo') THEN
        CREATE TYPE indexador_tipo AS ENUM (
            'CDI',
            'SELIC',
            'IPCA',
            'IGPM',
            'PREFIXADO',
            'TR',
            'TJLP',
            'DOLAR',
            'COMMODITY'
        );
    END IF;
END $$;

-- Enum for financial institution types (includes banks, trading companies, others)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_instituicao_financeira') THEN
        CREATE TYPE tipo_instituicao_financeira AS ENUM (
            'BANCO',
            'TRADING',
            'OUTRO'
        );
    END IF;
END $$;

-- ==========================================
-- LIQUIDITY TYPES
-- ==========================================

-- Enum for liquidity factor types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fator_liquidez_tipo') THEN
        CREATE TYPE fator_liquidez_tipo AS ENUM (
            'CAIXA',
            'BANCO',
            'INVESTIMENTO',
            'APLICACAO',
            'CONTA_CORRENTE',
            'CONTA_POUPANCA',
            'CDB',
            'LCI',
            'LCA'
        );
    END IF;
END $$;

-- ==========================================
-- INVENTORY AND COMMODITY TYPES
-- ==========================================

-- Enum for inventory types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estoque_tipo') THEN
        CREATE TYPE estoque_tipo AS ENUM (
            'FERTILIZANTES',
            'DEFENSIVOS',
            'ALMOXARIFADO',
            'SEMENTES',
            'MAQUINAS_E_EQUIPAMENTOS',
            'COMBUSTIVEIS',
            'PECAS_E_ACESSORIOS',
            'MEDICAMENTOS_VETERINARIOS',
            'RACAO_ANIMAL',
            'OUTROS'
        );
    END IF;
END $$;

-- Enum for commodity types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'commodity_tipo') THEN
        CREATE TYPE commodity_tipo AS ENUM (
            'SOJA',
            'ALGODAO',
            'MILHO',
            'ARROZ',
            'SORGO',
            'CAFE',
            'CACAU',
            'SOJA_CANA',
            'TRIGO',
            'FEIJAO',
            'GIRASSOL',
            'AMENDOIM',
            'OUTROS'
        );
    END IF;
END $$;

-- Enum for commodity units
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unidade_commodity') THEN
        CREATE TYPE unidade_commodity AS ENUM (
            'SACAS',
            'TONELADAS',
            'QUILOS',
            'ARROBAS',
            'LITROS',
            'METROS_CUBICOS'
        );
    END IF;
END $$;

-- ==========================================
-- SUPPLIER AND RECEIVABLES TYPES
-- ==========================================

-- Enum for supplier categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_fornecedor') THEN
        CREATE TYPE categoria_fornecedor AS ENUM (
            'FERTILIZANTES',
            'DEFENSIVOS',
            'SEMENTES',
            'COMBUSTIVEIS',
            'MAQUINAS',
            'SERVICOS',
            'INSUMOS_GERAIS',
            'VETERINARIOS',
            'CONSULTORIA',
            'TRANSPORTE',
            'OUTROS'
        );
    END IF;
END $$;

-- Enum for contract status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_contrato') THEN
        CREATE TYPE status_contrato AS ENUM (
            'ATIVO',
            'PENDENTE',
            'VENCIDO',
            'QUITADO',
            'CANCELADO',
            'RENEGOCIADO'
        );
    END IF;
END $$;

-- ==========================================
-- DEBT STATUS TYPES
-- ==========================================

-- Enum for debt status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_divida') THEN
        CREATE TYPE status_divida AS ENUM (
            'ATIVA',
            'PENDENTE',
            'EM_DIA',
            'ATRASADA',
            'VENCIDA',
            'QUITADA',
            'RENEGOCIADA',
            'CANCELADA'
        );
    END IF;
END $$;

-- ==========================================
-- COMPOSITE TYPES FOR COMPLEX DATA
-- ==========================================

-- Type for payment flow items
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fluxo_pagamento_item') THEN
        CREATE TYPE fluxo_pagamento_item AS (
            ano INTEGER,
            valor DECIMAL,
            moeda moeda_tipo,
            observacoes TEXT
        );
    END IF;
END $$;

-- Type for debt summary
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resumo_divida') THEN
        CREATE TYPE resumo_divida AS (
            tipo_divida TEXT,
            valor_total DECIMAL,
            valor_anual DECIMAL,
            moeda moeda_tipo,
            taxa_media DECIMAL,
            quantidade_contratos INTEGER
        );
    END IF;
END $$;

-- Type for liquidity position
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'posicao_liquidez') THEN
        CREATE TYPE posicao_liquidez AS (
            tipo fator_liquidez_tipo,
            valor_total DECIMAL,
            percentual_total DECIMAL,
            quantidade_contas INTEGER
        );
    END IF;
END $$;

-- Type for commodity position
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'posicao_commodity') THEN
        CREATE TYPE posicao_commodity AS (
            commodity commodity_tipo,
            quantidade_total DECIMAL,
            unidade unidade_commodity,
            valor_total DECIMAL,
            preco_medio DECIMAL
        );
    END IF;
END $$;

-- Type for financial ratios
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'indicadores_financeiros') THEN
        CREATE TYPE indicadores_financeiros AS (
            liquidez_corrente DECIMAL,
            endividamento_total DECIMAL,
            margem_ebitda DECIMAL,
            roa DECIMAL,
            roe DECIMAL,
            giro_ativo DECIMAL
        );
    END IF;
END $$;

-- ==========================================
-- DOMAIN TYPES FOR VALIDATION
-- ==========================================

-- Domain for financial values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'valor_financeiro') THEN
        CREATE DOMAIN valor_financeiro AS DECIMAL(15,2)
        CHECK (VALUE >= 0);
    END IF;
END $$;

-- Domain for interest rates
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taxa_juros') THEN
        CREATE DOMAIN taxa_juros AS DECIMAL(6,4)
        CHECK (VALUE >= -10 AND VALUE <= 100);
    END IF;
END $$;

-- Domain for commodity quantities
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quantidade_commodity') THEN
        CREATE DOMAIN quantidade_commodity AS DECIMAL(12,4)
        CHECK (VALUE >= 0);
    END IF;
END $$;

-- Domain for percentage values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'percentual_financeiro') THEN
        CREATE DOMAIN percentual_financeiro AS DECIMAL(5,2)
        CHECK (VALUE >= 0 AND VALUE <= 100);
    END IF;
END $$;

-- Domain for years in payment flows
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ano_fluxo') THEN
        CREATE DOMAIN ano_fluxo AS INTEGER
        CHECK (VALUE >= 2000 AND VALUE <= 2100);
    END IF;
END $$;

-- ==========================================
-- BANK AND INSTITUTION TYPES
-- ==========================================

-- Enum for bank types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_instituicao_bancaria') THEN
        CREATE TYPE tipo_instituicao_bancaria AS ENUM (
            'BANCO_COMERCIAL',
            'BANCO_INVESTIMENTO',
            'COOPERATIVA_CREDITO',
            'FINANCEIRA',
            'INSTITUICAO_PAGAMENTO',
            'OUTROS'
        );
    END IF;
END $$;

-- Enum for trading company types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_trading') THEN
        CREATE TYPE tipo_trading AS ENUM (
            'MULTINACIONAL',
            'NACIONAL',
            'REGIONAL',
            'COOPERATIVA',
            'OUTROS'
        );
    END IF;
END $$;

-- ==========================================
-- PROPERTY DEBT TYPES
-- ==========================================

-- Enum for property debt types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_divida_imovel') THEN
        CREATE TYPE tipo_divida_imovel AS ENUM (
            'FINANCIAMENTO_COMPRA',
            'REFINANCIAMENTO',
            'EMPRESTIMO_GARANTIA',
            'CREDITO_RURAL',
            'OUTROS'
        );
    END IF;
END $$;

-- ==========================================
-- ADVANCE PAYMENT TYPES
-- ==========================================

-- Enum for advance status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_adiantamento') THEN
        CREATE TYPE status_adiantamento AS ENUM (
            'PENDENTE',
            'APROVADO',
            'PAGO',
            'LIQUIDADO',
            'CANCELADO'
        );
    END IF;
END $$;

-- ==========================================
-- LOAN TYPES
-- ==========================================

-- Enum for loan purposes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finalidade_emprestimo') THEN
        CREATE TYPE finalidade_emprestimo AS ENUM (
            'CAPITAL_GIRO',
            'INVESTIMENTO',
            'EMERGENCIA',
            'EXPANSAO',
            'OUTROS'
        );
    END IF;
END $$;

-- ==========================================
-- TYPE COMMENTS
-- ==========================================

COMMENT ON TYPE divida_modalidade IS 'Modalidades de dívidas financeiras';
COMMENT ON TYPE moeda_tipo IS 'Tipos de moedas suportadas pelo sistema';
COMMENT ON TYPE indexador_tipo IS 'Tipos de indexadores para correção monetária';
COMMENT ON TYPE fator_liquidez_tipo IS 'Tipos de fatores de liquidez';
COMMENT ON TYPE estoque_tipo IS 'Categorias de estoque';
COMMENT ON TYPE commodity_tipo IS 'Tipos de commodities agrícolas';
COMMENT ON TYPE unidade_commodity IS 'Unidades de medida para commodities';
COMMENT ON TYPE categoria_fornecedor IS 'Categorias de fornecedores';
COMMENT ON TYPE status_contrato IS 'Status dos contratos financeiros';
COMMENT ON TYPE status_divida IS 'Status das dívidas';
COMMENT ON TYPE fluxo_pagamento_item IS 'Item de fluxo de pagamento com detalhes';
COMMENT ON TYPE resumo_divida IS 'Resumo consolidado de dívidas';
COMMENT ON TYPE posicao_liquidez IS 'Posição de liquidez consolidada';
COMMENT ON TYPE posicao_commodity IS 'Posição de commodities consolidada';
COMMENT ON TYPE indicadores_financeiros IS 'Indicadores financeiros consolidados';
COMMENT ON TYPE tipo_instituicao_bancaria IS 'Tipos de instituições bancárias';
COMMENT ON TYPE tipo_trading IS 'Tipos de empresas de trading';
COMMENT ON TYPE tipo_divida_imovel IS 'Tipos de dívidas imobiliárias';
COMMENT ON TYPE status_adiantamento IS 'Status dos adiantamentos';
COMMENT ON TYPE finalidade_emprestimo IS 'Finalidades dos empréstimos';
COMMENT ON DOMAIN valor_financeiro IS 'Valor financeiro não negativo';
COMMENT ON DOMAIN taxa_juros IS 'Taxa de juros em percentual';
COMMENT ON DOMAIN quantidade_commodity IS 'Quantidade de commodity não negativa';
COMMENT ON DOMAIN percentual_financeiro IS 'Percentual entre 0 e 100';
COMMENT ON DOMAIN ano_fluxo IS 'Ano válido para fluxos de pagamento';

-- Success message
SELECT 'Financial Module Types created successfully!' as status;