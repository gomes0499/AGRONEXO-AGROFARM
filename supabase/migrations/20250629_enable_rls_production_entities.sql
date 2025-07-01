-- =============================================================================
-- MIGRATION: Habilitar Row Level Security (RLS) para entidades de produção
-- =============================================================================
-- Garante que usuários só vejam dados da sua própria organização
-- =============================================================================

-- 1. Habilitar RLS nas tabelas de configuração
ALTER TABLE culturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE safras ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistemas ENABLE ROW LEVEL SECURITY;

-- 2. Habilitar RLS nas tabelas de produção
ALTER TABLE areas_plantio ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE custos_producao ENABLE ROW LEVEL SECURITY;

-- 3. Habilitar RLS nas tabelas de preços (se existirem)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'commodity_price_projections'
  ) THEN
    ALTER TABLE commodity_price_projections ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cotacoes_cambio'
  ) THEN
    ALTER TABLE cotacoes_cambio ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'exchange_rate_projections'
  ) THEN
    ALTER TABLE exchange_rate_projections ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 4. Criar políticas RLS para CULTURAS
-- Política de SELECT - usuários só veem culturas da sua organização
CREATE POLICY "culturas_select_policy" ON culturas
  FOR SELECT
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

-- Política de INSERT - usuários só podem inserir na sua organização
CREATE POLICY "culturas_insert_policy" ON culturas
  FOR INSERT
  WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

-- Política de UPDATE - usuários só podem atualizar da sua organização
CREATE POLICY "culturas_update_policy" ON culturas
  FOR UPDATE
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

-- Política de DELETE - usuários só podem deletar da sua organização
CREATE POLICY "culturas_delete_policy" ON culturas
  FOR DELETE
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

-- 5. Criar políticas RLS para CICLOS (mesmo padrão)
CREATE POLICY "ciclos_select_policy" ON ciclos
  FOR SELECT
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "ciclos_insert_policy" ON ciclos
  FOR INSERT
  WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "ciclos_update_policy" ON ciclos
  FOR UPDATE
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "ciclos_delete_policy" ON ciclos
  FOR DELETE
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

-- 6. Criar políticas RLS para SAFRAS
CREATE POLICY "safras_select_policy" ON safras
  FOR SELECT
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "safras_insert_policy" ON safras
  FOR INSERT
  WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "safras_update_policy" ON safras
  FOR UPDATE
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "safras_delete_policy" ON safras
  FOR DELETE
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

-- 7. Criar políticas RLS para SISTEMAS
CREATE POLICY "sistemas_select_policy" ON sistemas
  FOR SELECT
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "sistemas_insert_policy" ON sistemas
  FOR INSERT
  WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "sistemas_update_policy" ON sistemas
  FOR UPDATE
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "sistemas_delete_policy" ON sistemas
  FOR DELETE
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

-- 8. Criar políticas RLS para AREAS_PLANTIO
CREATE POLICY "areas_plantio_select_policy" ON areas_plantio
  FOR SELECT
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "areas_plantio_insert_policy" ON areas_plantio
  FOR INSERT
  WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "areas_plantio_update_policy" ON areas_plantio
  FOR UPDATE
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "areas_plantio_delete_policy" ON areas_plantio
  FOR DELETE
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

-- 9. Criar políticas RLS para PRODUTIVIDADES
CREATE POLICY "produtividades_select_policy" ON produtividades
  FOR SELECT
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "produtividades_insert_policy" ON produtividades
  FOR INSERT
  WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "produtividades_update_policy" ON produtividades
  FOR UPDATE
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "produtividades_delete_policy" ON produtividades
  FOR DELETE
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

-- 10. Criar políticas RLS para CUSTOS_PRODUCAO
CREATE POLICY "custos_producao_select_policy" ON custos_producao
  FOR SELECT
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "custos_producao_insert_policy" ON custos_producao
  FOR INSERT
  WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "custos_producao_update_policy" ON custos_producao
  FOR UPDATE
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "custos_producao_delete_policy" ON custos_producao
  FOR DELETE
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

-- 11. Criar políticas RLS para COMMODITY_PRICE_PROJECTIONS (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'commodity_price_projections'
  ) THEN
    -- SELECT
    CREATE POLICY "commodity_prices_select_policy" ON commodity_price_projections
      FOR SELECT
      USING (
        organizacao_id IN (
          SELECT organizacao_id 
          FROM associacoes 
          WHERE usuario_id = auth.uid()
        )
      );

    -- INSERT
    CREATE POLICY "commodity_prices_insert_policy" ON commodity_price_projections
      FOR INSERT
      WITH CHECK (
        organizacao_id IN (
          SELECT organizacao_id 
          FROM associacoes 
          WHERE usuario_id = auth.uid()
        )
      );

    -- UPDATE
    CREATE POLICY "commodity_prices_update_policy" ON commodity_price_projections
      FOR UPDATE
      USING (
        organizacao_id IN (
          SELECT organizacao_id 
          FROM associacoes 
          WHERE usuario_id = auth.uid()
        )
      );

    -- DELETE
    CREATE POLICY "commodity_prices_delete_policy" ON commodity_price_projections
      FOR DELETE
      USING (
        organizacao_id IN (
          SELECT organizacao_id 
          FROM associacoes 
          WHERE usuario_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 12. Criar políticas RLS para COTACOES_CAMBIO (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'cotacoes_cambio'
  ) THEN
    -- SELECT
    CREATE POLICY "cotacoes_cambio_select_policy" ON cotacoes_cambio
      FOR SELECT
      USING (
        organizacao_id IN (
          SELECT organizacao_id 
          FROM associacoes 
          WHERE usuario_id = auth.uid()
        )
      );

    -- INSERT
    CREATE POLICY "cotacoes_cambio_insert_policy" ON cotacoes_cambio
      FOR INSERT
      WITH CHECK (
        organizacao_id IN (
          SELECT organizacao_id 
          FROM associacoes 
          WHERE usuario_id = auth.uid()
        )
      );

    -- UPDATE
    CREATE POLICY "cotacoes_cambio_update_policy" ON cotacoes_cambio
      FOR UPDATE
      USING (
        organizacao_id IN (
          SELECT organizacao_id 
          FROM associacoes 
          WHERE usuario_id = auth.uid()
        )
      );

    -- DELETE
    CREATE POLICY "cotacoes_cambio_delete_policy" ON cotacoes_cambio
      FOR DELETE
      USING (
        organizacao_id IN (
          SELECT organizacao_id 
          FROM associacoes 
          WHERE usuario_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 13. Função helper para verificar se usuário pertence a uma organização
CREATE OR REPLACE FUNCTION user_belongs_to_organization(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM associacoes 
    WHERE usuario_id = auth.uid() 
    AND organizacao_id = org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adicionar comentário
COMMENT ON FUNCTION user_belongs_to_organization IS 'Verifica se o usuário autenticado pertence à organização especificada';