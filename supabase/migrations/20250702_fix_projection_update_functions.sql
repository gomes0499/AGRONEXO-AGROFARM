-- Add missing RPC functions for updating production data with projection support

-- Update productivity with projection support
CREATE OR REPLACE FUNCTION update_productivity_with_projection(
  p_id uuid,
  p_data jsonb,
  p_projection_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_organizacao_id uuid;
BEGIN
  -- First check if this productivity exists in the projection table
  SELECT organizacao_id INTO v_organizacao_id
  FROM produtividades_projections
  WHERE id = p_id AND projection_id = p_projection_id;

  IF v_organizacao_id IS NOT NULL THEN
    -- Update in projection table
    UPDATE produtividades_projections
    SET 
      produtividades_por_safra = COALESCE((p_data->>'produtividades_por_safra')::jsonb, produtividades_por_safra),
      observacoes = COALESCE(p_data->>'observacoes', observacoes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND projection_id = p_projection_id
    RETURNING to_jsonb(produtividades_projections.*) INTO v_result;
  ELSE
    -- Check if it exists in the main table
    SELECT organizacao_id INTO v_organizacao_id
    FROM produtividades
    WHERE id = p_id;

    IF v_organizacao_id IS NULL THEN
      RAISE EXCEPTION 'Produtividade não encontrada: %', p_id;
    END IF;

    -- Copy from main table to projection table first
    INSERT INTO produtividades_projections (
      id, projection_id, organizacao_id, propriedade_id, cultura_id, 
      sistema_id, ciclo_id, produtividades_por_safra, observacoes,
      created_at, updated_at
    )
    SELECT 
      id, p_projection_id, organizacao_id, propriedade_id, cultura_id,
      sistema_id, ciclo_id, produtividades_por_safra, observacoes,
      created_at, CURRENT_TIMESTAMP
    FROM produtividades
    WHERE id = p_id;

    -- Then update with new data
    UPDATE produtividades_projections
    SET 
      produtividades_por_safra = COALESCE((p_data->>'produtividades_por_safra')::jsonb, produtividades_por_safra),
      observacoes = COALESCE(p_data->>'observacoes', observacoes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND projection_id = p_projection_id
    RETURNING to_jsonb(produtividades_projections.*) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Update production cost with projection support
CREATE OR REPLACE FUNCTION update_production_cost_with_projection(
  p_id uuid,
  p_data jsonb,
  p_projection_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_organizacao_id uuid;
BEGIN
  -- First check if this cost exists in the projection table
  SELECT organizacao_id INTO v_organizacao_id
  FROM custos_producao_projections
  WHERE id = p_id AND projection_id = p_projection_id;

  IF v_organizacao_id IS NOT NULL THEN
    -- Update in projection table
    UPDATE custos_producao_projections
    SET 
      custos_por_safra = COALESCE((p_data->>'custos_por_safra')::jsonb, custos_por_safra),
      descricao = COALESCE(p_data->>'descricao', descricao),
      observacoes = COALESCE(p_data->>'observacoes', observacoes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND projection_id = p_projection_id
    RETURNING to_jsonb(custos_producao_projections.*) INTO v_result;
  ELSE
    -- Check if it exists in the main table
    SELECT organizacao_id INTO v_organizacao_id
    FROM custos_producao
    WHERE id = p_id;

    IF v_organizacao_id IS NULL THEN
      RAISE EXCEPTION 'Custo de produção não encontrado: %', p_id;
    END IF;

    -- Copy from main table to projection table first
    INSERT INTO custos_producao_projections (
      id, projection_id, organizacao_id, propriedade_id, cultura_id, 
      sistema_id, ciclo_id, categoria, custos_por_safra, descricao, 
      observacoes, created_at, updated_at
    )
    SELECT 
      id, p_projection_id, organizacao_id, propriedade_id, cultura_id,
      sistema_id, ciclo_id, categoria, custos_por_safra, descricao,
      observacoes, created_at, CURRENT_TIMESTAMP
    FROM custos_producao
    WHERE id = p_id;

    -- Then update with new data
    UPDATE custos_producao_projections
    SET 
      custos_por_safra = COALESCE((p_data->>'custos_por_safra')::jsonb, custos_por_safra),
      descricao = COALESCE(p_data->>'descricao', descricao),
      observacoes = COALESCE(p_data->>'observacoes', observacoes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND projection_id = p_projection_id
    RETURNING to_jsonb(custos_producao_projections.*) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to fetch production data with projection support
CREATE OR REPLACE FUNCTION get_planting_areas_with_projection(
  p_organizacao_id uuid,
  p_projection_id uuid DEFAULT NULL
) RETURNS SETOF jsonb AS $$
BEGIN
  IF p_projection_id IS NOT NULL THEN
    -- Return data from projection table
    RETURN QUERY
    SELECT to_jsonb(ap.*) || 
           jsonb_build_object(
             'propriedades', jsonb_build_object('nome', p.nome),
             'culturas', jsonb_build_object('nome', c.nome),
             'sistemas', jsonb_build_object('nome', s.nome),
             'ciclos', jsonb_build_object('nome', ci.nome)
           )
    FROM areas_plantio_projections ap
    LEFT JOIN propriedades p ON ap.propriedade_id = p.id
    LEFT JOIN culturas c ON ap.cultura_id = c.id
    LEFT JOIN sistemas s ON ap.sistema_id = s.id
    LEFT JOIN ciclos ci ON ap.ciclo_id = ci.id
    WHERE ap.organizacao_id = p_organizacao_id
      AND ap.projection_id = p_projection_id;
  ELSE
    -- Return data from main table
    RETURN QUERY
    SELECT to_jsonb(ap.*) || 
           jsonb_build_object(
             'propriedades', jsonb_build_object('nome', p.nome),
             'culturas', jsonb_build_object('nome', c.nome),
             'sistemas', jsonb_build_object('nome', s.nome),
             'ciclos', jsonb_build_object('nome', ci.nome)
           )
    FROM areas_plantio ap
    LEFT JOIN propriedades p ON ap.propriedade_id = p.id
    LEFT JOIN culturas c ON ap.cultura_id = c.id
    LEFT JOIN sistemas s ON ap.sistema_id = s.id
    LEFT JOIN ciclos ci ON ap.ciclo_id = ci.id
    WHERE ap.organizacao_id = p_organizacao_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_productivities_with_projection(
  p_organizacao_id uuid,
  p_projection_id uuid DEFAULT NULL
) RETURNS SETOF jsonb AS $$
BEGIN
  IF p_projection_id IS NOT NULL THEN
    -- Return data from projection table
    RETURN QUERY
    SELECT to_jsonb(pp.*) || 
           jsonb_build_object(
             'propriedades', jsonb_build_object('nome', p.nome),
             'culturas', jsonb_build_object('nome', c.nome),
             'sistemas', jsonb_build_object('nome', s.nome),
             'ciclos', jsonb_build_object('nome', ci.nome)
           )
    FROM produtividades_projections pp
    LEFT JOIN propriedades p ON pp.propriedade_id = p.id
    LEFT JOIN culturas c ON pp.cultura_id = c.id
    LEFT JOIN sistemas s ON pp.sistema_id = s.id
    LEFT JOIN ciclos ci ON pp.ciclo_id = ci.id
    WHERE pp.organizacao_id = p_organizacao_id
      AND pp.projection_id = p_projection_id;
  ELSE
    -- Return data from main table
    RETURN QUERY
    SELECT to_jsonb(pp.*) || 
           jsonb_build_object(
             'propriedades', jsonb_build_object('nome', p.nome),
             'culturas', jsonb_build_object('nome', c.nome),
             'sistemas', jsonb_build_object('nome', s.nome),
             'ciclos', jsonb_build_object('nome', ci.nome)
           )
    FROM produtividades pp
    LEFT JOIN propriedades p ON pp.propriedade_id = p.id
    LEFT JOIN culturas c ON pp.cultura_id = c.id
    LEFT JOIN sistemas s ON pp.sistema_id = s.id
    LEFT JOIN ciclos ci ON pp.ciclo_id = ci.id
    WHERE pp.organizacao_id = p_organizacao_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_production_costs_with_projection(
  p_organizacao_id uuid,
  p_projection_id uuid DEFAULT NULL
) RETURNS SETOF jsonb AS $$
BEGIN
  IF p_projection_id IS NOT NULL THEN
    -- Return data from projection table
    RETURN QUERY
    SELECT to_jsonb(cp.*) || 
           jsonb_build_object(
             'propriedades', jsonb_build_object('nome', p.nome),
             'culturas', jsonb_build_object('nome', c.nome),
             'sistemas', jsonb_build_object('nome', s.nome),
             'ciclos', jsonb_build_object('nome', ci.nome)
           )
    FROM custos_producao_projections cp
    LEFT JOIN propriedades p ON cp.propriedade_id = p.id
    LEFT JOIN culturas c ON cp.cultura_id = c.id
    LEFT JOIN sistemas s ON cp.sistema_id = s.id
    LEFT JOIN ciclos ci ON cp.ciclo_id = ci.id
    WHERE cp.organizacao_id = p_organizacao_id
      AND cp.projection_id = p_projection_id;
  ELSE
    -- Return data from main table
    RETURN QUERY
    SELECT to_jsonb(cp.*) || 
           jsonb_build_object(
             'propriedades', jsonb_build_object('nome', p.nome),
             'culturas', jsonb_build_object('nome', c.nome),
             'sistemas', jsonb_build_object('nome', s.nome),
             'ciclos', jsonb_build_object('nome', ci.nome)
           )
    FROM custos_producao cp
    LEFT JOIN propriedades p ON cp.propriedade_id = p.id
    LEFT JOIN culturas c ON cp.cultura_id = c.id
    LEFT JOIN sistemas s ON cp.sistema_id = s.id
    LEFT JOIN ciclos ci ON cp.ciclo_id = ci.id
    WHERE cp.organizacao_id = p_organizacao_id;
  END IF;
END;
$$ LANGUAGE plpgsql;