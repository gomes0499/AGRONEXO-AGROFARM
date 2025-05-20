-- Script para corrigir duplicação de registros na tabela commodity_price_projections

-- 1. Identificar registros duplicados
WITH duplicates AS (
    SELECT organizacao_id, commodity_type, 
           array_agg(id ORDER BY updated_at DESC) as ids,
           count(*) as count
    FROM commodity_price_projections
    GROUP BY organizacao_id, commodity_type
    HAVING count(*) > 1
)
SELECT * FROM duplicates;

-- 2. Manter apenas o registro mais recente para cada duplicado (executar após verificação)
WITH duplicates AS (
    SELECT organizacao_id, commodity_type, 
           array_agg(id ORDER BY updated_at DESC) as ids
    FROM commodity_price_projections
    GROUP BY organizacao_id, commodity_type
    HAVING count(*) > 1
),
to_delete AS (
    SELECT unnest(ids[2:array_length(ids, 1)]) as id
    FROM duplicates
)
DELETE FROM commodity_price_projections
WHERE id IN (SELECT id FROM to_delete);

-- 3. Adicionar constraint de unicidade após limpar duplicados
ALTER TABLE commodity_price_projections
ADD CONSTRAINT commodity_price_org_type_unique 
UNIQUE (organizacao_id, commodity_type);

-- 4. Criar um índice para consultas de performance
CREATE INDEX IF NOT EXISTS idx_commodity_price_org_type 
ON commodity_price_projections(organizacao_id, commodity_type);

-- 5. Comentário para documentação
COMMENT ON CONSTRAINT commodity_price_org_type_unique ON commodity_price_projections IS 
'Garante que cada organização tenha apenas um registro por tipo de commodity';