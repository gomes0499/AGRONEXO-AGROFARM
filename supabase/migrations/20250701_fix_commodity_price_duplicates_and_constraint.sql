-- =============================================================================
-- MIGRATION: Corrigir duplicatas e atualizar constraint para commodity_price_projections
-- =============================================================================
-- Remove duplicatas existentes e depois atualiza a constraint
-- =============================================================================

-- 1. Primeiro, identificar e remover duplicatas mantendo apenas o registro mais recente
WITH duplicated_prices AS (
  SELECT 
    id,
    organizacao_id,
    cultura_id,
    sistema_id,
    ciclo_id,
    projection_id,
    ROW_NUMBER() OVER (
      PARTITION BY organizacao_id, cultura_id, sistema_id, ciclo_id, COALESCE(projection_id, '00000000-0000-0000-0000-000000000000')
      ORDER BY updated_at DESC, created_at DESC
    ) as rn
  FROM commodity_price_projections
  WHERE cultura_id IS NOT NULL 
    AND sistema_id IS NOT NULL 
    AND ciclo_id IS NOT NULL
)
DELETE FROM commodity_price_projections 
WHERE id IN (
  SELECT id FROM duplicated_prices WHERE rn > 1
);

-- 2. Remover os índices únicos antigos que impediam múltiplos registros
DROP INDEX IF EXISTS idx_commodity_prices_real_data;
DROP INDEX IF EXISTS idx_commodity_prices_projection_data;

-- 3. Criar novos índices únicos que consideram cultura, sistema e ciclo
-- Para dados reais (projection_id IS NULL)
CREATE UNIQUE INDEX idx_commodity_prices_real_data_v2 
ON commodity_price_projections (organizacao_id, cultura_id, sistema_id, ciclo_id) 
WHERE projection_id IS NULL 
  AND cultura_id IS NOT NULL 
  AND sistema_id IS NOT NULL 
  AND ciclo_id IS NOT NULL;

-- Para dados de projeção (projection_id IS NOT NULL)
CREATE UNIQUE INDEX idx_commodity_prices_projection_data_v2 
ON commodity_price_projections (organizacao_id, cultura_id, sistema_id, ciclo_id, projection_id) 
WHERE projection_id IS NOT NULL 
  AND cultura_id IS NOT NULL 
  AND sistema_id IS NOT NULL 
  AND ciclo_id IS NOT NULL;

-- 4. Criar índices não-únicos para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_commodity_prices_org_cultura 
ON commodity_price_projections (organizacao_id, cultura_id);

CREATE INDEX IF NOT EXISTS idx_commodity_prices_org_sistema 
ON commodity_price_projections (organizacao_id, sistema_id);

CREATE INDEX IF NOT EXISTS idx_commodity_prices_org_ciclo 
ON commodity_price_projections (organizacao_id, ciclo_id);

-- 5. Adicionar comentários explicativos
COMMENT ON INDEX idx_commodity_prices_real_data_v2 IS 
'Garante que cada organização tenha apenas um preço por combinação de cultura, sistema e ciclo (dados reais)';

COMMENT ON INDEX idx_commodity_prices_projection_data_v2 IS 
'Garante que cada organização tenha apenas um preço por combinação de cultura, sistema, ciclo e projeção';