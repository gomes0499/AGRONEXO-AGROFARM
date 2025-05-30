-- =============================================================================
-- SR-CONSULTORIA: CONSOLIDATED TYPES
-- =============================================================================
-- This file contains all PostgreSQL custom types used across all modules
-- Multi-tenant SaaS architecture with JSONB multi-year support
--
-- Modules included:
-- - Authentication & User Management
-- - Organization Management  
-- - Financial Management
-- - Production Management
-- - Properties Management
-- - Patrimonio Management
-- - Indicators Management
-- - Commercial Management
-- - Projections Management
--
-- Generated with Claude Code: https://claude.ai/code
-- =============================================================================

-- =============================================================================
-- AUTHENTICATION & USER MANAGEMENT TYPES
-- =============================================================================

-- User roles enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'PROPRIETARIO',
            'ADMINISTRADOR', 
            'MEMBRO'
        );
    END IF;
END $$;

-- Invitation status enum  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_status') THEN
        CREATE TYPE invite_status AS ENUM (
            'PENDENTE',
            'ACEITO',
            'RECUSADO', 
            'EXPIRADO'
        );
    END IF;
END $$;

-- =============================================================================
-- PROPERTY MANAGEMENT TYPES
-- =============================================================================

-- Property types enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'propriedade_tipo') THEN
        CREATE TYPE propriedade_tipo AS ENUM (
            'PROPRIO',
            'ARRENDADO',
            'PARCERIA',
            'COMODATO'
        );
    END IF;
END $$;

-- Property status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_propriedade') THEN
        CREATE TYPE status_propriedade AS ENUM (
            'ATIVA',
            'INATIVA',
            'EM_NEGOCIACAO',
            'VENDIDA'
        );
    END IF;
END $$;

-- Property consent status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'propriedade_anuencia') THEN
        CREATE TYPE propriedade_anuencia AS ENUM (
            'COM_ANUENCIA',
            'SEM_ANUENCIA'
        );
    END IF;
END $$;

-- Lease payment types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_pagamento_arrendamento') THEN
        CREATE TYPE tipo_pagamento_arrendamento AS ENUM (
            'SACAS',
            'DINHEIRO',
            'MISTO',
            'PERCENTUAL_PRODUCAO'
        );
    END IF;
END $$;

-- =============================================================================
-- PRODUCTION MANAGEMENT TYPES
-- =============================================================================

-- Production cost categories
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

-- Livestock operation cycles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operacao_pecuaria_ciclo') THEN
        CREATE TYPE operacao_pecuaria_ciclo AS ENUM (
            'CONFINAMENTO',
            'PASTO',
            'SEMICONFINAMENTO',
            'INTENSIVO',
            'EXTENSIVO'
        );
    END IF;
END $$;

-- Livestock operation origins
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'operacao_pecuaria_origem') THEN
        CREATE TYPE operacao_pecuaria_origem AS ENUM (
            'PROPRIO',
            'TERCEIROS',
            'COMPRADO',
            'ARRENDADO'
        );
    END IF;
END $$;

-- Price unit enum for livestock
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'price_unit_enum') THEN
        CREATE TYPE price_unit_enum AS ENUM (
            'CABECA',
            'KG',
            'ARROBA',
            'LOTE',
            'TONELADA'
        );
    END IF;
END $$;

-- Productivity measurement units
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

-- Area measurement units
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

-- Production system types
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

-- Animal types
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

-- Animal categories
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

-- =============================================================================
-- FINANCIAL MANAGEMENT TYPES
-- =============================================================================

-- Debt modality
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'divida_modalidade') THEN
        CREATE TYPE divida_modalidade AS ENUM (
            'CUSTEIO',
            'INVESTIMENTOS'
        );
    END IF;
END $$;

-- Currency types
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

-- Indexer types
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

-- Financial institution types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_instituicao_financeira') THEN
        CREATE TYPE tipo_instituicao_financeira AS ENUM (
            'BANCO',
            'TRADING',
            'OUTROS'
        );
    END IF;
END $$;

-- Liquidity factor types
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

-- Inventory types
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

-- Supplier categories
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

-- Contract status
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

-- Debt status
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

-- Property debt types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_divida_imovel') THEN
        CREATE TYPE tipo_divida_imovel AS ENUM (
            'FINANCIAMENTO_AQUISICAO',
            'FINANCIAMENTO_MELHORIAS',
            'EMPRESTIMO_GARANTIA_REAL',
            'CREDITO_RURAL_IMOVEL',
            'OUTROS'
        );
    END IF;
END $$;

-- Advance status
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

-- Loan purposes
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

-- =============================================================================
-- COMMODITY & INDICATORS TYPES
-- =============================================================================

-- Commodity types
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
            'BOI_GORDO',
            'BEZERRO',
            'VACA_GORDA',
            'OUTROS'
        );
    END IF;
END $$;

-- Commodity units
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

-- Commodity price units
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unidade_preco_commodity') THEN
        CREATE TYPE unidade_preco_commodity AS ENUM (
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
    END IF;
END $$;

-- =============================================================================
-- PATRIMONIO MANAGEMENT TYPES
-- =============================================================================

-- Investment categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_investimento') THEN
        CREATE TYPE categoria_investimento AS ENUM (
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
    END IF;
END $$;

-- Asset sale categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_venda_ativo') THEN
        CREATE TYPE categoria_venda_ativo AS ENUM (
            'EQUIPAMENTO',
            'TRATOR',
            'COLHEITADEIRA',
            'PULVERIZADOR',
            'AERONAVE',
            'VEICULO',
            'MAQUINARIO',
            'OUTROS'
        );
    END IF;
END $$;

-- Land acquisition types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_aquisicao_terra') THEN
        CREATE TYPE tipo_aquisicao_terra AS ENUM (
            'COMPRA',
            'ARRENDAMENTO_LONGO_PRAZO',
            'PARCERIA',
            'OUTROS'
        );
    END IF;
END $$;

-- Equipment status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_equipamento') THEN
        CREATE TYPE status_equipamento AS ENUM (
            'ATIVO',
            'INATIVO',
            'MANUTENCAO',
            'VENDIDO',
            'ALIENADO'
        );
    END IF;
END $$;

-- =============================================================================
-- COMMERCIAL MANAGEMENT TYPES
-- =============================================================================

-- Sale status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_venda') THEN
        CREATE TYPE status_venda AS ENUM (
            'PLANEJADA',
            'EM_ANDAMENTO',
            'CONCLUIDA',
            'CANCELADA'
        );
    END IF;
END $$;

-- Payment methods
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'metodo_pagamento') THEN
        CREATE TYPE metodo_pagamento AS ENUM (
            'DINHEIRO',
            'BOLETO',
            'TRANSFERENCIA',
            'CARTAO',
            'CHEQUE',
            'BARTER',
            'OUTROS'
        );
    END IF;
END $$;

-- Sale periods
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'periodo_venda') THEN
        CREATE TYPE periodo_venda AS ENUM (
            'PRIMEIRA_SAFRA',
            'SEGUNDA_SAFRA',
            'TERCEIRA_SAFRA',
            'ENTRESSAFRA',
            'ANUAL'
        );
    END IF;
END $$;

-- =============================================================================
-- PROJECTIONS MANAGEMENT TYPES
-- =============================================================================

-- Projection status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'projecao_status') THEN
        CREATE TYPE projecao_status AS ENUM (
            'ATIVA',
            'INATIVA',
            'ARQUIVADA'
        );
    END IF;
END $$;

-- Projection types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'projecao_tipo') THEN
        CREATE TYPE projecao_tipo AS ENUM (
            'CULTURA',
            'DIVIDA',
            'CAIXA_DISPONIBILIDADES',
            'FLUXO_CAIXA'
        );
    END IF;
END $$;

-- Safra format
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'safra_formato') THEN
        CREATE TYPE safra_formato AS ENUM (
            'SAFRA_COMPLETA',
            'ANO_CIVIL'
        );
    END IF;
END $$;

-- =============================================================================
-- ALERTS & INDICATORS TYPES
-- =============================================================================

-- Alert types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alerta_tipo') THEN
        CREATE TYPE alerta_tipo AS ENUM (
            'LIQUIDEZ',
            'DIVIDA',
            'FLUXO_CAIXA',
            'VENCIMENTO',
            'SAFRA',
            'MERCADO'
        );
    END IF;
END $$;

-- Alert urgency levels
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alerta_urgencia') THEN
        CREATE TYPE alerta_urgencia AS ENUM (
            'BAIXO',
            'MEDIO',
            'ALTO',
            'CRITICO'
        );
    END IF;
END $$;

-- Alert delivery channels
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alerta_canal_envio') THEN
        CREATE TYPE alerta_canal_envio AS ENUM (
            'EMAIL',
            'SMS',
            'SISTEMA'
        );
    END IF;
END $$;

-- =============================================================================
-- COMPOSITE TYPES FOR COMPLEX DATA
-- =============================================================================

-- Type for financial flow items
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

-- Type for financial indicators
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

-- Type for safra values (multi-safra operations)
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

-- =============================================================================
-- DOMAIN TYPES FOR VALIDATION
-- =============================================================================

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

-- Domain for percentages
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'percentual') THEN
        CREATE DOMAIN percentual AS DECIMAL(5,2)
        CHECK (VALUE >= 0 AND VALUE <= 100);
    END IF;
END $$;

-- =============================================================================
-- TYPE COMMENTS & DOCUMENTATION
-- =============================================================================

-- Authentication & User Management
COMMENT ON TYPE user_role IS 'Níveis de acesso do usuário no sistema';
COMMENT ON TYPE invite_status IS 'Status dos convites enviados aos usuários';

-- Property Management
COMMENT ON TYPE propriedade_tipo IS 'Tipos de propriedade: própria, arrendada, parceria ou comodato';
COMMENT ON TYPE status_propriedade IS 'Status atual da propriedade no sistema';
COMMENT ON TYPE propriedade_anuencia IS 'Status de anuência da propriedade';
COMMENT ON TYPE tipo_pagamento_arrendamento IS 'Formas de pagamento para contratos de arrendamento';

-- Production Management
COMMENT ON TYPE custo_producao_categoria IS 'Categorias de custos de produção agrícola';
COMMENT ON TYPE operacao_pecuaria_ciclo IS 'Tipos de ciclos pecuários';
COMMENT ON TYPE operacao_pecuaria_origem IS 'Origem dos animais na operação pecuária';
COMMENT ON TYPE price_unit_enum IS 'Unidades de precificação para diversos produtos';
COMMENT ON TYPE unidade_produtividade IS 'Unidades de medida de produtividade';
COMMENT ON TYPE unidade_area IS 'Unidades de medida de área';
COMMENT ON TYPE tipo_sistema_producao IS 'Tipos de sistemas de produção';
COMMENT ON TYPE tipo_animal IS 'Tipos de animais para pecuária';
COMMENT ON TYPE categoria_animal IS 'Categorias de animais por idade/função';

-- Financial Management
COMMENT ON TYPE divida_modalidade IS 'Modalidades de dívidas financeiras';
COMMENT ON TYPE moeda_tipo IS 'Tipos de moedas suportadas pelo sistema';
COMMENT ON TYPE indexador_tipo IS 'Tipos de indexadores para correção monetária';
COMMENT ON TYPE tipo_instituicao_financeira IS 'Tipos de instituições financeiras';
COMMENT ON TYPE fator_liquidez_tipo IS 'Tipos de fatores de liquidez';
COMMENT ON TYPE estoque_tipo IS 'Categorias de estoque';
COMMENT ON TYPE categoria_fornecedor IS 'Categorias de fornecedores';
COMMENT ON TYPE status_contrato IS 'Status dos contratos financeiros';
COMMENT ON TYPE status_divida IS 'Status das dívidas';
COMMENT ON TYPE status_adiantamento IS 'Status dos adiantamentos';
COMMENT ON TYPE finalidade_emprestimo IS 'Finalidades dos empréstimos';

-- Commodity & Indicators
COMMENT ON TYPE commodity_tipo IS 'Tipos de commodities agrícolas e pecuárias';
COMMENT ON TYPE unidade_commodity IS 'Unidades de medida para commodities';
COMMENT ON TYPE unidade_preco_commodity IS 'Unidades de medida para preços de commodities';

-- Patrimonio Management
COMMENT ON TYPE categoria_investimento IS 'Categorias de investimentos em patrimônio';
COMMENT ON TYPE categoria_venda_ativo IS 'Categorias para vendas de ativos';
COMMENT ON TYPE tipo_aquisicao_terra IS 'Tipos de aquisição de terras';
COMMENT ON TYPE status_equipamento IS 'Status dos equipamentos e máquinas';

-- Commercial Management
COMMENT ON TYPE status_venda IS 'Status das vendas comerciais';
COMMENT ON TYPE metodo_pagamento IS 'Métodos de pagamento aceitos nas vendas';
COMMENT ON TYPE periodo_venda IS 'Períodos de venda baseados nas safras';

-- Projections Management
COMMENT ON TYPE projecao_status IS 'Status das projeções financeiras';
COMMENT ON TYPE projecao_tipo IS 'Tipos de projeções suportadas';
COMMENT ON TYPE safra_formato IS 'Formatos de representação de safra';

-- Alerts & Indicators
COMMENT ON TYPE alerta_tipo IS 'Tipos de alertas do sistema';
COMMENT ON TYPE alerta_urgencia IS 'Níveis de urgência dos alertas';
COMMENT ON TYPE alerta_canal_envio IS 'Canais de envio de alertas';

-- Composite Types
COMMENT ON TYPE fluxo_pagamento_item IS 'Item de fluxo de pagamento com detalhes';
COMMENT ON TYPE resumo_divida IS 'Resumo consolidado de dívidas';
COMMENT ON TYPE posicao_liquidez IS 'Posição de liquidez consolidada';
COMMENT ON TYPE posicao_commodity IS 'Posição de commodities consolidada';
COMMENT ON TYPE indicadores_financeiros IS 'Indicadores financeiros consolidados';
COMMENT ON TYPE safra_valor IS 'Estrutura para valores por safra';
COMMENT ON TYPE area_cultura IS 'Breakdown de área por cultura';
COMMENT ON TYPE metrica_produtividade IS 'Métricas de produtividade por cultura/safra';
COMMENT ON TYPE custo_breakdown IS 'Breakdown de custos por categoria';

-- Domain Types
COMMENT ON DOMAIN valor_financeiro IS 'Valor financeiro não negativo';
COMMENT ON DOMAIN taxa_juros IS 'Taxa de juros em percentual';
COMMENT ON DOMAIN quantidade_commodity IS 'Quantidade de commodity não negativa';
COMMENT ON DOMAIN percentual_financeiro IS 'Percentual entre 0 e 100';
COMMENT ON DOMAIN ano_fluxo IS 'Ano válido para fluxos de pagamento';
COMMENT ON DOMAIN decimal_positivo IS 'Valor decimal que deve ser positivo';
COMMENT ON DOMAIN area_hectares IS 'Área em hectares com validação de range';
COMMENT ON DOMAIN produtividade_valor IS 'Valor de produtividade com validação';
COMMENT ON DOMAIN valor_monetario IS 'Valor monetário não negativo';
COMMENT ON DOMAIN percentual IS 'Valor percentual entre 0 e 100';

-- Other operational expenses categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outras_despesas_categoria') THEN
        CREATE TYPE outras_despesas_categoria AS ENUM (
            'TRIBUTARIAS',
            'PRO_LABORE',
            'OUTRAS_OPERACIONAIS',
            'DESPESAS_ADMINISTRATIVAS',
            'DESPESAS_COMERCIAIS',
            'DESPESAS_FINANCEIRAS',
            'MANUTENCAO',
            'SEGUROS',
            'CONSULTORIAS',
            'OUTROS'
        );
    END IF;
END $$;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== SR-CONSULTORIA TYPES CREATED SUCCESSFULLY ===';
    RAISE NOTICE 'Consolidated types from all modules:';
    RAISE NOTICE '- Authentication & User Management';
    RAISE NOTICE '- Property Management'; 
    RAISE NOTICE '- Production Management';
    RAISE NOTICE '- Financial Management';
    RAISE NOTICE '- Commodity & Indicators';
    RAISE NOTICE '- Patrimonio Management';
    RAISE NOTICE '- Commercial Management';
    RAISE NOTICE '- Projections Management';
    RAISE NOTICE '- Alerts & Indicators';
    RAISE NOTICE 'All types are ready for multi-tenant JSONB architecture!';
END
$$;