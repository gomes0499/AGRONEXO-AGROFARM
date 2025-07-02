-- Create RPC functions to copy commodity prices and exchange rates to projections
-- These functions are called by the frontend when creating a new projection

-- Function to copy commodity prices to a projection
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

-- Function to copy exchange rates to a projection
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

-- Verify the functions were created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'copy_commodity_prices_to_projection') THEN
        RAISE NOTICE 'Function copy_commodity_prices_to_projection created successfully';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'copy_cotacoes_cambio_to_projection') THEN
        RAISE NOTICE 'Function copy_cotacoes_cambio_to_projection created successfully';
    END IF;
END $$;