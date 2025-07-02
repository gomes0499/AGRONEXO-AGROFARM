-- Fix update_production_cost_with_projection function to remove reference to non-existent descricao column

DROP FUNCTION IF EXISTS update_production_cost_with_projection;

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
    -- Update in projection table (only update columns that exist)
    UPDATE custos_producao_projections
    SET 
      custos_por_safra = COALESCE((p_data->>'custos_por_safra')::jsonb, custos_por_safra),
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
      sistema_id, ciclo_id, categoria, custos_por_safra,
      observacoes, created_at, updated_at, original_custo_id
    )
    SELECT 
      id, p_projection_id, organizacao_id, propriedade_id, cultura_id,
      sistema_id, ciclo_id, categoria, custos_por_safra,
      observacoes, created_at, CURRENT_TIMESTAMP, id
    FROM custos_producao
    WHERE id = p_id;

    -- Then update with new data
    UPDATE custos_producao_projections
    SET 
      custos_por_safra = COALESCE((p_data->>'custos_por_safra')::jsonb, custos_por_safra),
      observacoes = COALESCE(p_data->>'observacoes', observacoes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND projection_id = p_projection_id
    RETURNING to_jsonb(custos_producao_projections.*) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Also fix the create function to ensure it doesn't reference descricao
DROP FUNCTION IF EXISTS create_production_cost_with_projection;

CREATE OR REPLACE FUNCTION create_production_cost_with_projection(
  p_data jsonb,
  p_projection_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_new_id uuid;
BEGIN
  v_new_id := gen_random_uuid();
  
  INSERT INTO custos_producao_projections (
    id, projection_id, organizacao_id, propriedade_id, cultura_id,
    sistema_id, ciclo_id, categoria, custos_por_safra,
    observacoes, created_at, updated_at
  )
  VALUES (
    v_new_id,
    p_projection_id,
    (p_data->>'organizacao_id')::uuid,
    (p_data->>'propriedade_id')::uuid,
    (p_data->>'cultura_id')::uuid,
    (p_data->>'sistema_id')::uuid,
    (p_data->>'ciclo_id')::uuid,
    p_data->>'categoria',
    COALESCE((p_data->>'custos_por_safra')::jsonb, '{}'::jsonb),
    p_data->>'observacoes',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  RETURNING to_jsonb(custos_producao_projections.*) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;