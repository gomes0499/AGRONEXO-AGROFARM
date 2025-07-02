-- Create commodity_price_projections_projections table (for projection scenarios)
CREATE TABLE IF NOT EXISTS commodity_price_projections_projections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projection_id uuid NOT NULL REFERENCES projections(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  
  -- Copy all fields from commodity_price_projections
  commodity_type text,
  cultura_id uuid REFERENCES culturas(id),
  sistema_id uuid REFERENCES sistemas(id),
  ciclo_id uuid REFERENCES ciclos(id),
  safra_id uuid REFERENCES safras(id),
  unit text,
  current_price numeric,
  precos_por_ano jsonb DEFAULT '{}',
  premissas_precos jsonb,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Link to original record
  original_commodity_price_id uuid
);

-- Create indexes
CREATE INDEX idx_commodity_price_projections_projections_projection ON commodity_price_projections_projections(projection_id);
CREATE INDEX idx_commodity_price_projections_projections_organizacao ON commodity_price_projections_projections(organizacao_id);
CREATE INDEX idx_commodity_price_projections_projections_safra ON commodity_price_projections_projections(safra_id);

-- Create cotacoes_cambio_projections table (for projection scenarios)
CREATE TABLE IF NOT EXISTS cotacoes_cambio_projections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projection_id uuid NOT NULL REFERENCES projections(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  
  -- Copy all fields from cotacoes_cambio
  tipo_moeda text,
  safra_id uuid REFERENCES safras(id),
  unit text,
  cotacao_atual numeric,
  cotacoes_por_ano jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Link to original record
  original_cotacao_id uuid
);

-- Create indexes
CREATE INDEX idx_cotacoes_cambio_projections_projection ON cotacoes_cambio_projections(projection_id);
CREATE INDEX idx_cotacoes_cambio_projections_organizacao ON cotacoes_cambio_projections(organizacao_id);

-- Update the create_projection function to copy commodity prices and exchange rates
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

  -- Copy commodity price projections (from main table where projection_id is null)
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
  AND projection_id IS NULL; -- Only copy base data

  -- Copy exchange rates (from main table where projection_id is null)
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
  AND projection_id IS NULL; -- Only copy base data

  RETURN v_projection_id;
END;
$$ LANGUAGE plpgsql;