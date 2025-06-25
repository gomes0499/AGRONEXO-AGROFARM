-- Script para remover a coluna safra_id da tabela arrendamentos

-- Verificar se a coluna existe antes de removê-la
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'arrendamentos'
        AND column_name = 'safra_id'
    ) THEN
        -- Remover a coluna safra_id
        ALTER TABLE arrendamentos DROP COLUMN safra_id;
        
        -- Log de sucesso
        RAISE NOTICE 'Coluna safra_id removida da tabela arrendamentos';
    ELSE
        -- Log se a coluna não existir
        RAISE NOTICE 'A coluna safra_id não existe na tabela arrendamentos';
    END IF;
END;
$$;

-- Atualizar os triggers relacionados (se necessário)
-- Assumindo que não há triggers que dependem diretamente de safra_id

-- Atualizar comentário da tabela (opcional)
COMMENT ON TABLE arrendamentos IS 'Arrendamentos de propriedades rurais. Custos por ano são armazenados no campo custos_por_ano como um JSONB com chaves sendo IDs de safras.';

-- Log final
DO $$
BEGIN
    RAISE NOTICE 'Migração concluída!';
END;
$$;