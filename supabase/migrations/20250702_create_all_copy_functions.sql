-- Create all RPC functions needed for copying data to projections
-- These are called by the frontend createProjection function

-- 1. Function to copy planting areas to projection
CREATE OR REPLACE FUNCTION copy_areas_plantio_to_projection(
  p_projection_id uuid,
  p_organizacao_id uuid
) RETURNS void AS $$
DECLARE
  v_count integer;
BEGIN
  -- Count existing records to avoid duplicates
  SELECT COUNT(*) INTO v_count
  FROM areas_plantio_projections
  WHERE projection_id = p_projection_id;
  
  IF v_count > 0 THEN
    RAISE NOTICE 'Projection % already has % planting areas, skipping copy', p_projection_id, v_count;
    RETURN;
  END IF;

  -- Copy planting areas
  INSERT INTO areas_plantio_projections (
    id, projection_id, organizacao_id, propriedade_id, cultura_id,
    sistema_id, ciclo_id, areas_por_safra, observacoes, 
    created_at, updated_at, original_area_id
  )
  SELECT 
    gen_random_uuid(), p_projection_id, organizacao_id, propriedade_id, cultura_id,
    sistema_id, ciclo_id, areas_por_safra, observacoes,
    created_at, CURRENT_TIMESTAMP, id
  FROM areas_plantio
  WHERE organizacao_id = p_organizacao_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Copied % planting areas to projection %', v_count, p_projection_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Function to copy productivities to projection
CREATE OR REPLACE FUNCTION copy_produtividades_to_projection(
  p_projection_id uuid,
  p_organizacao_id uuid
) RETURNS void AS $$
DECLARE
  v_count integer;
BEGIN
  -- Count existing records to avoid duplicates
  SELECT COUNT(*) INTO v_count
  FROM produtividades_projections
  WHERE projection_id = p_projection_id;
  
  IF v_count > 0 THEN
    RAISE NOTICE 'Projection % already has % productivities, skipping copy', p_projection_id, v_count;
    RETURN;
  END IF;

  -- Copy productivities
  INSERT INTO produtividades_projections (
    id, projection_id, organizacao_id, cultura_id, sistema_id,
    produtividades_por_safra, unidade, observacoes,
    created_at, updated_at, original_produtividade_id
  )
  SELECT 
    gen_random_uuid(), p_projection_id, organizacao_id, cultura_id, sistema_id,
    produtividades_por_safra, unidade, observacoes,
    created_at, CURRENT_TIMESTAMP, id
  FROM produtividades
  WHERE organizacao_id = p_organizacao_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Copied % productivities to projection %', v_count, p_projection_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Function to copy production costs to projection
CREATE OR REPLACE FUNCTION copy_custos_producao_to_projection(
  p_projection_id uuid,
  p_organizacao_id uuid
) RETURNS void AS $$
DECLARE
  v_count integer;
BEGIN
  -- Count existing records to avoid duplicates
  SELECT COUNT(*) INTO v_count
  FROM custos_producao_projections
  WHERE projection_id = p_projection_id;
  
  IF v_count > 0 THEN
    RAISE NOTICE 'Projection % already has % production costs, skipping copy', p_projection_id, v_count;
    RETURN;
  END IF;

  -- Copy production costs
  INSERT INTO custos_producao_projections (
    id, projection_id, organizacao_id, propriedade_id, cultura_id,
    sistema_id, ciclo_id, categoria, custos_por_safra, observacoes,
    created_at, updated_at, original_custo_id
  )
  SELECT 
    gen_random_uuid(), p_projection_id, organizacao_id, propriedade_id, cultura_id,
    sistema_id, ciclo_id, categoria, custos_por_safra, observacoes,
    created_at, CURRENT_TIMESTAMP, id
  FROM custos_producao
  WHERE organizacao_id = p_organizacao_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Copied % production costs to projection %', v_count, p_projection_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Function to copy commodity prices to projection (already in previous file but including here for completeness)
CREATE OR REPLACE FUNCTION copy_commodity_prices_to_projection(
  p_projection_id uuid,
  p_organizacao_id uuid
) RETURNS void AS $$
DECLARE
  v_count integer;
BEGIN
  -- Count existing records to avoid duplicates
  SELECT COUNT(*) INTO v_count
  FROM commodity_price_projections_projections
  WHERE projection_id = p_projection_id;
  
  IF v_count > 0 THEN
    RAISE NOTICE 'Projection % already has % commodity prices, skipping copy', p_projection_id, v_count;
    RETURN;
  END IF;

  -- Copy commodity prices from the base data
  INSERT INTO commodity_price_projections_projections (
    id, projection_id, organizacao_id, commodity_type, cultura_id, sistema_id, ciclo_id,
    safra_id, unit, current_price, precos_por_ano, premissas_precos,
    created_at, updated_at, original_commodity_price_id
  )
  SELECT 
    gen_random_uuid(), 
    p_projection_id, 
    organizacao_id, 
    commodity_type, 
    cultura_id, 
    sistema_id, 
    ciclo_id,
    safra_id, 
    unit, 
    current_price, 
    precos_por_ano, 
    premissas_precos,
    created_at, 
    CURRENT_TIMESTAMP, 
    id
  FROM commodity_price_projections
  WHERE organizacao_id = p_organizacao_id
  AND projection_id IS NULL; -- Only copy base data

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Copied % commodity prices to projection %', v_count, p_projection_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to copy exchange rates to projection
CREATE OR REPLACE FUNCTION copy_cotacoes_cambio_to_projection(
  p_projection_id uuid,
  p_organizacao_id uuid
) RETURNS void AS $$
DECLARE
  v_count integer;
BEGIN
  -- Check if cotacoes_cambio table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'cotacoes_cambio' 
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE 'Table cotacoes_cambio does not exist, skipping';
    RETURN;
  END IF;

  -- Count existing records to avoid duplicates
  SELECT COUNT(*) INTO v_count
  FROM cotacoes_cambio_projections
  WHERE projection_id = p_projection_id;
  
  IF v_count > 0 THEN
    RAISE NOTICE 'Projection % already has % exchange rates, skipping copy', p_projection_id, v_count;
    RETURN;
  END IF;

  -- Copy exchange rates from the base data
  INSERT INTO cotacoes_cambio_projections (
    id, projection_id, organizacao_id, tipo_moeda, safra_id,
    unit, cotacao_atual, cotacoes_por_ano,
    created_at, updated_at, original_cotacao_id
  )
  SELECT 
    gen_random_uuid(), 
    p_projection_id, 
    organizacao_id, 
    tipo_moeda, 
    safra_id,
    unit, 
    cotacao_atual, 
    cotacoes_por_ano,
    created_at, 
    CURRENT_TIMESTAMP, 
    id
  FROM cotacoes_cambio
  WHERE organizacao_id = p_organizacao_id
  AND projection_id IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Copied % exchange rates to projection %', v_count, p_projection_id;
END;
$$ LANGUAGE plpgsql;

-- Verify all functions were created
DO $$
DECLARE
  v_function_name text;
  v_functions text[] := ARRAY[
    'copy_areas_plantio_to_projection',
    'copy_produtividades_to_projection',
    'copy_custos_producao_to_projection',
    'copy_commodity_prices_to_projection',
    'copy_cotacoes_cambio_to_projection'
  ];
BEGIN
  FOREACH v_function_name IN ARRAY v_functions
  LOOP
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = v_function_name) THEN
      RAISE NOTICE 'Function % exists ✓', v_function_name;
    ELSE
      RAISE NOTICE 'Function % is MISSING ✗', v_function_name;
    END IF;
  END LOOP;
END $$;