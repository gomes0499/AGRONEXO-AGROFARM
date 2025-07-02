-- Create prices projections table
CREATE TABLE IF NOT EXISTS precos_projections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projection_id uuid NOT NULL REFERENCES projections(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  safra_id uuid NOT NULL REFERENCES safras(id) ON DELETE CASCADE,
  
  -- Dólar e conversões
  dolar_algodao numeric,
  dolar_milho numeric,
  dolar_soja numeric,
  dolar_fechamento numeric,
  
  -- Preços do algodão
  preco_algodao numeric, -- USD/lb
  preco_caroco_algodao numeric, -- R$/ton
  preco_unitario_caroco_algodao numeric, -- R$/@
  preco_algodao_bruto numeric, -- R$/@
  
  -- Preços de milho e soja
  preco_milho numeric, -- R$/saca
  preco_soja_usd numeric, -- U$/saca
  preco_soja_brl numeric, -- R$/saca
  
  -- Outros preços
  outros_precos jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Link to original record
  original_preco_id uuid,
  
  -- Unique constraint
  CONSTRAINT unique_projection_safra_price UNIQUE (projection_id, safra_id)
);

-- Create indexes
CREATE INDEX idx_precos_projections_projection ON precos_projections(projection_id);
CREATE INDEX idx_precos_projections_organizacao ON precos_projections(organizacao_id);
CREATE INDEX idx_precos_projections_safra ON precos_projections(safra_id);

-- Update the create_projection function to copy all data including planting areas and prices
CREATE OR REPLACE FUNCTION create_projection(
  p_organizacao_id uuid,
  p_nome text,
  p_descricao text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_projection_id uuid;
BEGIN
  -- Create the projection
  INSERT INTO projections (organizacao_id, nome, descricao, ativo)
  VALUES (p_organizacao_id, p_nome, p_descricao, true)
  RETURNING id INTO v_projection_id;

  -- Copy planting areas
  INSERT INTO areas_plantio_projections (
    id, projection_id, organizacao_id, propriedade_id, cultura_id,
    sistema_id, ciclo_id, areas_por_safra, observacoes, 
    created_at, updated_at, original_area_id
  )
  SELECT 
    id, v_projection_id, organizacao_id, propriedade_id, cultura_id,
    sistema_id, ciclo_id, areas_por_safra, observacoes,
    created_at, CURRENT_TIMESTAMP, id
  FROM areas_plantio
  WHERE organizacao_id = p_organizacao_id;

  -- Copy productivities
  INSERT INTO produtividades_projections (
    id, projection_id, organizacao_id, cultura_id, sistema_id,
    produtividades_por_safra, unidade, observacoes,
    created_at, updated_at, original_produtividade_id
  )
  SELECT 
    id, v_projection_id, organizacao_id, cultura_id, sistema_id,
    produtividades_por_safra, unidade, observacoes,
    created_at, CURRENT_TIMESTAMP, id
  FROM produtividades
  WHERE organizacao_id = p_organizacao_id;

  -- Copy production costs
  INSERT INTO custos_producao_projections (
    id, projection_id, organizacao_id, propriedade_id, cultura_id,
    sistema_id, ciclo_id, categoria, custos_por_safra, observacoes,
    created_at, updated_at, original_custo_id
  )
  SELECT 
    id, v_projection_id, organizacao_id, propriedade_id, cultura_id,
    sistema_id, ciclo_id, categoria, custos_por_safra, observacoes,
    created_at, CURRENT_TIMESTAMP, id
  FROM custos_producao
  WHERE organizacao_id = p_organizacao_id;

  -- Copy prices
  INSERT INTO precos_projections (
    id, projection_id, organizacao_id, safra_id,
    dolar_algodao, dolar_milho, dolar_soja, dolar_fechamento,
    preco_algodao, preco_caroco_algodao, preco_unitario_caroco_algodao, preco_algodao_bruto,
    preco_milho, preco_soja_usd, preco_soja_brl,
    outros_precos, created_at, updated_at, original_preco_id
  )
  SELECT 
    id, v_projection_id, organizacao_id, safra_id,
    dolar_algodao, dolar_milho, dolar_soja, dolar_fechamento,
    preco_algodao, preco_caroco_algodao, preco_unitario_caroco_algodao, preco_algodao_bruto,
    preco_milho, preco_soja_usd, preco_soja_brl,
    outros_precos, created_at, CURRENT_TIMESTAMP, id
  FROM precos
  WHERE organizacao_id = p_organizacao_id;

  RETURN v_projection_id;
END;
$$ LANGUAGE plpgsql;

-- RPC functions for prices with projection support
CREATE OR REPLACE FUNCTION get_prices_with_projection(
  p_organizacao_id uuid,
  p_projection_id uuid DEFAULT NULL
) RETURNS SETOF jsonb AS $$
BEGIN
  IF p_projection_id IS NOT NULL THEN
    -- Return data from projection table
    RETURN QUERY
    SELECT to_jsonb(pp.*) || 
           jsonb_build_object(
             'safras', jsonb_build_object('nome', s.nome, 'ano_inicio', s.ano_inicio, 'ano_fim', s.ano_fim)
           )
    FROM precos_projections pp
    LEFT JOIN safras s ON pp.safra_id = s.id
    WHERE pp.organizacao_id = p_organizacao_id
      AND pp.projection_id = p_projection_id
    ORDER BY s.ano_inicio DESC, s.ano_fim DESC;
  ELSE
    -- Return data from main table
    RETURN QUERY
    SELECT to_jsonb(p.*) || 
           jsonb_build_object(
             'safras', jsonb_build_object('nome', s.nome, 'ano_inicio', s.ano_inicio, 'ano_fim', s.ano_fim)
           )
    FROM precos p
    LEFT JOIN safras s ON p.safra_id = s.id
    WHERE p.organizacao_id = p_organizacao_id
    ORDER BY s.ano_inicio DESC, s.ano_fim DESC;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_price_with_projection(
  p_data jsonb,
  p_projection_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
  v_new_id uuid;
BEGIN
  v_new_id := gen_random_uuid();
  
  INSERT INTO precos_projections (
    id, projection_id, organizacao_id, safra_id,
    dolar_algodao, dolar_milho, dolar_soja, dolar_fechamento,
    preco_algodao, preco_caroco_algodao, preco_unitario_caroco_algodao, preco_algodao_bruto,
    preco_milho, preco_soja_usd, preco_soja_brl,
    outros_precos, created_at, updated_at
  )
  VALUES (
    v_new_id,
    p_projection_id,
    (p_data->>'organizacao_id')::uuid,
    (p_data->>'safra_id')::uuid,
    (p_data->>'dolar_algodao')::numeric,
    (p_data->>'dolar_milho')::numeric,
    (p_data->>'dolar_soja')::numeric,
    (p_data->>'dolar_fechamento')::numeric,
    (p_data->>'preco_algodao')::numeric,
    (p_data->>'preco_caroco_algodao')::numeric,
    (p_data->>'preco_unitario_caroco_algodao')::numeric,
    (p_data->>'preco_algodao_bruto')::numeric,
    (p_data->>'preco_milho')::numeric,
    (p_data->>'preco_soja_usd')::numeric,
    (p_data->>'preco_soja_brl')::numeric,
    COALESCE((p_data->>'outros_precos')::jsonb, '{}'::jsonb),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  RETURNING to_jsonb(precos_projections.*) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_price_with_projection(
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
  FROM precos_projections
  WHERE id = p_id AND projection_id = p_projection_id;

  IF v_organizacao_id IS NOT NULL THEN
    -- Update in projection table
    UPDATE precos_projections
    SET 
      dolar_algodao = COALESCE((p_data->>'dolar_algodao')::numeric, dolar_algodao),
      dolar_milho = COALESCE((p_data->>'dolar_milho')::numeric, dolar_milho),
      dolar_soja = COALESCE((p_data->>'dolar_soja')::numeric, dolar_soja),
      dolar_fechamento = COALESCE((p_data->>'dolar_fechamento')::numeric, dolar_fechamento),
      preco_algodao = COALESCE((p_data->>'preco_algodao')::numeric, preco_algodao),
      preco_caroco_algodao = COALESCE((p_data->>'preco_caroco_algodao')::numeric, preco_caroco_algodao),
      preco_unitario_caroco_algodao = COALESCE((p_data->>'preco_unitario_caroco_algodao')::numeric, preco_unitario_caroco_algodao),
      preco_algodao_bruto = COALESCE((p_data->>'preco_algodao_bruto')::numeric, preco_algodao_bruto),
      preco_milho = COALESCE((p_data->>'preco_milho')::numeric, preco_milho),
      preco_soja_usd = COALESCE((p_data->>'preco_soja_usd')::numeric, preco_soja_usd),
      preco_soja_brl = COALESCE((p_data->>'preco_soja_brl')::numeric, preco_soja_brl),
      outros_precos = COALESCE((p_data->>'outros_precos')::jsonb, outros_precos),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND projection_id = p_projection_id
    RETURNING to_jsonb(precos_projections.*) INTO v_result;
  ELSE
    -- Check if it exists in the main table
    SELECT organizacao_id INTO v_organizacao_id
    FROM precos
    WHERE id = p_id;

    IF v_organizacao_id IS NULL THEN
      RAISE EXCEPTION 'Preço não encontrado: %', p_id;
    END IF;

    -- Copy from main table to projection table first
    INSERT INTO precos_projections (
      id, projection_id, organizacao_id, safra_id,
      dolar_algodao, dolar_milho, dolar_soja, dolar_fechamento,
      preco_algodao, preco_caroco_algodao, preco_unitario_caroco_algodao, preco_algodao_bruto,
      preco_milho, preco_soja_usd, preco_soja_brl,
      outros_precos, created_at, updated_at, original_preco_id
    )
    SELECT 
      id, p_projection_id, organizacao_id, safra_id,
      dolar_algodao, dolar_milho, dolar_soja, dolar_fechamento,
      preco_algodao, preco_caroco_algodao, preco_unitario_caroco_algodao, preco_algodao_bruto,
      preco_milho, preco_soja_usd, preco_soja_brl,
      outros_precos, created_at, CURRENT_TIMESTAMP, id
    FROM precos
    WHERE id = p_id;

    -- Then update with new data
    UPDATE precos_projections
    SET 
      dolar_algodao = COALESCE((p_data->>'dolar_algodao')::numeric, dolar_algodao),
      dolar_milho = COALESCE((p_data->>'dolar_milho')::numeric, dolar_milho),
      dolar_soja = COALESCE((p_data->>'dolar_soja')::numeric, dolar_soja),
      dolar_fechamento = COALESCE((p_data->>'dolar_fechamento')::numeric, dolar_fechamento),
      preco_algodao = COALESCE((p_data->>'preco_algodao')::numeric, preco_algodao),
      preco_caroco_algodao = COALESCE((p_data->>'preco_caroco_algodao')::numeric, preco_caroco_algodao),
      preco_unitario_caroco_algodao = COALESCE((p_data->>'preco_unitario_caroco_algodao')::numeric, preco_unitario_caroco_algodao),
      preco_algodao_bruto = COALESCE((p_data->>'preco_algodao_bruto')::numeric, preco_algodao_bruto),
      preco_milho = COALESCE((p_data->>'preco_milho')::numeric, preco_milho),
      preco_soja_usd = COALESCE((p_data->>'preco_soja_usd')::numeric, preco_soja_usd),
      preco_soja_brl = COALESCE((p_data->>'preco_soja_brl')::numeric, preco_soja_brl),
      outros_precos = COALESCE((p_data->>'outros_precos')::jsonb, outros_precos),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_id AND projection_id = p_projection_id
    RETURNING to_jsonb(precos_projections.*) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_price_with_projection(
  p_id uuid,
  p_projection_id uuid
) RETURNS boolean AS $$
BEGIN
  DELETE FROM precos_projections 
  WHERE id = p_id AND projection_id = p_projection_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;