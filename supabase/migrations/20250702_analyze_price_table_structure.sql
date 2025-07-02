-- Analyze the actual price table structure and data
DO $$
DECLARE
  v_org_id uuid := '4a8327ab-d9ae-44a5-9189-bb098bce924b';
  rec RECORD;
BEGIN
  RAISE NOTICE '=== ANALYZING PRICE TABLE STRUCTURE ===';
  
  -- Check what tables exist
  RAISE NOTICE 'Checking table existence:';
  
  FOR rec IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%price%' OR table_name LIKE '%cambio%' OR table_name LIKE '%precos%'
    ORDER BY table_name
  LOOP
    RAISE NOTICE 'Table exists: %', rec.table_name;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== COMMODITY_PRICE_PROJECTIONS TABLE ===';
  
  -- Show structure of commodity_price_projections
  FOR rec IN 
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'commodity_price_projections' 
    AND table_schema = 'public'
    ORDER BY ordinal_position
  LOOP
    RAISE NOTICE 'Column: % (%, nullable: %)', rec.column_name, rec.data_type, rec.is_nullable;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== DATA IN COMMODITY_PRICE_PROJECTIONS ===';
  
  FOR rec IN 
    SELECT 
      id, commodity_type, cultura_id, sistema_id, ciclo_id,
      projection_id IS NULL as is_base_data,
      projection_id
    FROM commodity_price_projections 
    WHERE organizacao_id = v_org_id
    ORDER BY projection_id NULLS FIRST, commodity_type
    LIMIT 10
  LOOP
    RAISE NOTICE 'ID: %, Type: %, Culture: %, System: %, Cycle: %, Base: %, ProjectionID: %', 
      rec.id, rec.commodity_type, rec.cultura_id, rec.sistema_id, rec.ciclo_id, rec.is_base_data, rec.projection_id;
  END LOOP;
  
  -- Count base vs projection data
  RAISE NOTICE '';
  RAISE NOTICE '=== DATA COUNTS ===';
  
  DECLARE
    v_base_count integer;
    v_projection_count integer;
  BEGIN
    SELECT COUNT(*) INTO v_base_count
    FROM commodity_price_projections 
    WHERE organizacao_id = v_org_id 
    AND projection_id IS NULL;
    
    SELECT COUNT(*) INTO v_projection_count
    FROM commodity_price_projections 
    WHERE organizacao_id = v_org_id 
    AND projection_id IS NOT NULL;
    
    RAISE NOTICE 'Base data records: %', v_base_count;
    RAISE NOTICE 'Projection data records: %', v_projection_count;
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== COTACOES_CAMBIO TABLE ===';
  
  -- Check if cotacoes_cambio table exists and has data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cotacoes_cambio' AND table_schema = 'public') THEN
    DECLARE
      v_cambio_count integer;
    BEGIN
      SELECT COUNT(*) INTO v_cambio_count
      FROM cotacoes_cambio 
      WHERE organizacao_id = v_org_id;
      
      RAISE NOTICE 'Records in cotacoes_cambio: %', v_cambio_count;
    END;
  ELSE
    RAISE NOTICE 'Table cotacoes_cambio does not exist';
  END IF;
  
END $$;