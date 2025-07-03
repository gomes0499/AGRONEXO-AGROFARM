-- Add ciclo_id column to produtividades_projections table
ALTER TABLE produtividades_projections 
ADD COLUMN IF NOT EXISTS ciclo_id uuid REFERENCES ciclos(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_produtividades_projections_ciclo 
ON produtividades_projections(ciclo_id);

-- Update create_projection function to include ciclo_id
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

  -- Copy productivities (now including ciclo_id)
  INSERT INTO produtividades_projections (
    id, projection_id, organizacao_id, cultura_id, sistema_id, ciclo_id,
    produtividades_por_safra, unidade, observacoes,
    created_at, updated_at, original_produtividade_id
  )
  SELECT 
    id, v_projection_id, organizacao_id, cultura_id, sistema_id, ciclo_id,
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

  -- Copy prices from precos table
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

  -- Copy commodity price projections (if they exist)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commodity_price_projections_projections') THEN
    INSERT INTO commodity_price_projections_projections (
      id, projection_id, organizacao_id, commodity_type, cultura_id, sistema_id, ciclo_id,
      safra_id, unit, current_price, precos_por_ano, premissas_precos,
      created_at, updated_at, original_commodity_price_id
    )
    SELECT 
      id, v_projection_id, organizacao_id, commodity_type, cultura_id, sistema_id, ciclo_id,
      safra_id, unit, current_price, precos_por_ano, premissas_precos,
      created_at, CURRENT_TIMESTAMP, id
    FROM commodity_price_projections
    WHERE organizacao_id = p_organizacao_id
    AND projection_id IS NULL;
  END IF;

  -- Copy exchange rates (if they exist)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cotacoes_cambio_projections') THEN
    INSERT INTO cotacoes_cambio_projections (
      id, projection_id, organizacao_id, tipo_moeda, safra_id,
      unit, cotacao_atual, cotacoes_por_ano,
      created_at, updated_at, original_cotacao_id
    )
    SELECT 
      id, v_projection_id, organizacao_id, tipo_moeda, safra_id,
      unit, cotacao_atual, cotacoes_por_ano,
      created_at, CURRENT_TIMESTAMP, id
    FROM cotacoes_cambio
    WHERE organizacao_id = p_organizacao_id
    AND projection_id IS NULL;
  END IF;

  -- Copy outras_despesas (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'outras_despesas_projections') THEN
    INSERT INTO outras_despesas_projections (
      projection_id, organizacao_id, categoria, descricao, moeda, valores_por_ano,
      created_at, updated_at
    )
    SELECT 
      v_projection_id, organizacao_id, categoria, descricao, moeda, valores_por_ano,
      created_at, CURRENT_TIMESTAMP
    FROM outras_despesas
    WHERE organizacao_id = p_organizacao_id;
  END IF;

  -- Copy receitas_financeiras (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'receitas_financeiras_projections') THEN
    INSERT INTO receitas_financeiras_projections (
      projection_id, organizacao_id, categoria, descricao, moeda, valores_por_safra,
      created_at, updated_at
    )
    SELECT 
      v_projection_id, organizacao_id, categoria, descricao, moeda, valores_por_safra,
      created_at, CURRENT_TIMESTAMP
    FROM receitas_financeiras
    WHERE organizacao_id = p_organizacao_id;
  END IF;

  RETURN v_projection_id;
END;
$$ LANGUAGE plpgsql;

-- Update existing projections to populate ciclo_id if missing
UPDATE produtividades_projections pp
SET ciclo_id = p.ciclo_id
FROM produtividades p
WHERE pp.original_produtividade_id = p.id
AND pp.ciclo_id IS NULL;