-- Remove a coluna data_venda da tabela vendas_ativos
-- CUIDADO: Este script vai remover permanentemente a coluna e todos os dados nela

-- 1. Verificar se a coluna existe antes de dropar
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'vendas_ativos' 
        AND column_name = 'data_venda'
    ) THEN
        -- Dropar a coluna
        ALTER TABLE vendas_ativos DROP COLUMN data_venda;
        RAISE NOTICE 'Coluna data_venda removida com sucesso da tabela vendas_ativos';
    ELSE
        RAISE NOTICE 'Coluna data_venda não existe na tabela vendas_ativos';
    END IF;
END $$;