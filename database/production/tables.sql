-- ==========================================
-- SR-Consultoria: Production Module Tables
-- ==========================================

-- ==========================================
-- CORE CONFIGURATION TABLES
-- ==========================================

-- Culturas (Crops)
CREATE TABLE IF NOT EXISTS culturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL, -- SOJA, MILHO, TRIGO, ETC.
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT uk_culturas_organizacao_nome UNIQUE (organizacao_id, nome)
);

-- Sistemas de Produção (Production Systems)
CREATE TABLE IF NOT EXISTS sistemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL, -- SEQUEIRO, IRRIGADO, etc.
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT uk_sistemas_organizacao_nome UNIQUE (organizacao_id, nome)
);

-- Ciclos de Produção (Production Cycles)
CREATE TABLE IF NOT EXISTS ciclos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome VARCHAR(50) NOT NULL, -- 1ª SAFRA, 2ª SAFRA, 3ª SAFRA
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT uk_ciclos_organizacao_nome UNIQUE (organizacao_id, nome)
);

-- Safras (Harvest Years)
CREATE TABLE IF NOT EXISTS safras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome VARCHAR(20) NOT NULL, -- "2023/24"
    ano_inicio INTEGER NOT NULL,
    ano_fim INTEGER NOT NULL,
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT uk_safras_organizacao_nome UNIQUE (organizacao_id, nome),
    CONSTRAINT chk_safras_anos_validos CHECK (ano_fim >= ano_inicio),
    CONSTRAINT chk_safras_anos_range CHECK (ano_inicio >= 2000 AND ano_fim <= 2100)
);

-- ==========================================
-- PRODUCTION DATA TABLES (Multi-Safra JSONB)
-- ==========================================

-- Áreas de Plantio (Planting Areas) - Multi-Safra
CREATE TABLE IF NOT EXISTS areas_plantio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    cultura_id UUID NOT NULL REFERENCES culturas(id) ON DELETE RESTRICT,
    sistema_id UUID NOT NULL REFERENCES sistemas(id) ON DELETE RESTRICT,
    ciclo_id UUID NOT NULL REFERENCES ciclos(id) ON DELETE RESTRICT,
    areas_por_safra JSONB NOT NULL, -- {"safra_id": area_value, ...}
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate entries
    CONSTRAINT uk_areas_plantio_combinacao UNIQUE (
        organizacao_id, propriedade_id, cultura_id, 
        sistema_id, ciclo_id
    ),
    
    -- Validation constraints
    CONSTRAINT chk_areas_plantio_areas_not_empty CHECK (jsonb_typeof(areas_por_safra) = 'object' AND areas_por_safra != '{}')
);

-- Produtividades (Productivity Records) - Multi-Safra
CREATE TABLE IF NOT EXISTS produtividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID REFERENCES propriedades(id) ON DELETE CASCADE,
    cultura_id UUID NOT NULL REFERENCES culturas(id) ON DELETE RESTRICT,
    sistema_id UUID NOT NULL REFERENCES sistemas(id) ON DELETE RESTRICT,
    produtividades_por_safra JSONB NOT NULL, -- {"safra_id": {"sc/ha": 60}, ...}
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate entries
    CONSTRAINT uk_produtividades_combinacao UNIQUE (
        organizacao_id, propriedade_id, cultura_id, sistema_id
    ),
    
    -- Validation constraints
    CONSTRAINT chk_produtividades_not_empty CHECK (jsonb_typeof(produtividades_por_safra) = 'object' AND produtividades_por_safra != '{}')
);

-- Custos de Produção (Production Costs) - Multi-Safra
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate entries
    CONSTRAINT uk_custos_producao_combinacao UNIQUE (
        organizacao_id, propriedade_id, cultura_id, 
        sistema_id, categoria
    ),
    
    -- Validation constraints
    CONSTRAINT chk_custos_producao_not_empty CHECK (jsonb_typeof(custos_por_safra) = 'object' AND custos_por_safra != '{}')
);

-- ==========================================
-- LIVESTOCK TABLES
-- ==========================================

-- Rebanhos (Livestock)
CREATE TABLE IF NOT EXISTS rebanhos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    tipo_animal VARCHAR(100) NOT NULL, -- Bovino, Suíno, Ovino, etc.
    categoria VARCHAR(100) NOT NULL, -- Macho/Fêmea por faixa etária
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(12,2) NOT NULL,
    unidade_preco VARCHAR(20) DEFAULT 'CABECA',
    numero_cabecas INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validation constraints
    CONSTRAINT chk_rebanhos_quantidade_positive CHECK (quantidade > 0),
    CONSTRAINT chk_rebanhos_preco_positive CHECK (preco_unitario > 0),
    CONSTRAINT chk_rebanhos_numero_cabecas_non_negative CHECK (numero_cabecas >= 0),
    CONSTRAINT chk_rebanhos_unidade_preco_valid CHECK (
        unidade_preco IN ('CABECA', 'KG', 'ARROBA', 'LOTE')
    )
);

-- Operações Pecuárias (Livestock Operations)
CREATE TABLE IF NOT EXISTS operacoes_pecuarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    ciclo VARCHAR(50) NOT NULL, -- CONFINAMENTO, PASTO, etc.
    origem VARCHAR(50) NOT NULL, -- PROPRIO, TERCEIROS, etc.
    volume_abate_por_safra JSONB, -- {"2023/24": {"volume": 100, "unidade": "cabecas"}}
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);




COMMENT ON TABLE culturas IS 'Cadastro de culturas agrícolas por organização';
COMMENT ON TABLE sistemas IS 'Sistemas de produção (sequeiro, irrigado, etc.)';
COMMENT ON TABLE ciclos IS 'Ciclos de produção (1ª safra, 2ª safra, etc.)';
COMMENT ON TABLE safras IS 'Anos agrícolas/safras para controle temporal';
COMMENT ON TABLE areas_plantio IS 'Áreas plantadas multi-safra usando JSONB - similar a dívidas bancárias';
COMMENT ON TABLE produtividades IS 'Registros de produtividade multi-safra usando JSONB';
COMMENT ON TABLE custos_producao IS 'Custos de produção multi-safra usando JSONB';
COMMENT ON TABLE rebanhos IS 'Cadastro do rebanho por propriedade';
COMMENT ON TABLE operacoes_pecuarias IS 'Operações e ciclos pecuários';
COMMENT ON TABLE areas_plantio_normalized IS 'Vista normalizada das áreas de plantio para consultas mais simples';
COMMENT ON TABLE produtividades_normalized IS 'Vista normalizada das produtividades para consultas mais simples';
COMMENT ON TABLE custos_producao_normalized IS 'Vista normalizada dos custos para consultas mais simples';

-- Column comments for key fields
COMMENT ON COLUMN areas_plantio.areas_por_safra IS 'Áreas por safra em formato JSONB: {"safra_id": area_value}';
COMMENT ON COLUMN produtividades.produtividades_por_safra IS 'Produtividades por safra: {"safra_id": {"produtividade": value, "unidade": "sc/ha"}}';
COMMENT ON COLUMN custos_producao.custos_por_safra IS 'Custos por safra: {"safra_id": valor}';
COMMENT ON COLUMN areas_plantio_normalized.area IS 'Área em hectares (normalizada)';
COMMENT ON COLUMN produtividades_normalized.produtividade IS 'Produtividade na unidade especificada (normalizada)';
COMMENT ON COLUMN produtividades_normalized.unidade IS 'Unidade de medida: sc/ha, @/ha, kg/ha, ton/ha';
COMMENT ON COLUMN custos_producao_normalized.valor IS 'Valor do custo em reais (normalizado)';
COMMENT ON COLUMN rebanhos.quantidade IS 'Quantidade de animais';
COMMENT ON COLUMN rebanhos.preco_unitario IS 'Preço unitário por animal';
COMMENT ON COLUMN operacoes_pecuarias.volume_abate_por_safra IS 'Volume de abate estruturado por safra em formato JSON';