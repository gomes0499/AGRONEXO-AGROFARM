-- =============================================================================
-- MIGRATION: Atualizar constraint única para commodity_price_projections
-- =============================================================================
-- Remove a constraint antiga que impedia múltiplos preços por commodity
-- Adiciona nova constraint que permite diferentes preços por cultura/sistema/ciclo
-- =============================================================================

-- 1. Remover os índices únicos antigos que impediam múltiplos registros
DROP INDEX IF EXISTS idx_commodity_prices_real_data;
DROP INDEX IF EXISTS idx_commodity_prices_projection_data;

-- 2. Criar novos índices únicos que consideram cultura, sistema e ciclo
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

-- 3. Criar índices não-únicos para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_commodity_prices_org_cultura 
ON commodity_price_projections (organizacao_id, cultura_id);

CREATE INDEX IF NOT EXISTS idx_commodity_prices_org_sistema 
ON commodity_price_projections (organizacao_id, sistema_id);

CREATE INDEX IF NOT EXISTS idx_commodity_prices_org_ciclo 
ON commodity_price_projections (organizacao_id, ciclo_id);

-- 4. Adicionar comentários explicativos
COMMENT ON INDEX idx_commodity_prices_real_data_v2 IS 
'Garante que cada organização tenha apenas um preço por combinação de cultura, sistema e ciclo (dados reais)';

COMMENT ON INDEX idx_commodity_prices_projection_data_v2 IS 
'Garante que cada organização tenha apenas um preço por combinação de cultura, sistema, ciclo e projeção';