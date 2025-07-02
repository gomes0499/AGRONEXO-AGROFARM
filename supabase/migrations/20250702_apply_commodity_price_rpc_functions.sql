-- Apply RPC functions for commodity prices with projection support
-- Check existing functions first
DO $$
BEGIN
    RAISE NOTICE 'Listing existing RPC functions related to projections:';
    
    FOR rec IN 
        SELECT proname as function_name
        FROM pg_proc 
        WHERE proname LIKE '%projection%' 
        ORDER BY proname
    LOOP
        RAISE NOTICE 'Found function: %', rec.function_name;
    END LOOP;
END $$;

-- Force create the functions (they might not have been applied)

-- Function to fetch commodity prices with projection support
CREATE OR REPLACE FUNCTION get_commodity_prices_with_projection(
  p_organizacao_id uuid,
  p_projection_id uuid DEFAULT NULL
) RETURNS SETOF jsonb AS $$
BEGIN
  RAISE NOTICE 'get_commodity_prices_with_projection called with org: %, projection: %', p_organizacao_id, p_projection_id;
  
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
  RAISE NOTICE 'get_exchange_rates_with_projection called with org: %, projection: %', p_organizacao_id, p_projection_id;
  
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

-- Verify the functions were created
DO $$
BEGIN
    RAISE NOTICE 'Checking if functions were created successfully:';
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_commodity_prices_with_projection') THEN
        RAISE NOTICE 'get_commodity_prices_with_projection: EXISTS';
    ELSE
        RAISE NOTICE 'get_commodity_prices_with_projection: NOT FOUND';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_exchange_rates_with_projection') THEN
        RAISE NOTICE 'get_exchange_rates_with_projection: EXISTS';
    ELSE
        RAISE NOTICE 'get_exchange_rates_with_projection: NOT FOUND';
    END IF;
END $$;