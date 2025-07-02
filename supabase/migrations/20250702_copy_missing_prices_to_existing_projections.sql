-- Copy missing prices to existing projections that were created without them
DO $$
DECLARE
  v_org_id uuid := '4a8327ab-d9ae-44a5-9189-bb098bce924b';
  v_projection_record RECORD;
  v_count integer;
  v_existing_count integer;
BEGIN
  RAISE NOTICE 'Starting to copy missing prices to existing projections...';
  
  -- Loop through all projections for the organization
  FOR v_projection_record IN 
    SELECT id, nome 
    FROM projections 
    WHERE organizacao_id = v_org_id
    AND is_active = true
  LOOP
    -- Check if this projection already has prices
    SELECT COUNT(*) INTO v_existing_count
    FROM commodity_price_projections_projections
    WHERE projection_id = v_projection_record.id;
    
    IF v_existing_count = 0 THEN
      RAISE NOTICE 'Projection % (%s) has no prices, copying from base...', v_projection_record.nome, v_projection_record.id;
      
      -- Copy commodity prices for this projection
      INSERT INTO commodity_price_projections_projections (
        id, projection_id, organizacao_id, commodity_type, cultura_id, sistema_id, ciclo_id,
        safra_id, unit, current_price, precos_por_ano, premissas_precos,
        created_at, updated_at, original_commodity_price_id
      )
      SELECT 
        gen_random_uuid(), v_projection_record.id, organizacao_id, commodity_type, cultura_id, sistema_id, ciclo_id,
        safra_id, unit, current_price, precos_por_ano, premissas_precos,
        created_at, CURRENT_TIMESTAMP, id
      FROM commodity_price_projections
      WHERE organizacao_id = v_org_id
      AND projection_id IS NULL;
      
      GET DIAGNOSTICS v_count = ROW_COUNT;
      RAISE NOTICE 'Copied % commodity prices to projection %', v_count, v_projection_record.nome;
    ELSE
      RAISE NOTICE 'Projection % already has % prices, skipping...', v_projection_record.nome, v_existing_count;
    END IF;
    
    -- Also check and copy exchange rates if needed
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'cotacoes_cambio' 
      AND table_schema = 'public'
    ) THEN
      SELECT COUNT(*) INTO v_existing_count
      FROM cotacoes_cambio_projections
      WHERE projection_id = v_projection_record.id;
      
      IF v_existing_count = 0 THEN
        INSERT INTO cotacoes_cambio_projections (
          id, projection_id, organizacao_id, tipo_moeda, safra_id,
          unit, cotacao_atual, cotacoes_por_ano,
          created_at, updated_at, original_cotacao_id
        )
        SELECT 
          gen_random_uuid(), v_projection_record.id, organizacao_id, tipo_moeda, safra_id,
          unit, cotacao_atual, cotacoes_por_ano,
          created_at, CURRENT_TIMESTAMP, id
        FROM cotacoes_cambio
        WHERE organizacao_id = v_org_id
        AND projection_id IS NULL;
        
        GET DIAGNOSTICS v_count = ROW_COUNT;
        IF v_count > 0 THEN
          RAISE NOTICE 'Copied % exchange rates to projection %', v_count, v_projection_record.nome;
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Finished copying missing prices to projections.';
  
  -- Show final counts
  RAISE NOTICE '=== FINAL VERIFICATION ===';
  FOR v_projection_record IN 
    SELECT id, nome 
    FROM projections 
    WHERE organizacao_id = v_org_id
  LOOP
    SELECT COUNT(*) INTO v_count
    FROM commodity_price_projections_projections
    WHERE projection_id = v_projection_record.id;
    
    RAISE NOTICE 'Projection % now has % commodity prices', v_projection_record.nome, v_count;
  END LOOP;
END $$;