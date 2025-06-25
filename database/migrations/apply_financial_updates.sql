-- =====================================================
-- SCRIPT CONSOLIDADO PARA ATUALIZAR MÓDULO FINANCEIRO
-- =====================================================
-- Este script aplica todas as atualizações necessárias
-- para o módulo financeiro funcionar corretamente
-- =====================================================

-- 1. VERIFICAR E CRIAR TABELA DE RECEITAS FINANCEIRAS
-- =====================================================
DO $$ 
BEGIN
    -- Verificar se a tabela já existe
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'receitas_financeiras') THEN
        -- Criar enum se não existir
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'receitas_financeiras_categoria') THEN
            CREATE TYPE receitas_financeiras_categoria AS ENUM (
                'JUROS_APLICACOES',
                'RENDIMENTOS_FUNDOS', 
                'DIVIDENDOS',
                'ALUGUEIS_RECEBIDOS',
                'VENDAS_ATIVOS',
                'DESCONTOS_OBTIDOS',
                'OUTRAS_RECEITAS'
            );
        END IF;

        -- Criar tabela
        CREATE TABLE receitas_financeiras (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
            categoria receitas_financeiras_categoria NOT NULL,
            descricao TEXT NOT NULL,
            moeda moeda_tipo NOT NULL DEFAULT 'BRL',
            valor DECIMAL(15,2) NOT NULL,
            safra_id UUID REFERENCES safras(id),
            data_receita DATE NOT NULL DEFAULT CURRENT_DATE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Criar índices
        CREATE INDEX idx_receitas_financeiras_org ON receitas_financeiras(organizacao_id);
        CREATE INDEX idx_receitas_financeiras_categoria ON receitas_financeiras(categoria);
        CREATE INDEX idx_receitas_financeiras_safra ON receitas_financeiras(safra_id);
        CREATE INDEX idx_receitas_financeiras_data ON receitas_financeiras(data_receita);

        -- Enable RLS
        ALTER TABLE receitas_financeiras ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Users can view own organization receitas_financeiras" ON receitas_financeiras
            FOR SELECT USING (auth.uid() IN (
                SELECT user_id FROM user_organizations WHERE organization_id = organizacao_id
            ));

        CREATE POLICY "Users can insert own organization receitas_financeiras" ON receitas_financeiras
            FOR INSERT WITH CHECK (auth.uid() IN (
                SELECT user_id FROM user_organizations WHERE organization_id = organizacao_id
            ));

        CREATE POLICY "Users can update own organization receitas_financeiras" ON receitas_financeiras
            FOR UPDATE USING (auth.uid() IN (
                SELECT user_id FROM user_organizations WHERE organization_id = organizacao_id
            ));

        CREATE POLICY "Users can delete own organization receitas_financeiras" ON receitas_financeiras
            FOR DELETE USING (auth.uid() IN (
                SELECT user_id FROM user_organizations WHERE organization_id = organizacao_id
            ));

        -- Trigger para updated_at
        CREATE TRIGGER update_receitas_financeiras_updated_at
            BEFORE UPDATE ON receitas_financeiras
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 2. ATUALIZAR ENUM DE CATEGORIAS PARA OUTRAS DESPESAS
-- =====================================================
DO $$
BEGIN
    -- Verificar se precisamos atualizar o enum
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'outras_despesas_categoria') THEN
        -- Adicionar novas categorias se não existirem
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'outras_despesas_categoria'::regtype AND enumlabel = 'DEPRECIACAO') THEN
            -- Criar novo tipo com todas as categorias
            CREATE TYPE outras_despesas_categoria_new AS ENUM (
                'TRIBUTARIAS', 
                'PRO_LABORE', 
                'OUTRAS_OPERACIONAIS', 
                'DESPESAS_ADMINISTRATIVAS', 
                'DESPESAS_COMERCIAIS', 
                'DESPESAS_FINANCEIRAS', 
                'MANUTENCAO', 
                'SEGUROS', 
                'CONSULTORIAS', 
                'DEPRECIACAO', 
                'AMORTIZACAO', 
                'ARRENDAMENTOS', 
                'PESSOAL', 
                'ENERGIA_COMBUSTIVEL', 
                'COMUNICACAO', 
                'VIAGENS', 
                'MATERIAL_ESCRITORIO', 
                'OUTROS'
            );
            
            -- Alterar coluna para usar novo tipo
            ALTER TABLE outras_despesas ALTER COLUMN categoria TYPE outras_despesas_categoria_new USING categoria::text::outras_despesas_categoria_new;
            
            -- Remover tipo antigo
            DROP TYPE outras_despesas_categoria;
            
            -- Renomear novo tipo
            ALTER TYPE outras_despesas_categoria_new RENAME TO outras_despesas_categoria;
        END IF;
    END IF;
END $$;

-- 3. ATUALIZAR ENUM DE CAIXA E DISPONIBILIDADES
-- =====================================================
DO $$
BEGIN
    -- Verificar se precisamos adicionar ESTOQUE_SEMENTES
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'caixa_disponibilidades_categoria') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'caixa_disponibilidades_categoria'::regtype AND enumlabel = 'ESTOQUE_SEMENTES') THEN
            -- Criar novo tipo incluindo ESTOQUE_SEMENTES
            CREATE TYPE caixa_disponibilidades_categoria_new AS ENUM (
                'CAIXA_BANCOS',
                'CLIENTES',
                'ADIANTAMENTOS',
                'EMPRESTIMOS',
                'ESTOQUE_DEFENSIVOS',
                'ESTOQUE_FERTILIZANTES',
                'ESTOQUE_ALMOXARIFADO',
                'ESTOQUE_COMMODITIES',
                'ESTOQUE_SEMENTES',
                'SEMOVENTES',
                'ATIVO_BIOLOGICO'
            );
            
            -- Alterar coluna
            ALTER TABLE caixa_disponibilidades ALTER COLUMN categoria TYPE caixa_disponibilidades_categoria_new USING categoria::text::caixa_disponibilidades_categoria_new;
            
            -- Remover tipo antigo
            DROP TYPE caixa_disponibilidades_categoria;
            
            -- Renomear novo tipo
            ALTER TYPE caixa_disponibilidades_categoria_new RENAME TO caixa_disponibilidades_categoria;
        END IF;
    END IF;
END $$;

-- 4. ADICIONAR CAMPOS DE TAXA DE CÂMBIO (PREPARAÇÃO FUTURA)
-- =====================================================
-- Adicionar campos nas safras (se não existirem)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'safras' AND column_name = 'taxa_cambio_usd') THEN
        ALTER TABLE safras ADD COLUMN taxa_cambio_usd DECIMAL(10,4) DEFAULT 5.0000;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'safras' AND column_name = 'moeda_principal') THEN
        ALTER TABLE safras ADD COLUMN moeda_principal moeda_tipo DEFAULT 'BRL';
    END IF;
END $$;

-- Adicionar campos nas tabelas financeiras (preparação para futura migração)
DO $$
BEGIN
    -- Dividas bancárias
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dividas_bancarias' AND column_name = 'safra_id') THEN
        ALTER TABLE dividas_bancarias ADD COLUMN safra_id UUID REFERENCES safras(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dividas_bancarias' AND column_name = 'taxa_cambio_contratacao') THEN
        ALTER TABLE dividas_bancarias ADD COLUMN taxa_cambio_contratacao DECIMAL(10,4);
    END IF;
    
    -- Receitas financeiras
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'receitas_financeiras' AND column_name = 'taxa_cambio_referencia') THEN
        ALTER TABLE receitas_financeiras ADD COLUMN taxa_cambio_referencia DECIMAL(10,4);
    END IF;
    
    -- Outras despesas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'outras_despesas' AND column_name = 'safra_id') THEN
        ALTER TABLE outras_despesas ADD COLUMN safra_id UUID REFERENCES safras(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'outras_despesas' AND column_name = 'taxa_cambio_referencia') THEN
        ALTER TABLE outras_despesas ADD COLUMN taxa_cambio_referencia DECIMAL(10,4);
    END IF;
END $$;

-- Mensagem de sucesso
SELECT 'Atualizações do módulo financeiro aplicadas com sucesso!' as status;