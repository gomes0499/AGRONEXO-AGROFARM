-- Add tipo, indexador and taxa_real fields to dividas_fornecedores table

-- Primeiro verifica se os campos já existem antes de adicionar
DO $$
BEGIN
    -- Verificar e adicionar campo tipo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'dividas_fornecedores' AND column_name = 'tipo') THEN
        ALTER TABLE dividas_fornecedores 
        ADD COLUMN tipo tipo_instituicao_financeira NOT NULL DEFAULT 'OUTROS';
    END IF;
    
    -- Verificar e adicionar campo indexador
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'dividas_fornecedores' AND column_name = 'indexador') THEN
        ALTER TABLE dividas_fornecedores 
        ADD COLUMN indexador VARCHAR(50) NOT NULL DEFAULT 'CDI';
    END IF;
    
    -- Verificar e adicionar campo taxa_real
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'dividas_fornecedores' AND column_name = 'taxa_real') THEN
        ALTER TABLE dividas_fornecedores 
        ADD COLUMN taxa_real taxa_juros NOT NULL DEFAULT 6.5;
    END IF;
    
    -- Corrigir a constraint que parece estar errada (referência a safra_id que não existe na tabela)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'uk_fornecedores_organizacao_safra_nome' 
              AND table_name = 'dividas_fornecedores') THEN
        ALTER TABLE dividas_fornecedores 
        DROP CONSTRAINT uk_fornecedores_organizacao_safra_nome;
        
        -- Adicionar uma constraint corrigida
        ALTER TABLE dividas_fornecedores 
        ADD CONSTRAINT uk_fornecedores_organizacao_nome UNIQUE (organizacao_id, nome);
    END IF;
END$$;

COMMENT ON COLUMN dividas_fornecedores.tipo IS 'Tipo de instituição financeira (BANCO, TRADING, OUTROS)';
COMMENT ON COLUMN dividas_fornecedores.indexador IS 'Indexador usado na dívida (CDI, SELIC, IPCA, etc)';
COMMENT ON COLUMN dividas_fornecedores.taxa_real IS 'Taxa real em porcentagem ao ano';

-- Mensagem de sucesso
SELECT 'Campos adicionados com sucesso à tabela dividas_fornecedores' as resultado;