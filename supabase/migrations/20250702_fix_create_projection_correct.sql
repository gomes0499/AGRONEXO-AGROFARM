-- Fix create_projection function based on actual table structure
-- All prices (commodities and exchange rates) are in commodity_price_projections table
CREATE OR REPLACE FUNCTION create_projection(
  p_organizacao_id uuid,
  p_nome text,
  p_descricao text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_projection_id uuid;
  v_count integer;
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

  -- Copy ALL price data from commodity_price_projections table (both commodities and exchange rates)
  -- This includes both regular commodity prices and exchange rates (like DOLAR_* types)
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
  RAISE NOTICE 'Copied % price records (commodities + exchange rates)', v_count;

  -- Copy prices from precos table (if it exists and has data)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'precos' AND table_schema = 'public') THEN
    INSERT INTO precos_projections (
      id, projection_id, organizacao_id, safra_id,
      dolar_algodao, dolar_milho, dolar_soja, dolar_fechamento,
      preco_algodao, preco_caroco_algodao, preco_unitario_caroco_algodao, preco_algodao_bruto,
      preco_milho, preco_soja_usd, preco_soja_brl,
      outros_precos, created_at, updated_at, original_preco_id
    )
    SELECT 
      gen_random_uuid(), v_projection_id, organizacao_id, safra_id,
      dolar_algodao, dolar_milho, dolar_soja, dolar_fechamento,
      preco_algodao, preco_caroco_algodao, preco_unitario_caroco_algodao, preco_algodao_bruto,
      preco_milho, preco_soja_usd, preco_soja_brl,
      outros_precos, created_at, CURRENT_TIMESTAMP, id
    FROM precos
    WHERE organizacao_id = p_organizacao_id;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Copied % legacy price records from precos table', v_count;
  END IF;

  -- Copy exchange rates from cotacoes_cambio table (if it exists and has data)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cotacoes_cambio' AND table_schema = 'public') THEN
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
    RAISE NOTICE 'Copied % exchange rate records from cotacoes_cambio table', v_count;
  END IF;

  RAISE NOTICE 'Successfully created projection % with ID %', p_nome, v_projection_id;
  RETURN v_projection_id;
END;
$$ LANGUAGE plpgsql;