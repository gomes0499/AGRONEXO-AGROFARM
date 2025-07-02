-- Test the create_projection function with an organization that has data
DO $$
DECLARE
  v_org_id uuid := '4a8327ab-d9ae-44a5-9189-bb098bce924b';
  v_new_projection_id uuid;
  v_base_commodity_count integer;
  v_projection_commodity_count integer;
  v_base_exchange_count integer;
  v_projection_exchange_count integer;
BEGIN
  -- Check base data before creating projection
  SELECT COUNT(*) INTO v_base_commodity_count
  FROM commodity_price_projections 
  WHERE organizacao_id = v_org_id 
  AND projection_id IS NULL;
  
  SELECT COUNT(*) INTO v_base_exchange_count
  FROM cotacoes_cambio 
  WHERE organizacao_id = v_org_id 
  AND projection_id IS NULL;
  
  RAISE NOTICE 'Base data - Commodity prices: %, Exchange rates: %', v_base_commodity_count, v_base_exchange_count;
  
  -- Create a test projection
  SELECT create_projection(v_org_id, 'Teste Automático', 'Teste de cópia de dados') INTO v_new_projection_id;
  
  -- Check if data was copied
  SELECT COUNT(*) INTO v_projection_commodity_count
  FROM commodity_price_projections_projections 
  WHERE organizacao_id = v_org_id 
  AND projection_id = v_new_projection_id;
  
  SELECT COUNT(*) INTO v_projection_exchange_count
  FROM cotacoes_cambio_projections 
  WHERE organizacao_id = v_org_id 
  AND projection_id = v_new_projection_id;
  
  RAISE NOTICE 'Projection data - Commodity prices: %, Exchange rates: %', v_projection_commodity_count, v_projection_exchange_count;
  RAISE NOTICE 'Created projection ID: %', v_new_projection_id;
  
  -- Clean up test projection
  DELETE FROM projections WHERE id = v_new_projection_id;
  RAISE NOTICE 'Test projection cleaned up';
END $$;