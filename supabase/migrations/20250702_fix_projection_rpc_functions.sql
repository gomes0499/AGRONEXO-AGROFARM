-- Fix RPC functions to match actual projection table structures

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_planting_areas_with_projection;
DROP FUNCTION IF EXISTS get_productivities_with_projection;
DROP FUNCTION IF EXISTS get_production_costs_with_projection;

-- Function to fetch production data with projection support
CREATE OR REPLACE FUNCTION get_planting_areas_with_projection(
  p_organizacao_id uuid,
  p_projection_id uuid DEFAULT NULL
) RETURNS SETOF jsonb AS $$
BEGIN
  IF p_projection_id IS NOT NULL THEN
    -- Return data from projection table
    -- Note: projection tables have fewer columns, so we need to handle joins differently
    RETURN QUERY
    SELECT to_jsonb(ap.*) || 
           jsonb_build_object(
             'propriedades', CASE 
               WHEN orig.propriedade_id IS NOT NULL THEN 
                 (SELECT jsonb_build_object('nome', nome) FROM propriedades WHERE id = orig.propriedade_id)
               ELSE NULL
             END,
             'culturas', jsonb_build_object('nome', c.nome),
             'sistemas', jsonb_build_object('nome', s.nome),
             'ciclos', CASE 
               WHEN orig.ciclo_id IS NOT NULL THEN 
                 (SELECT jsonb_build_object('nome', nome) FROM ciclos WHERE id = orig.ciclo_id)
               ELSE NULL
             END
           )
    FROM areas_plantio_projections ap
    LEFT JOIN areas_plantio orig ON ap.original_area_plantio_id = orig.id
    LEFT JOIN culturas c ON ap.cultura_id = c.id
    LEFT JOIN sistemas s ON ap.sistema_id = s.id
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
             'propriedades', CASE 
               WHEN orig.propriedade_id IS NOT NULL THEN 
                 (SELECT jsonb_build_object('nome', nome) FROM propriedades WHERE id = orig.propriedade_id)
               ELSE NULL
             END,
             'culturas', jsonb_build_object('nome', c.nome),
             'sistemas', jsonb_build_object('nome', s.nome),
             'ciclos', CASE 
               WHEN orig.ciclo_id IS NOT NULL THEN 
                 (SELECT jsonb_build_object('nome', nome) FROM ciclos WHERE id = orig.ciclo_id)
               ELSE NULL
             END
           )
    FROM produtividades_projections pp
    LEFT JOIN produtividades orig ON pp.original_produtividade_id = orig.id
    LEFT JOIN culturas c ON pp.cultura_id = c.id
    LEFT JOIN sistemas s ON pp.sistema_id = s.id
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
             'propriedades', CASE 
               WHEN orig.propriedade_id IS NOT NULL THEN 
                 (SELECT jsonb_build_object('nome', nome) FROM propriedades WHERE id = orig.propriedade_id)
               ELSE NULL
             END,
             'culturas', jsonb_build_object('nome', c.nome),
             'sistemas', jsonb_build_object('nome', s.nome),
             'ciclos', CASE 
               WHEN orig.ciclo_id IS NOT NULL THEN 
                 (SELECT jsonb_build_object('nome', nome) FROM ciclos WHERE id = orig.ciclo_id)
               ELSE NULL
             END
           )
    FROM custos_producao_projections cp
    LEFT JOIN custos_producao orig ON cp.original_custo_producao_id = orig.id
    LEFT JOIN culturas c ON cp.cultura_id = c.id
    LEFT JOIN sistemas s ON cp.sistema_id = s.id
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