-- Funções de banco de dados para resolver o problema de duplicação
-- de registros na tabela commodity_price_projections

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

-- Conceder permissões
GRANT EXECUTE ON FUNCTION identify_commodity_duplicates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION identify_commodity_duplicates(UUID) TO service_role;

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

-- Conceder permissões
GRANT EXECUTE ON FUNCTION deduplicate_commodity_prices(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION deduplicate_commodity_prices(UUID) TO service_role;

-- Comentários
COMMENT ON FUNCTION identify_commodity_duplicates(UUID) IS 'Identifica tipos de commodity com registros duplicados para uma organização específica';
COMMENT ON FUNCTION deduplicate_commodity_prices(UUID) IS 'Remove duplicatas da tabela commodity_price_projections, mantendo apenas o registro mais recente para cada tipo';

-- Adicionar restrição de unicidade, se não existir
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
  END IF;
END
$$;