-- Script para dropar propriedades arrendadas incorretas da organização "Safra Boa"
-- Usando o ID específico da organização: 131db844-18ab-4164-8d79-2c8eed2b12f1

DO $$
DECLARE
    org_id UUID := '131db844-18ab-4164-8d79-2c8eed2b12f1';
    deleted_arrendamentos INTEGER;
    deleted_benfeitorias INTEGER;
    deleted_propriedades INTEGER;
BEGIN
    -- Verificar se a organização existe
    IF NOT EXISTS (SELECT 1 FROM organizacoes WHERE id = org_id) THEN
        RAISE EXCEPTION 'Organização com ID % não encontrada. Verifique se o ID está correto.', org_id;
    END IF;
    
    RAISE NOTICE 'Removendo propriedades arrendadas incorretas da organização: %', org_id;
    
    -- 1. Primeiro, remover benfeitorias das propriedades arrendadas
    DELETE FROM benfeitorias 
    WHERE organizacao_id = org_id 
    AND propriedade_id IN (
        SELECT id FROM propriedades 
        WHERE organizacao_id = org_id 
        AND tipo = 'ARRENDADO'
    );
    
    GET DIAGNOSTICS deleted_benfeitorias = ROW_COUNT;
    RAISE NOTICE 'Removidas % benfeitorias de propriedades arrendadas', deleted_benfeitorias;
    
    -- 2. Remover arrendamentos
    DELETE FROM arrendamentos 
    WHERE organizacao_id = org_id;
    
    GET DIAGNOSTICS deleted_arrendamentos = ROW_COUNT;
    RAISE NOTICE 'Removidos % contratos de arrendamento', deleted_arrendamentos;
    
    -- 3. Remover propriedades arrendadas
    DELETE FROM propriedades 
    WHERE organizacao_id = org_id 
    AND tipo = 'ARRENDADO';
    
    GET DIAGNOSTICS deleted_propriedades = ROW_COUNT;
    RAISE NOTICE 'Removidas % propriedades arrendadas', deleted_propriedades;
    
    RAISE NOTICE '=== LIMPEZA CONCLUÍDA ===';
    RAISE NOTICE 'Total removido:';
    RAISE NOTICE '- Propriedades arrendadas: %', deleted_propriedades;
    RAISE NOTICE '- Contratos de arrendamento: %', deleted_arrendamentos;
    RAISE NOTICE '- Benfeitorias: %', deleted_benfeitorias;
    
END $$;