-- Tabelas do módulo financeiro
-- Arquitetura multi-tenant com suporte JSONB multi-ano e safra

-- ================================================
-- TABELAS DE GESTÃO DE DÍVIDAS
-- ================================================

-- Dívidas Bancárias (inclui banco, trading e outros)
CREATE TABLE IF NOT EXISTS dividas_bancarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    tipo tipo_instituicao_financeira NOT NULL, -- BANCO, TRADING, OUTRO
    modalidade divida_modalidade NOT NULL,
    instituicao_bancaria VARCHAR(255) NOT NULL, -- nome do banco/trading/empresa
    ano_contratacao INTEGER NOT NULL,
    indexador VARCHAR(50) NOT NULL,
    taxa_real taxa_juros NOT NULL,
    valores_por_ano JSONB NOT NULL, -- {"safra_id": valor, ...}
    moeda moeda_tipo NOT NULL DEFAULT 'BRL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validation constraints
    CONSTRAINT chk_dividas_bancarias_ano_valido CHECK (ano_contratacao >= 2000 AND ano_contratacao <= 2100),
    CONSTRAINT chk_dividas_bancarias_fluxo_not_empty CHECK (jsonb_typeof(fluxo_pagamento_anual) = 'object' AND fluxo_pagamento_anual != '{}')
);

-- Dívidas de Imóveis (Property Debts)
CREATE TABLE IF NOT EXISTS dividas_imoveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    tipo_divida tipo_divida_imovel NOT NULL,
    credor VARCHAR(255) NOT NULL,
    ano_aquisicao INTEGER NOT NULL,
    valor_total valor_financeiro NOT NULL,
    valores_por_ano JSONB NOT NULL, -- {"safra_id": valor, ...}
    moeda moeda_tipo NOT NULL DEFAULT 'BRL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validation constraints
    CONSTRAINT chk_dividas_imoveis_datas CHECK (data_vencimento > data_aquisicao),
    CONSTRAINT chk_dividas_imoveis_fluxo_not_empty CHECK (jsonb_typeof(fluxo_pagamento_anual) = 'object' AND fluxo_pagamento_anual != '{}')
);


-- Fornecedores (Suppliers)
CREATE TABLE IF NOT EXISTS dividas_fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    categoria categoria_fornecedor NOT NULL,
    valores_por_ano JSONB NOT NULL, -- {"SAFRA_ID": 10000, "SAFRA_ID": 15000, ...}
    moeda moeda_tipo NOT NULL DEFAULT 'BRL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint
    CONSTRAINT uk_fornecedores_organizacao_safra_nome UNIQUE (organizacao_id, safra_id, nome),
    
    -- Validation constraints
    CONSTRAINT chk_fornecedores_valores_not_empty CHECK (jsonb_typeof(valores_por_ano) = 'object' AND valores_por_ano != '{}')
);



-- Caixa e Disponibilidades
CREATE TABLE IF NOT EXISTS caixa_disponibilidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    nome TEXT NOT NULL,
    categoria categoria_caixa_disponibilidades NOT NULL,
    valores_por_safra JSONB NOT NULL, -- {"safra_id": valor, ...}
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Validation constraints
    CONSTRAINT chk_caixa_disponibilidades_valores_not_empty CHECK (jsonb_typeof(valores_por_safra) = 'object' AND valores_por_safra != '{}')
);


CREATE TABLE IF NOT EXISTS financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    nome TEXT NOT NULL,
    categoria categoria_financeiras NOT NULL,
    valores_por_safra JSONB NOT NULL, -- {"safra_id": valor, ...}
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Validation constraints
    CONSTRAINT chk_financeiras_valores_not_empty CHECK (jsonb_typeof(valores_por_safra) = 'object' AND valores_por_safra != '{}')
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
