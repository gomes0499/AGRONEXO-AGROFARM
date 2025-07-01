-- =============================================================================
-- MIGRATION: Adicionar constraints de unicidade para entidades de produção
-- =============================================================================
-- Garante que culturas, ciclos, safras, sistemas de produção, preços de commodities
-- e cotações de câmbio sejam únicos por organização
-- =============================================================================

-- 1. CULTURAS - Constraint de unicidade por nome e organização
-- Primeiro, remover duplicatas se existirem
WITH duplicated_cultures AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY organizacao_id, UPPER(nome) ORDER BY created_at DESC) as rn
  FROM culturas
)
DELETE FROM culturas 
WHERE id IN (
  SELECT id FROM duplicated_cultures WHERE rn > 1
);

-- Adicionar constraint de unicidade
ALTER TABLE culturas 
ADD CONSTRAINT uk_culturas_organizacao_nome 
UNIQUE (organizacao_id, nome);

-- 2. CICLOS - Constraint de unicidade por nome e organização
-- Primeiro, remover duplicatas se existirem
WITH duplicated_ciclos AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY organizacao_id, UPPER(nome) ORDER BY created_at DESC) as rn
  FROM ciclos
)
DELETE FROM ciclos 
WHERE id IN (
  SELECT id FROM duplicated_ciclos WHERE rn > 1
);

-- Adicionar constraint de unicidade
ALTER TABLE ciclos 
ADD CONSTRAINT uk_ciclos_organizacao_nome 
UNIQUE (organizacao_id, nome);

-- 3. SAFRAS - Constraint de unicidade por nome/ano e organização
-- Primeiro, remover duplicatas se existirem
WITH duplicated_safras AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY organizacao_id, ano_inicio, ano_fim ORDER BY created_at DESC) as rn
  FROM safras
)
DELETE FROM safras 
WHERE id IN (
  SELECT id FROM duplicated_safras WHERE rn > 1
);

-- Adicionar constraint de unicidade para safras (baseado em anos)
ALTER TABLE safras 
ADD CONSTRAINT uk_safras_organizacao_anos 
UNIQUE (organizacao_id, ano_inicio, ano_fim);

-- Também adicionar constraint para nome se não for nulo
CREATE UNIQUE INDEX idx_safras_organizacao_nome 
ON safras (organizacao_id, nome) 
WHERE nome IS NOT NULL;

-- 4. SISTEMAS DE PRODUÇÃO - Constraint de unicidade por nome e organização
-- Primeiro, remover duplicatas se existirem
WITH duplicated_sistemas AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY organizacao_id, UPPER(nome) ORDER BY created_at DESC) as rn
  FROM sistemas
)
DELETE FROM sistemas 
WHERE id IN (
  SELECT id FROM duplicated_sistemas WHERE rn > 1
);

-- Adicionar constraint de unicidade
ALTER TABLE sistemas 
ADD CONSTRAINT uk_sistemas_organizacao_nome 
UNIQUE (organizacao_id, nome);

-- 5. PREÇOS DE COMMODITIES (commodity_price_projections)
-- Verificar se a tabela existe primeiro
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'commodity_price_projections'
  ) THEN
    -- Remover duplicatas se existirem
    WITH duplicated_prices AS (
      SELECT 
        id,
        ROW_NUMBER() OVER (
          PARTITION BY organizacao_id, commodity_type, COALESCE(projection_id, '00000000-0000-0000-0000-000000000000')
          ORDER BY updated_at DESC
        ) as rn
      FROM commodity_price_projections
    )
    DELETE FROM commodity_price_projections 
    WHERE id IN (
      SELECT id FROM duplicated_prices WHERE rn > 1
    );

    -- Adicionar constraint de unicidade
    -- Para dados reais (projection_id IS NULL)
    CREATE UNIQUE INDEX idx_commodity_prices_real_data 
    ON commodity_price_projections (organizacao_id, commodity_type) 
    WHERE projection_id IS NULL;

    -- Para dados de projeção (projection_id IS NOT NULL)
    CREATE UNIQUE INDEX idx_commodity_prices_projection_data 
    ON commodity_price_projections (organizacao_id, commodity_type, projection_id) 
    WHERE projection_id IS NOT NULL;
  END IF;
END $$;

-- 6. COTAÇÕES DE CÂMBIO (cotacoes_cambio ou exchange_rate_projections)
-- Verificar qual tabela existe e aplicar constraints
DO $$
BEGIN
  -- Verificar se existe cotacoes_cambio
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cotacoes_cambio'
  ) THEN
    -- Remover duplicatas se existirem
    WITH duplicated_rates AS (
      SELECT 
        id,
        ROW_NUMBER() OVER (
          PARTITION BY organizacao_id, tipo_moeda, COALESCE(projection_id, '00000000-0000-0000-0000-000000000000')
          ORDER BY updated_at DESC
        ) as rn
      FROM cotacoes_cambio
    )
    DELETE FROM cotacoes_cambio 
    WHERE id IN (
      SELECT id FROM duplicated_rates WHERE rn > 1
    );

    -- Adicionar constraints
    CREATE UNIQUE INDEX idx_exchange_rates_real_data 
    ON cotacoes_cambio (organizacao_id, tipo_moeda) 
    WHERE projection_id IS NULL;

    CREATE UNIQUE INDEX idx_exchange_rates_projection_data 
    ON cotacoes_cambio (organizacao_id, tipo_moeda, projection_id) 
    WHERE projection_id IS NOT NULL;
  END IF;

  -- Verificar se existe exchange_rate_projections
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'exchange_rate_projections'
  ) THEN
    -- Remover duplicatas se existirem
    WITH duplicated_rates AS (
      SELECT 
        id,
        ROW_NUMBER() OVER (
          PARTITION BY organizacao_id, tipo_moeda, COALESCE(projection_id, '00000000-0000-0000-0000-000000000000')
          ORDER BY updated_at DESC
        ) as rn
      FROM exchange_rate_projections
    )
    DELETE FROM exchange_rate_projections 
    WHERE id IN (
      SELECT id FROM duplicated_rates WHERE rn > 1
    );

    -- Adicionar constraints
    CREATE UNIQUE INDEX idx_exchange_rate_projections_real_data 
    ON exchange_rate_projections (organizacao_id, tipo_moeda) 
    WHERE projection_id IS NULL;

    CREATE UNIQUE INDEX idx_exchange_rate_projections_projection_data 
    ON exchange_rate_projections (organizacao_id, tipo_moeda, projection_id) 
    WHERE projection_id IS NOT NULL;
  END IF;
END $$;

-- 7. Adicionar comentários explicativos
COMMENT ON CONSTRAINT uk_culturas_organizacao_nome ON culturas IS 
'Garante que cada organização tenha culturas com nomes únicos';

COMMENT ON CONSTRAINT uk_ciclos_organizacao_nome ON ciclos IS 
'Garante que cada organização tenha ciclos com nomes únicos';

COMMENT ON CONSTRAINT uk_safras_organizacao_anos ON safras IS 
'Garante que cada organização tenha safras únicas por período (ano início/fim)';

COMMENT ON CONSTRAINT uk_sistemas_organizacao_nome ON sistemas IS 
'Garante que cada organização tenha sistemas de produção com nomes únicos';

-- 8. Criar função para normalizar nomes (case-insensitive)
CREATE OR REPLACE FUNCTION normalize_name() 
RETURNS TRIGGER AS $$
BEGIN
  -- Normalizar o nome para comparação (trim e capitalização consistente)
  IF NEW.nome IS NOT NULL THEN
    NEW.nome = TRIM(NEW.nome);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Aplicar trigger de normalização nas tabelas relevantes
CREATE TRIGGER normalize_cultura_name
  BEFORE INSERT OR UPDATE ON culturas
  FOR EACH ROW
  EXECUTE FUNCTION normalize_name();

CREATE TRIGGER normalize_ciclo_name
  BEFORE INSERT OR UPDATE ON ciclos
  FOR EACH ROW
  EXECUTE FUNCTION normalize_name();

CREATE TRIGGER normalize_sistema_name
  BEFORE INSERT OR UPDATE ON sistemas
  FOR EACH ROW
  EXECUTE FUNCTION normalize_name();

-- 10. Índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_culturas_organizacao ON culturas(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_ciclos_organizacao ON ciclos(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_safras_organizacao ON safras(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_sistemas_organizacao ON sistemas(organizacao_id);