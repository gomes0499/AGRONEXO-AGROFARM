-- Script para remover a coluna safra_id da tabela de arrendamentos
-- Primeiro criar função para verificar se a coluna existe
CREATE OR REPLACE FUNCTION column_exists(ptable text, pcolumn text) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = ptable
        AND column_name = pcolumn
    );
END;
$$ LANGUAGE plpgsql;

-- Remover a coluna safra_id apenas se ela existir
DO $$
BEGIN
    IF column_exists('arrendamentos', 'safra_id') THEN
        -- Remover a coluna safra_id
        ALTER TABLE arrendamentos DROP COLUMN safra_id;
        
        -- Opcional: Atualizar comentário da tabela
        COMMENT ON TABLE arrendamentos IS 'Arrendamentos de propriedades rurais. Custos por ano são armazenados no campo custos_por_ano como um JSONB com chaves sendo IDs de safras.';
    END IF;
END;
$$;

-- Remover a função auxiliar
DROP FUNCTION IF EXISTS column_exists;

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Migração concluída: coluna safra_id removida da tabela arrendamentos';
END;
$$;