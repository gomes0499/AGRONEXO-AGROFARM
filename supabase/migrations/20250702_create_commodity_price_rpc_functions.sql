-- Create RPC functions for commodity prices with projection support
-- Following the same pattern as areas_plantio, produtividades, and custos_producao

-- Function to fetch commodity prices with projection support
CREATE OR REPLACE FUNCTION get_commodity_prices_with_projection(
  p_organizacao_id uuid,
  p_projection_id uuid DEFAULT NULL
) RETURNS SETOF jsonb AS $$
BEGIN
  IF p_projection_id IS NOT NULL THEN
    -- Return data from projection table
    RETURN QUERY
    SELECT to_jsonb(cpp.*) || 
           jsonb_build_object(
             'cultura', CASE 
               WHEN cpp.cultura_id IS NOT NULL THEN 
                 (SELECT jsonb_build_object('id', id, 'nome', nome) FROM culturas WHERE id = cpp.cultura_id)
               ELSE NULL
             END,
             'sistema', CASE 
               WHEN cpp.sistema_id IS NOT NULL THEN 
                 (SELECT jsonb_build_object('id', id, 'nome', nome) FROM sistemas WHERE id = cpp.sistema_id)
               ELSE NULL
             END,
             'ciclo', CASE 
               WHEN cpp.ciclo_id IS NOT NULL THEN 
                 (SELECT jsonb_build_object('id', id, 'nome', nome) FROM ciclos WHERE id = cpp.ciclo_id)
               ELSE NULL
             END,
             'safra', CASE 
               WHEN cpp.safra_id IS NOT NULL THEN 
                 (SELECT jsonb_build_object('id', id, 'nome', nome, 'ano_inicio', ano_inicio, 'ano_fim', ano_fim) FROM safras WHERE id = cpp.safra_id)
               ELSE NULL
             END
           )
    FROM commodity_price_projections_projections cpp
    WHERE cpp.organizacao_id = p_organizacao_id
      AND cpp.projection_id = p_projection_id
    ORDER BY cpp.commodity_type;
  ELSE
    -- Return data from main table
    RETURN QUERY
    SELECT to_jsonb(cp.*) || 
           jsonb_build_object(
             'cultura', CASE 
               WHEN cp.cultura_id IS NOT NULL THEN 
                 (SELECT jsonb_build_object('id', id, 'nome', nome) FROM culturas WHERE id = cp.cultura_id)
               ELSE NULL
             END,
             'sistema', CASE 
               WHEN cp.sistema_id IS NOT NULL THEN 
                 (SELECT jsonb_build_object('id', id, 'nome', nome) FROM sistemas WHERE id = cp.sistema_id)
               ELSE NULL
             END,
             'ciclo', CASE 
               WHEN cp.ciclo_id IS NOT NULL THEN 
                 (SELECT jsonb_build_object('id', id, 'nome', nome) FROM ciclos WHERE id = cp.ciclo_id)
               ELSE NULL
             END,
             'safra', CASE 
               WHEN cp.safra_id IS NOT NULL THEN 
                 (SELECT jsonb_build_object('id', id, 'nome', nome, 'ano_inicio', ano_inicio, 'ano_fim', ano_fim) FROM safras WHERE id = cp.safra_id)
               ELSE NULL
             END
           )
    FROM commodity_price_projections cp
    WHERE cp.organizacao_id = p_organizacao_id
      AND cp.projection_id IS NULL
    ORDER BY cp.commodity_type;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to fetch exchange rates with projection support
CREATE OR REPLACE FUNCTION get_exchange_rates_with_projection(
  p_organizacao_id uuid,
  p_projection_id uuid DEFAULT NULL
) RETURNS SETOF jsonb AS $$
BEGIN
  IF p_projection_id IS NOT NULL THEN
    -- Return data from projection table
    RETURN QUERY
    SELECT to_jsonb(crp.*) || 
           jsonb_build_object(
             'safra', CASE 
               WHEN crp.safra_id IS NOT NULL THEN 
                 (SELECT jsonb_build_object('id', id, 'nome', nome, 'ano_inicio', ano_inicio, 'ano_fim', ano_fim) FROM safras WHERE id = crp.safra_id)
               ELSE NULL
             END
           )
    FROM cotacoes_cambio_projections crp
    WHERE crp.organizacao_id = p_organizacao_id
      AND crp.projection_id = p_projection_id
    ORDER BY crp.tipo_moeda;
  ELSE
    -- Return data from main table
    RETURN QUERY
    SELECT to_jsonb(cr.*) || 
           jsonb_build_object(
             'safra', CASE 
               WHEN cr.safra_id IS NOT NULL THEN 
                 (SELECT jsonb_build_object('id', id, 'nome', nome, 'ano_inicio', ano_inicio, 'ano_fim', ano_fim) FROM safras WHERE id = cr.safra_id)
               ELSE NULL
             END
           )
    FROM cotacoes_cambio cr
    WHERE cr.organizacao_id = p_organizacao_id
      AND cr.projection_id IS NULL
    ORDER BY cr.tipo_moeda;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create commodity price with projection support
CREATE OR REPLACE FUNCTION create_commodity_price_with_projection(
  p_data jsonb,
  p_projection_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_new_id uuid;
BEGIN
  v_new_id := gen_random_uuid();
  
  INSERT INTO commodity_price_projections_projections (
    id, projection_id, organizacao_id, commodity_type, cultura_id, sistema_id, ciclo_id,
    safra_id, unit, current_price, precos_por_ano, premissas_precos,
    created_at, updated_at
  )
  VALUES (
    v_new_id,
    p_projection_id,
    (p_data->>'organizacao_id')::uuid,
    p_data->>'commodity_type',
    CASE WHEN p_data->>'cultura_id' != '' THEN (p_data->>'cultura_id')::uuid ELSE NULL END,
    CASE WHEN p_data->>'sistema_id' != '' THEN (p_data->>'sistema_id')::uuid ELSE NULL END,
    CASE WHEN p_data->>'ciclo_id' != '' THEN (p_data->>'ciclo_id')::uuid ELSE NULL END,
    CASE WHEN p_data->>'safra_id' != '' THEN (p_data->>'safra_id')::uuid ELSE NULL END,
    p_data->>'unit',
    (p_data->>'current_price')::numeric,
    COALESCE((p_data->>'precos_por_ano')::jsonb, '{}'::jsonb),
    COALESCE((p_data->>'premissas_precos')::jsonb, NULL),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  RETURNING to_jsonb(commodity_price_projections_projections.*) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to update commodity price with projection support
CREATE OR REPLACE FUNCTION update_commodity_price_with_projection(
  p_id uuid,
  p_data jsonb,
  p_projection_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_organizacao_id uuid;
BEGIN
  -- First check if this price exists in the projection table
  SELECT organizacao_id INTO v_organizacao_id
  FROM commodity_price_projections_projections
  WHERE id = p_id AND projection_id = p_projection_id;

  IF v_organizacao_id IS NOT NULL THEN
    -- Update in projection table
    UPDATE commodity_price_projections_projections
    SET 
      current_price = COALESCE((p_data->>'current_price')::numeric, current_price),
      precos_por_ano = COALESCE((p_data->>'precos_por_ano')::jsonb, precos_por_ano),
      premissas_precos = COALESCE((p_data->>'premissas_precos')::jsonb, premissas_precos),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND projection_id = p_projection_id
    RETURNING to_jsonb(commodity_price_projections_projections.*) INTO v_result;
  ELSE
    -- Check if it exists in the main table
    SELECT organizacao_id INTO v_organizacao_id
    FROM commodity_price_projections
    WHERE id = p_id;

    IF v_organizacao_id IS NULL THEN
      RAISE EXCEPTION 'Preço de commodity não encontrado: %', p_id;
    END IF;

    -- Copy from main table to projection table first
    INSERT INTO commodity_price_projections_projections (
      id, projection_id, organizacao_id, commodity_type, cultura_id, sistema_id, ciclo_id,
      safra_id, unit, current_price, precos_por_ano, premissas_precos,
      created_at, updated_at, original_commodity_price_id
    )
    SELECT 
      gen_random_uuid(), p_projection_id, organizacao_id, commodity_type, cultura_id, sistema_id, ciclo_id,
      safra_id, unit, current_price, precos_por_ano, premissas_precos,
      created_at, CURRENT_TIMESTAMP, id
    FROM commodity_price_projections
    WHERE id = p_id AND projection_id IS NULL;

    -- Then update with new data
    UPDATE commodity_price_projections_projections
    SET 
      current_price = COALESCE((p_data->>'current_price')::numeric, current_price),
      precos_por_ano = COALESCE((p_data->>'precos_por_ano')::jsonb, precos_por_ano),
      premissas_precos = COALESCE((p_data->>'premissas_precos')::jsonb, premissas_precos),
      updated_at = CURRENT_TIMESTAMP
    WHERE original_commodity_price_id = p_id AND projection_id = p_projection_id
    RETURNING to_jsonb(commodity_price_projections_projections.*) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;