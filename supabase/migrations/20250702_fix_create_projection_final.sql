-- Fix the create_projection function to properly copy commodity prices
-- This replaces the previous version with the correct logic

CREATE OR REPLACE FUNCTION create_projection(
  p_organizacao_id uuid,
  p_nome text,
  p_descricao text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_projection_id uuid;
  v_count integer;
  v_commodity_count integer;
  v_exchange_count integer;
BEGIN
  RAISE NOTICE 'Creating projection: % for organization: %', p_nome, p_organizacao_id;
  
  -- Create the projection
  INSERT INTO projections (organizacao_id, nome, descricao, is_active)
  VALUES (p_organizacao_id, p_nome, p_descricao, true)
  RETURNING id INTO v_projection_id;

  RAISE NOTICE 'Created projection with ID: %', v_projection_id;

  -- Copy planting areas
  INSERT INTO areas_plantio_projections (
    id, projection_id, organizacao_id, propriedade_id, cultura_id,
    sistema_id, ciclo_id, areas_por_safra, observacoes, 
    created_at, updated_at, original_area_id
  )
  SELECT 
    gen_random_uuid(), v_projection_id, organizacao_id, propriedade_id, cultura_id,
    sistema_id, ciclo_id, areas_por_safra, observacoes,
    created_at, CURRENT_TIMESTAMP, id
  FROM areas_plantio
  WHERE organizacao_id = p_organizacao_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Copied % planting areas', v_count;

  -- Copy productivities
  INSERT INTO produtividades_projections (
    id, projection_id, organizacao_id, cultura_id, sistema_id,
    produtividades_por_safra, unidade, observacoes,
    created_at, updated_at, original_produtividade_id
  )
  SELECT 
    gen_random_uuid(), v_projection_id, organizacao_id, cultura_id, sistema_id,
    produtividades_por_safra, unidade, observacoes,
    created_at, CURRENT_TIMESTAMP, id
  FROM produtividades
  WHERE organizacao_id = p_organizacao_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Copied % productivities', v_count;

  -- Copy production costs
  INSERT INTO custos_producao_projections (
    id, projection_id, organizacao_id, propriedade_id, cultura_id,
    sistema_id, ciclo_id, categoria, custos_por_safra, observacoes,
    created_at, updated_at, original_custo_id
  )
  SELECT 
    gen_random_uuid(), v_projection_id, organizacao_id, propriedade_id, cultura_id,
    sistema_id, ciclo_id, categoria, custos_por_safra, observacoes,
    created_at, CURRENT_TIMESTAMP, id
  FROM custos_producao
  WHERE organizacao_id = p_organizacao_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Copied % production costs', v_count;

  -- IMPORTANT: Copy commodity prices from commodity_price_projections table
  -- First count how many records we have to copy
  SELECT COUNT(*) INTO v_commodity_count
  FROM commodity_price_projections
  WHERE organizacao_id = p_organizacao_id
  AND projection_id IS NULL;
  
  RAISE NOTICE 'Found % commodity prices to copy', v_commodity_count;

  -- Copy ALL price data from commodity_price_projections table
  INSERT INTO commodity_price_projections_projections (
    id, projection_id, organizacao_id, commodity_type, cultura_id, sistema_id, ciclo_id,
    safra_id, unit, current_price, precos_por_ano, premissas_precos,
    created_at, updated_at, original_commodity_price_id
  )
  SELECT 
    gen_random_uuid(), v_projection_id, organizacao_id, commodity_type, cultura_id, sistema_id, ciclo_id,
    safra_id, unit, current_price, precos_por_ano, premissas_precos,
    created_at, CURRENT_TIMESTAMP, id
  FROM commodity_price_projections
  WHERE organizacao_id = p_organizacao_id
  AND projection_id IS NULL; -- Only copy base data

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Copied % commodity price records', v_count;

  -- Copy exchange rates if they exist in cotacoes_cambio table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'cotacoes_cambio' 
    AND table_schema = 'public'
  ) THEN
    SELECT COUNT(*) INTO v_exchange_count
    FROM cotacoes_cambio
    WHERE organizacao_id = p_organizacao_id
    AND projection_id IS NULL;
    
    RAISE NOTICE 'Found % exchange rates to copy', v_exchange_count;

    INSERT INTO cotacoes_cambio_projections (
      id, projection_id, organizacao_id, tipo_moeda, safra_id,
      unit, cotacao_atual, cotacoes_por_ano,
      created_at, updated_at, original_cotacao_id
    )
    SELECT 
      gen_random_uuid(), v_projection_id, organizacao_id, tipo_moeda, safra_id,
      unit, cotacao_atual, cotacoes_por_ano,
      created_at, CURRENT_TIMESTAMP, id
    FROM cotacoes_cambio
    WHERE organizacao_id = p_organizacao_id
    AND projection_id IS NULL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Copied % exchange rate records', v_count;
  END IF;

  -- Log final summary
  RAISE NOTICE 'Successfully created projection % with ID %', p_nome, v_projection_id;
  RAISE NOTICE 'Total commodity prices copied: %', v_commodity_count;
  
  RETURN v_projection_id;
END;
$$ LANGUAGE plpgsql;

-- Test the data copy with a verification query
DO $$
DECLARE
  v_org_id uuid := '4a8327ab-d9ae-44a5-9189-bb098bce924b';
  v_base_count integer;
  v_projection_count integer;
BEGIN
  -- Count base commodity prices
  SELECT COUNT(*) INTO v_base_count
  FROM commodity_price_projections
  WHERE organizacao_id = v_org_id
  AND projection_id IS NULL;
  
  RAISE NOTICE 'Base commodity prices for organization: %', v_base_count;
  
  -- Count projection prices for each projection
  FOR rec IN 
    SELECT id, nome 
    FROM projections 
    WHERE organizacao_id = v_org_id
  LOOP
    SELECT COUNT(*) INTO v_projection_count
    FROM commodity_price_projections_projections
    WHERE organizacao_id = v_org_id
    AND projection_id = rec.id;
    
    RAISE NOTICE 'Projection % (%): % prices', rec.nome, rec.id, v_projection_count;
  END LOOP;
END $$;