-- Script de limpeza e recriação da tabela commodity_price_projections
-- Este script remove todos os dados e recria a tabela corretamente

-- Truncar a tabela para remover todos os registros
TRUNCATE TABLE commodity_price_projections CASCADE;

-- Adicionar a restrição de unicidade se ainda não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'commodity_price_org_type_unique'
  ) THEN
    ALTER TABLE commodity_price_projections
    ADD CONSTRAINT commodity_price_org_type_unique 
    UNIQUE (organizacao_id, commodity_type);
    
    RAISE NOTICE 'Restrição de unicidade adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Restrição de unicidade já existe.';
  END IF;
END
$$;

-- Criar as funções de deduplicação
DROP FUNCTION IF EXISTS identify_commodity_duplicates(UUID) CASCADE;
DROP FUNCTION IF EXISTS deduplicate_commodity_prices(UUID) CASCADE;

-- Função para identificar duplicatas
CREATE OR REPLACE FUNCTION identify_commodity_duplicates(org_id UUID)
RETURNS TABLE(commodity_type VARCHAR, count BIGINT) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    commodity_type, 
    COUNT(*) as count
  FROM 
    commodity_price_projections
  WHERE 
    organizacao_id = org_id
  GROUP BY 
    commodity_type
  HAVING 
    COUNT(*) > 1;
$$;

-- Função para remover duplicatas mantendo apenas o registro mais recente
CREATE OR REPLACE FUNCTION deduplicate_commodity_prices(org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Primeiro identificamos os tipos de commodity que têm duplicatas
  FOR rec IN 
    SELECT 
      commodity_type, 
      COUNT(*) as count
    FROM 
      commodity_price_projections
    WHERE 
      organizacao_id = org_id
    GROUP BY 
      commodity_type
    HAVING 
      COUNT(*) > 1
  LOOP
    -- Para cada tipo, excluímos todos exceto o registro mais recente
    RAISE NOTICE 'Removendo duplicatas para %: % registros', rec.commodity_type, rec.count;
    
    DELETE FROM commodity_price_projections
    WHERE id IN (
      SELECT id
      FROM (
        SELECT 
          id,
          ROW_NUMBER() OVER (
            PARTITION BY organizacao_id, commodity_type 
            ORDER BY updated_at DESC
          ) as rn
        FROM 
          commodity_price_projections
        WHERE 
          organizacao_id = org_id AND
          commodity_type = rec.commodity_type
      ) ranked
      WHERE ranked.rn > 1  -- Mantém apenas o mais recente
    );
    
  END LOOP;
END;
$$;

-- Criar função para advisory lock
DROP FUNCTION IF EXISTS pg_try_advisory_xact_lock(bigint) CASCADE;

CREATE OR REPLACE FUNCTION pg_try_advisory_xact_lock(locknum bigint) 
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN pg_try_advisory_xact_lock(locknum);
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION identify_commodity_duplicates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION identify_commodity_duplicates(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION deduplicate_commodity_prices(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION deduplicate_commodity_prices(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION pg_try_advisory_xact_lock(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION pg_try_advisory_xact_lock(bigint) TO service_role;
GRANT EXECUTE ON FUNCTION pg_try_advisory_xact_lock(bigint) TO anon;

-- Verificar que a tabela está vazia
SELECT COUNT(*) FROM commodity_price_projections;

-- Mensagem de conclusão
DO $$
BEGIN
  RAISE NOTICE 'Tabela limpa e reconfigurada com sucesso! As commodities serão recriadas automaticamente quando a aplicação for acessada.';
END
$$;