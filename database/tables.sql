-- =============================================================================
-- SR-CONSULTORIA: CONSOLIDATED TABLES
-- =============================================================================
-- This file contains all PostgreSQL table definitions from all modules
-- Multi-tenant SaaS architecture with JSONB multi-year support
--
-- ⚠️  EXISTING TABLES (already created in database - COMMENTED OUT):
-- - organizacoes (1 row - 64 kB)
-- - associacoes (2 rows - 104 kB) 
-- - convites (20 rows - 72 kB)
-- - culturas (7 rows - 56 kB)
-- - sistemas (2 rows - 56 kB)
-- - ciclos (2 rows - 56 kB)
-- - safras (9 rows - 56 kB)
-- - configuracao_indicador (5 rows - 80 kB)
--
-- 📋 RECOMMENDED CREATION ORDER (for new tables):
-- 
-- 🏗️ FOUNDATION TABLES (create first):
-- 1. propriedades (base for all property-related data)
--
-- 🌱 PRODUCTION TABLES (depend on propriedades + existing tables):  
-- 2. areas_plantio (propriedades + culturas + sistemas + ciclos + safras)
-- 3. produtividades (propriedades + culturas + sistemas)  
-- 4. custos_producao (propriedades + culturas + sistemas)
-- 5. arrendamentos (propriedades + safras)
-- 6. benfeitorias (propriedades)
-- 7. rebanhos (propriedades)
-- 8. operacoes_pecuarias (propriedades)
--
-- 💰 FINANCIAL TABLES (independent or depend on propriedades):
-- 9. dividas_bancarias, dividas_imoveis (some depend on propriedades)  
-- 10. fornecedores, fatores_liquidez, estoques, estoques_commodities
-- 11. contratos_recebiveis, adiantamentos_fornecedores, emprestimos_terceiros
-- 12. outras_despesas (new financial module table)
--
-- 🏭 PATRIMONIO TABLES (independent):
-- 13. maquinas_equipamentos, investimentos, vendas_ativos, planos_investimento, planos_aquisicao_terras
--
-- 🛒 COMMERCIAL TABLES (depend on propriedades):
-- 14. vendas_pecuaria, vendas_sementes (propriedades)
-- 15. precos_comerciais, planejamento_vendas (independent)
--
-- 📊 INDICATORS & PROJECTIONS (mostly independent):
-- 16. commodity_price_projections (safras)
-- 17. parametros_sensibilidade (safras)
--
-- ⚠️ NOTE: Tables marked as EXISTING above should be SKIPPED during creation!
--
-- 🚀 QUICK START SUMMARY:
-- 1. Skip all tables marked with ✅ EXISTING TABLE (8 tables already in database)
-- 2. Start with: propriedades (foundation table)  
-- 3. Then create: areas_plantio, produtividades, custos_producao (production core)
-- 4. Follow with: arrendamentos, benfeitorias, rebanhos (property extensions)
-- 5. Add financial: dividas_bancarias, fornecedores, fatores_liquidez, outras_despesas
-- 6. Complete with: patrimonio, commercial, and indicators tables
-- 7. Run seed.sql after all tables are created
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

-- =============================================================================
-- CORE AUTHENTICATION & USER MANAGEMENT TABLES
-- =============================================================================

-- Organizations table (core multi-tenant table)
-- ✅ EXISTING TABLE - organizacoes (1 row - 64 kB) - COMMENTED OUT
/*
CREATE TABLE IF NOT EXISTS organizacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo TEXT,
    endereco TEXT,
    telefone TEXT,
    email TEXT,
    website TEXT,
    cpf TEXT,
    cnpj TEXT,
    cep TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT,
    estado TEXT,
    inscricao_estadual TEXT,
    perfil_linkedin TEXT,
    perfil_instagram TEXT,
    canal_youtube TEXT,
    perfil_x TEXT,
    perfil_tiktok TEXT,
    pagina_facebook TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_organizacao_nome_not_empty CHECK (nome != ''),
    CONSTRAINT chk_organizacao_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);
*/

-- ✅ EXISTING TABLE - associacoes (2 rows - 104 kB) - COMMENTED OUT
/*
CREATE TABLE IF NOT EXISTS associacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL, -- References Supabase auth.users
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    funcao user_role NOT NULL,
    eh_proprietario BOOLEAN NOT NULL DEFAULT false,
    data_adicao TIMESTAMPTZ NOT NULL DEFAULT now(),
    ultimo_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT uk_associacao_usuario_organizacao UNIQUE (usuario_id, organizacao_id)
);
*/

-- ✅ EXISTING TABLE - convites (20 rows - 72 kB) - COMMENTED OUT  
/*
CREATE TABLE IF NOT EXISTS convites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    funcao user_role NOT NULL,
    status invite_status NOT NULL DEFAULT 'PENDENTE',
    ultimo_envio TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_convite_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT uk_convite_organizacao_email UNIQUE (organizacao_id, email)
);
*/

-- =============================================================================
-- PRODUCTION CONFIGURATION TABLES
-- =============================================================================

-- Culturas (Crops)
-- ✅ EXISTING TABLE - culturas (7 rows - 56 kB) - SKIP CREATION
/*
CREATE TABLE IF NOT EXISTS culturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT uk_culturas_organizacao_nome UNIQUE (organizacao_id, nome)
);
*/

-- Sistemas de Produção (Production Systems)
-- ✅ EXISTING TABLE - sistemas (2 rows - 56 kB) - SKIP CREATION  
/*
CREATE TABLE IF NOT EXISTS sistemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT uk_sistemas_organizacao_nome UNIQUE (organizacao_id, nome)
);
*/

-- Ciclos de Produção (Production Cycles)
-- ✅ EXISTING TABLE - ciclos (2 rows - 56 kB) - SKIP CREATION
/*
CREATE TABLE IF NOT EXISTS ciclos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT uk_ciclos_organizacao_nome UNIQUE (organizacao_id, nome)
);
*/

-- Safras (Harvest Years)
-- ✅ EXISTING TABLE - safras (9 rows - 56 kB) - SKIP CREATION
/*
CREATE TABLE IF NOT EXISTS safras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    ano_inicio INTEGER NOT NULL,
    ano_fim INTEGER NOT NULL,
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    CONSTRAINT uk_safras_organizacao_nome UNIQUE (organizacao_id, nome),
    CONSTRAINT chk_safras_anos_validos CHECK (ano_fim >= ano_inicio),
    CONSTRAINT chk_safras_anos_range CHECK (ano_inicio >= 2000 AND ano_fim <= 2100)
);
*/

-- =============================================================================
-- PROPERTIES MANAGEMENT TABLES
-- =============================================================================

-- Properties table
CREATE TABLE IF NOT EXISTS propriedades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    ano_aquisicao INTEGER,
    proprietario TEXT,
    cidade TEXT,
    estado TEXT,
    numero_matricula TEXT,
    area_total DECIMAL(15, 4),
    area_cultivada DECIMAL(15, 4),
    valor_atual DECIMAL(15, 2),
    onus TEXT,
    avaliacao_banco DECIMAL(15, 2),
    tipo propriedade_tipo NOT NULL DEFAULT 'PROPRIO',
    status status_propriedade NOT NULL DEFAULT 'ATIVA',
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

-- Lease contracts with JSONB multi-year costs
CREATE TABLE IF NOT EXISTS arrendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    numero_arrendamento TEXT NOT NULL,
    nome_fazenda TEXT NOT NULL,
    arrendantes TEXT NOT NULL,
    data_inicio DATE NOT NULL,
    data_termino DATE NOT NULL,
    area_fazenda DECIMAL(15, 4) NOT NULL,
    area_arrendada DECIMAL(15, 4) NOT NULL,
    custo_hectare DECIMAL(15, 4),
    tipo_pagamento tipo_pagamento_arrendamento NOT NULL DEFAULT 'SACAS',
    custos_por_ano JSONB NOT NULL, -- {"safra_id": {"custo per hectare": 125.50}, ...}
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

-- Property improvements
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
-- PRODUCTION DATA TABLES (JSONB MULTI-YEAR)
-- =============================================================================

-- Planting areas with multi-safra JSONB structure
CREATE TABLE IF NOT EXISTS areas_plantio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    cultura_id UUID NOT NULL REFERENCES culturas(id) ON DELETE RESTRICT,
    sistema_id UUID NOT NULL REFERENCES sistemas(id) ON DELETE RESTRICT,
    ciclo_id UUID NOT NULL REFERENCES ciclos(id) ON DELETE RESTRICT,
    areas_por_safra JSONB NOT NULL, -- {"safra_id": valor, ...}
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT uk_areas_plantio_combinacao UNIQUE (organizacao_id, propriedade_id, cultura_id, sistema_id, ciclo_id),
    CONSTRAINT chk_areas_plantio_areas_not_empty CHECK (jsonb_typeof(areas_por_safra) = 'object' AND areas_por_safra != '{}')
);

-- Productivity records with multi-safra JSONB structure
CREATE TABLE IF NOT EXISTS produtividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID REFERENCES propriedades(id) ON DELETE CASCADE,
    cultura_id UUID NOT NULL REFERENCES culturas(id) ON DELETE RESTRICT,
    sistema_id UUID NOT NULL REFERENCES sistemas(id) ON DELETE RESTRICT,
    produtividades_por_safra JSONB NOT NULL, -- {"safra_id": {"sc/ha": 60}, ...}
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT uk_produtividades_combinacao UNIQUE (organizacao_id, propriedade_id, cultura_id, sistema_id),
    CONSTRAINT chk_produtividades_not_empty CHECK (jsonb_typeof(produtividades_por_safra) = 'object' AND produtividades_por_safra != '{}')
);

-- Production costs with multi-safra JSONB structure
CREATE TABLE IF NOT EXISTS custos_producao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID REFERENCES propriedades(id) ON DELETE CASCADE,
    cultura_id UUID NOT NULL REFERENCES culturas(id) ON DELETE RESTRICT,
    sistema_id UUID NOT NULL REFERENCES sistemas(id) ON DELETE RESTRICT,
    categoria custo_producao_categoria NOT NULL,
    custos_por_safra JSONB NOT NULL, -- {"safra_id": valor, ...}
    descricao TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT uk_custos_producao_combinacao UNIQUE (organizacao_id, propriedade_id, cultura_id, sistema_id, categoria),
    CONSTRAINT chk_custos_producao_not_empty CHECK (jsonb_typeof(custos_por_safra) = 'object' AND custos_por_safra != '{}')
);

-- Livestock records
CREATE TABLE IF NOT EXISTS rebanhos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    tipo_animal TEXT NOT NULL,
    categoria TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(12,2) NOT NULL,
    unidade_preco TEXT DEFAULT 'CABECA',
    numero_cabecas INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_rebanhos_quantidade_positive CHECK (quantidade > 0),
    CONSTRAINT chk_rebanhos_preco_positive CHECK (preco_unitario > 0),
    CONSTRAINT chk_rebanhos_numero_cabecas_non_negative CHECK (numero_cabecas >= 0),
    CONSTRAINT chk_rebanhos_unidade_preco_valid CHECK (unidade_preco IN ('CABECA', 'KG', 'ARROBA', 'LOTE'))
);

-- Livestock operations
CREATE TABLE IF NOT EXISTS operacoes_pecuarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    ciclo TEXT NOT NULL,
    origem TEXT NOT NULL,
    volume_abate_por_safra JSONB, -- {"2023/24": {"volume": 100, "unidade": "cabecas"}}
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- FINANCIAL MANAGEMENT TABLES (JSONB MULTI-YEAR)
-- =============================================================================

-- Financial debts (banks, trading companies, others)
CREATE TABLE IF NOT EXISTS dividas_bancarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    tipo tipo_instituicao_financeira NOT NULL,
    modalidade divida_modalidade NOT NULL,
    instituicao_bancaria TEXT NOT NULL,
    ano_contratacao INTEGER NOT NULL,
    indexador TEXT NOT NULL,
    taxa_real taxa_juros NOT NULL,
    fluxo_pagamento_anual JSONB NOT NULL, -- {"safra_id": valor, ...}
    moeda moeda_tipo NOT NULL DEFAULT 'BRL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_dividas_bancarias_ano_valido CHECK (ano_contratacao >= 2000 AND ano_contratacao <= 2100),
    CONSTRAINT chk_dividas_bancarias_fluxo_not_empty CHECK (jsonb_typeof(fluxo_pagamento_anual) = 'object' AND fluxo_pagamento_anual != '{}')
);

-- Property debts
CREATE TABLE IF NOT EXISTS dividas_imoveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    tipo_divida tipo_divida_imovel NOT NULL,
    credor TEXT NOT NULL,
    data_aquisicao DATE NOT NULL,
    data_vencimento DATE NOT NULL,
    valor_total valor_financeiro NOT NULL,
    fluxo_pagamento_anual JSONB NOT NULL, -- {"safra_id": valor, ...}
    moeda moeda_tipo NOT NULL DEFAULT 'BRL',
    status status_divida DEFAULT 'ATIVA',
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_dividas_imoveis_datas CHECK (data_vencimento > data_aquisicao),
    CONSTRAINT chk_dividas_imoveis_fluxo_not_empty CHECK (jsonb_typeof(fluxo_pagamento_anual) = 'object' AND fluxo_pagamento_anual != '{}')
);

-- Suppliers with multi-year values
CREATE TABLE IF NOT EXISTS fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    nome TEXT NOT NULL,
    categoria categoria_fornecedor NOT NULL,
    cnpj_cpf TEXT,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    valores_por_ano JSONB NOT NULL, -- {"safra_id": valor, ...}
    moeda moeda_tipo NOT NULL DEFAULT 'BRL',
    status status_contrato DEFAULT 'ATIVO',
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT uk_fornecedores_organizacao_safra_nome UNIQUE (organizacao_id, safra_id, nome),
    CONSTRAINT chk_fornecedores_valores_not_empty CHECK (jsonb_typeof(valores_por_ano) = 'object' AND valores_por_ano != '{}')
);

-- Supplier advances
CREATE TABLE IF NOT EXISTS adiantamentos_fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    fornecedor_id UUID NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
    valores_por_ano JSONB NOT NULL, -- {"safra_id": valor, ...}
    data_adiantamento DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE,
    status status_adiantamento DEFAULT 'PENDENTE',
    finalidade TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_adiantamentos_data_vencimento CHECK (data_vencimento IS NULL OR data_vencimento >= data_adiantamento),
    CONSTRAINT chk_adiantamentos_valores_not_empty CHECK (jsonb_typeof(valores_por_ano) = 'object' AND valores_por_ano != '{}')
);

-- Liquidity factors
CREATE TABLE IF NOT EXISTS fatores_liquidez (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    tipo fator_liquidez_tipo NOT NULL,
    banco TEXT,
    descricao TEXT NOT NULL,
    valores_por_ano JSONB NOT NULL, -- {"safra_id": valor, ...}
    moeda moeda_tipo NOT NULL DEFAULT 'BRL',
    data_referencia DATE NOT NULL DEFAULT CURRENT_DATE,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_fatores_liquidez_valores_not_empty CHECK (jsonb_typeof(valores_por_ano) = 'object' AND valores_por_ano != '{}')
);

-- Inventory
CREATE TABLE IF NOT EXISTS estoques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    tipo estoque_tipo NOT NULL,
    descricao TEXT NOT NULL,
    valores_por_ano JSONB NOT NULL, -- {"safra_id": valor, ...}
    data_avaliacao DATE NOT NULL DEFAULT CURRENT_DATE,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_estoques_valores_not_empty CHECK (jsonb_typeof(valores_por_ano) = 'object' AND valores_por_ano != '{}')
);

-- Commodity inventory
CREATE TABLE IF NOT EXISTS estoques_commodities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    commodity commodity_tipo NOT NULL,
    valores_totais_por_ano JSONB NOT NULL, -- {"safra_id": valor, ...}
    unidade unidade_commodity NOT NULL,
    data_avaliacao DATE NOT NULL DEFAULT CURRENT_DATE,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_estoques_commodities_valores_not_empty CHECK (jsonb_typeof(valores_totais_por_ano) = 'object' AND valores_totais_por_ano != '{}')
);

-- Receivable contracts
CREATE TABLE IF NOT EXISTS contratos_recebiveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    cliente TEXT NOT NULL,
    commodity commodity_tipo,
    valores_por_ano JSONB NOT NULL, -- {"safra_id": valor, ...}
    data_vencimento DATE NOT NULL,
    status status_contrato DEFAULT 'ATIVO',
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_contratos_recebiveis_data_futura CHECK (data_vencimento >= CURRENT_DATE),
    CONSTRAINT chk_contratos_recebiveis_valores_not_empty CHECK (jsonb_typeof(valores_por_ano) = 'object' AND valores_por_ano != '{}')
);

-- Third-party loans
CREATE TABLE IF NOT EXISTS emprestimos_terceiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    devedor TEXT NOT NULL,
    valores_por_ano JSONB NOT NULL, -- {"safra_id": valor, ...}
    data_emprestimo DATE NOT NULL DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    taxa_juros taxa_juros DEFAULT 0,
    finalidade finalidade_emprestimo NOT NULL,
    status status_contrato DEFAULT 'ATIVO',
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_emprestimos_terceiros_datas CHECK (data_vencimento > data_emprestimo),
    CONSTRAINT chk_emprestimos_terceiros_valores_not_empty CHECK (jsonb_typeof(valores_por_ano) = 'object' AND valores_por_ano != '{}')
);

-- =============================================================================
-- PATRIMONIO MANAGEMENT TABLES
-- =============================================================================

-- Land acquisition with safra_id integration
CREATE TABLE IF NOT EXISTS aquisicao_terras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    nome_fazenda TEXT NOT NULL,
    ano INTEGER NOT NULL,
    hectares DECIMAL(15, 4) NOT NULL,
    sacas DECIMAL(15, 2),
    tipo tipo_aquisicao_terra NOT NULL DEFAULT 'COMPRA',
    total_sacas DECIMAL(15, 2),
    valor_total DECIMAL(15, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_hectares_positive CHECK (hectares > 0),
    CONSTRAINT chk_sacas_positive CHECK (sacas IS NULL OR sacas > 0),
    CONSTRAINT chk_total_sacas_positive CHECK (total_sacas IS NULL OR total_sacas > 0),
    CONSTRAINT chk_valor_total_positive CHECK (valor_total IS NULL OR valor_total > 0),
    CONSTRAINT chk_ano_valid CHECK (ano >= 1900 AND ano <= EXTRACT(YEAR FROM now()) + 10)
);

-- Investments with safra_id integration
CREATE TABLE IF NOT EXISTS investimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    categoria categoria_investimento NOT NULL,
    ano INTEGER NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(15, 2) NOT NULL,
    valor_total DECIMAL(15, 2) NOT NULL,
    tipo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_quantidade_positive CHECK (quantidade > 0),
    CONSTRAINT chk_valor_unitario_positive CHECK (valor_unitario > 0),
    CONSTRAINT chk_valor_total_positive CHECK (valor_total > 0),
    CONSTRAINT chk_ano_investimento_valid CHECK (ano >= 1900 AND ano <= EXTRACT(YEAR FROM now()) + 10),
    CONSTRAINT chk_valor_total_consistent CHECK (ABS(valor_total - (valor_unitario * quantidade)) < 0.01)
);

-- Asset sales with safra_id integration
CREATE TABLE IF NOT EXISTS vendas_ativos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    categoria categoria_venda_ativo NOT NULL,
    ano INTEGER NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(15, 2) NOT NULL,
    valor_total DECIMAL(15, 2) NOT NULL,
    descricao TEXT,
    data_venda DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_venda_quantidade_positive CHECK (quantidade > 0),
    CONSTRAINT chk_venda_valor_unitario_positive CHECK (valor_unitario > 0),
    CONSTRAINT chk_venda_valor_total_positive CHECK (valor_total > 0),
    CONSTRAINT chk_venda_ano_valid CHECK (ano >= 1900 AND ano <= EXTRACT(YEAR FROM now()) + 10),
    CONSTRAINT chk_venda_valor_total_consistent CHECK (ABS(valor_total - (valor_unitario * quantidade)) < 0.01),
    CONSTRAINT chk_data_venda_valid CHECK (data_venda IS NULL OR data_venda <= now()::DATE)
);

-- Equipment (WITHOUT safra_id as requested)
CREATE TABLE IF NOT EXISTS maquinas_equipamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    equipamento TEXT NOT NULL,
    ano_fabricacao INTEGER NOT NULL,
    marca TEXT,
    modelo TEXT,
    alienado BOOLEAN NOT NULL DEFAULT false,
    numero_chassi TEXT,
    valor_aquisicao DECIMAL(15, 2),
    numero_serie TEXT,
    quantidade INTEGER DEFAULT 1,
    valor_unitario DECIMAL(15, 2),
    reposicao_sr DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_equipamento_ano_valid CHECK (ano >= 1900 AND ano <= EXTRACT(YEAR FROM now()) + 10),
    CONSTRAINT chk_equipamento_valor_positive CHECK (valor_aquisicao IS NULL OR valor_aquisicao > 0),
    CONSTRAINT chk_quantidade_positive CHECK (quantidade IS NULL OR quantidade > 0),
    CONSTRAINT chk_valor_unitario_positive CHECK (valor_unitario IS NULL OR valor_unitario > 0),
    CONSTRAINT chk_reposicao_sr_non_negative CHECK (reposicao_sr IS NULL OR reposicao_sr >= 0)
);

-- =============================================================================
-- COMMERCIAL MANAGEMENT TABLES
-- =============================================================================

-- Livestock sales
CREATE TABLE IF NOT EXISTS vendas_pecuaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    receita_operacional_bruta DECIMAL(15, 2) NOT NULL,
    impostos_vendas DECIMAL(15, 2) DEFAULT 0,
    comissao_vendas DECIMAL(15, 2) DEFAULT 0,
    logistica_entregas DECIMAL(15, 2) DEFAULT 0,
    custo_mercadorias_vendidas DECIMAL(15, 2) DEFAULT 0,
    despesas_gerais DECIMAL(15, 2) DEFAULT 0,
    imposto_renda DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_receita_bruta_positive CHECK (receita_operacional_bruta > 0),
    CONSTRAINT chk_impostos_vendas_non_negative CHECK (impostos_vendas >= 0),
    CONSTRAINT chk_comissao_vendas_non_negative CHECK (comissao_vendas >= 0),
    CONSTRAINT chk_logistica_entregas_non_negative CHECK (logistica_entregas >= 0),
    CONSTRAINT chk_custo_mercadorias_non_negative CHECK (custo_mercadorias_vendidas >= 0),
    CONSTRAINT chk_despesas_gerais_non_negative CHECK (despesas_gerais >= 0),
    CONSTRAINT chk_imposto_renda_non_negative CHECK (imposto_renda >= 0)
);

-- Seed sales
CREATE TABLE IF NOT EXISTS vendas_sementes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    cultura_id UUID NOT NULL REFERENCES culturas(id) ON DELETE RESTRICT,
    receita_operacional_bruta DECIMAL(15, 2) NOT NULL,
    impostos_vendas DECIMAL(15, 2) DEFAULT 0,
    comissao_vendas DECIMAL(15, 2) DEFAULT 0,
    logistica_entregas DECIMAL(15, 2) DEFAULT 0,
    custo_mercadorias_vendidas DECIMAL(15, 2) DEFAULT 0,
    despesas_gerais DECIMAL(15, 2) DEFAULT 0,
    imposto_renda DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_sementes_receita_bruta_positive CHECK (receita_operacional_bruta > 0),
    CONSTRAINT chk_sementes_impostos_vendas_non_negative CHECK (impostos_vendas >= 0),
    CONSTRAINT chk_sementes_comissao_vendas_non_negative CHECK (comissao_vendas >= 0),
    CONSTRAINT chk_sementes_logistica_entregas_non_negative CHECK (logistica_entregas >= 0),
    CONSTRAINT chk_sementes_custo_mercadorias_non_negative CHECK (custo_mercadorias_vendidas >= 0),
    CONSTRAINT chk_sementes_despesas_gerais_non_negative CHECK (despesas_gerais >= 0),
    CONSTRAINT chk_sementes_imposto_renda_non_negative CHECK (imposto_renda >= 0)
);

-- =============================================================================
-- INDICATORS MANAGEMENT TABLES
-- =============================================================================

-- Commodity price projections with JSONB multi-year structure
CREATE TABLE IF NOT EXISTS commodity_price_projections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    commodity_type commodity_tipo NOT NULL,
    unit unidade_preco_commodity NOT NULL DEFAULT 'R$/SACA',
    current_price DECIMAL(15, 4) NOT NULL,
    precos_por_ano JSONB NOT NULL, -- {"safra_id": valor, ...}
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT uk_commodity_projections_org_safra_type UNIQUE(organizacao_id, safra_id, commodity_type),
    CONSTRAINT chk_precos_por_ano_not_empty CHECK (jsonb_typeof(precos_por_ano) = 'object' AND precos_por_ano != '{}'),
    CONSTRAINT chk_current_price_positive CHECK (current_price > 0)
);

-- Indicator configuration per organization
-- ✅ EXISTING TABLE - configuracao_indicador (5 rows - 80 kB) - SKIP CREATION
/*
CREATE TABLE IF NOT EXISTS configuracao_indicadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    limiares_liquidez JSONB NOT NULL DEFAULT '{"baixo": 0.5, "medio": 1.0, "alto": 2.0}',
    limiares_divida_ebitda JSONB NOT NULL DEFAULT '{"baixo": 2.0, "medio": 3.5, "alto": 5.0}',
    limiares_divida_receita JSONB NOT NULL DEFAULT '{"baixo": 0.3, "medio": 0.5, "alto": 0.7}',
    limiares_divida_patrimonio JSONB NOT NULL DEFAULT '{"baixo": 0.4, "medio": 0.6, "alto": 0.8}',
    limiares_ltv JSONB NOT NULL DEFAULT '{"baixo": 0.5, "medio": 0.7, "alto": 0.85}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT uk_config_indicadores_org UNIQUE(organizacao_id)
);
*/

-- Sensitivity analysis parameters
CREATE TABLE IF NOT EXISTS parametros_sensibilidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    variacoes_cambio JSONB NOT NULL DEFAULT '{"cenario_baixo": -0.15, "cenario_base": 0.0, "cenario_alto": 0.20}',
    variacoes_precos_commodities JSONB NOT NULL DEFAULT '{"cenario_baixo": -0.25, "cenario_base": 0.0, "cenario_alto": 0.30}',
    variacoes_produtividade JSONB NOT NULL DEFAULT '{"cenario_baixo": -0.20, "cenario_base": 0.0, "cenario_alto": 0.15}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT uk_parametros_sensibilidade UNIQUE(organizacao_id, safra_id)
);

-- Other operational expenses with JSONB safra-based structure
CREATE TABLE IF NOT EXISTS outras_despesas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    categoria outras_despesas_categoria NOT NULL,
    descricao TEXT,
    valores_por_safra JSONB NOT NULL, -- {"safra_id": valor, ...}
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT chk_outras_despesas_valores_not_empty CHECK (jsonb_typeof(valores_por_safra) = 'object' AND valores_por_safra != '{}'),
    CONSTRAINT uk_outras_despesas_org_categoria UNIQUE(organizacao_id, categoria)
);

-- =============================================================================
-- TABLE COMMENTS & DOCUMENTATION
-- =============================================================================

-- Core tables
COMMENT ON TABLE propriedades IS 'Cadastro de propriedades rurais da organização';
COMMENT ON TABLE arrendamentos IS 'Contratos de arrendamento usando estrutura JSONB para custos anuais por safra';
COMMENT ON TABLE benfeitorias IS 'Benfeitorias e melhorias realizadas nas propriedades';

-- Production management
COMMENT ON TABLE areas_plantio IS 'Áreas plantadas multi-safra usando JSONB';
COMMENT ON TABLE produtividades IS 'Registros de produtividade multi-safra usando JSONB';
COMMENT ON TABLE custos_producao IS 'Custos de produção multi-safra usando JSONB';
COMMENT ON TABLE rebanhos IS 'Cadastro do rebanho por propriedade';
COMMENT ON TABLE operacoes_pecuarias IS 'Operações e ciclos pecuários';

-- Financial management
COMMENT ON TABLE dividas_bancarias IS 'Dívidas financeiras (bancos, tradings, outros) com fluxo de pagamento multi-ano em JSONB';
COMMENT ON TABLE dividas_imoveis IS 'Dívidas de imóveis com fluxo de pagamento multi-ano em JSONB';
COMMENT ON TABLE fornecedores IS 'Fornecedores com valores multi-ano em JSONB';
COMMENT ON TABLE adiantamentos_fornecedores IS 'Adiantamentos feitos a fornecedores com valores multi-ano em JSONB';
COMMENT ON TABLE fatores_liquidez IS 'Fatores de liquidez da organização com valores multi-ano em JSONB';
COMMENT ON TABLE estoques IS 'Estoques gerais por categoria com valores multi-ano em JSONB';
COMMENT ON TABLE estoques_commodities IS 'Estoques de commodities com quantidades e valores multi-ano em JSONB';
COMMENT ON TABLE contratos_recebiveis IS 'Contratos a receber de clientes com valores multi-ano em JSONB';
COMMENT ON TABLE emprestimos_terceiros IS 'Empréstimos concedidos a terceiros com valores multi-ano em JSONB';

-- Patrimonio management
COMMENT ON TABLE aquisicao_terras IS 'Registro de aquisições de terras por safra';
COMMENT ON TABLE investimentos IS 'Registro de investimentos realizados por safra';
COMMENT ON TABLE vendas_ativos IS 'Registro de vendas de ativos por safra';
COMMENT ON TABLE maquinas_equipamentos IS 'Cadastro de máquinas e equipamentos (sem vínculo com safra)';

-- Commercial management
COMMENT ON TABLE vendas_pecuaria IS 'Vendas de pecuária por propriedade e safra';
COMMENT ON TABLE vendas_sementes IS 'Vendas de sementes por propriedade, safra e cultura';

-- Indicators management
COMMENT ON TABLE commodity_price_projections IS 'Projeções de preços de commodities usando estrutura JSONB para múltiplos anos por safra';
COMMENT ON TABLE outras_despesas IS 'Outras despesas operacionais organizadas por categoria com valores JSONB por safra';
COMMENT ON TABLE parametros_sensibilidade IS 'Parâmetros para análise de sensibilidade por safra';

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== SR-CONSULTORIA TABLES CREATED SUCCESSFULLY ===';
    RAISE NOTICE 'Database schema ready for multi-tenant agricultural consulting platform:';
    RAISE NOTICE '- % core authentication & organization tables', 3;
    RAISE NOTICE '- % production configuration tables', 4;
    RAISE NOTICE '- % property management tables', 3;
    RAISE NOTICE '- % production data tables (JSONB multi-year)', 5;
    RAISE NOTICE '- % financial management tables (JSONB multi-year)', 9;
    RAISE NOTICE '- % patrimonio management tables', 4;
    RAISE NOTICE '- % commercial management tables', 2;
    RAISE NOTICE '- % indicators management tables', 3;
    RAISE NOTICE 'Total: % tables with JSONB multi-year architecture!', 33;
    RAISE NOTICE 'Ready for safra_id integration and tenant isolation!';
END
$$;