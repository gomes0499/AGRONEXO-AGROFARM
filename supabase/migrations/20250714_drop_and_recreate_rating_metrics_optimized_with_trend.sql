-- Drop and recreate calculate_rating_metrics_optimized to include TENDENCIA_PRODUTIVIDADE_5_ANOS

-- First, drop the existing function
DROP FUNCTION IF EXISTS calculate_rating_metrics_optimized(uuid, uuid);

-- Recreate with the new return column
CREATE OR REPLACE FUNCTION calculate_rating_metrics_optimized(
  p_organization_id UUID,
  p_safra_id UUID
)
RETURNS TABLE (
  liquidez_corrente DECIMAL,
  divida_ebitda DECIMAL,
  divida_faturamento DECIMAL,
  divida_patrimonio_liquido DECIMAL,
  ltv DECIMAL,
  margem_ebitda DECIMAL,
  area_propria DECIMAL,
  culturas_core DECIMAL,
  tendencia_produtividade_5_anos DECIMAL
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_current_assets DECIMAL := 0;
  v_current_liabilities DECIMAL := 0;
  v_total_debt DECIMAL := 0;
  v_land_debt DECIMAL := 0;
  v_total_assets DECIMAL := 0;
  v_land_value DECIMAL := 0;
  v_revenue DECIMAL := 0;
  v_ebitda DECIMAL := 0;
  v_equity DECIMAL := 0;
  v_area_total DECIMAL := 0;
  v_area_arrendada DECIMAL := 0;
  v_area_core_crops DECIMAL := 0;
  v_area_plantada_total DECIMAL := 0;
  v_ativo_biologico DECIMAL := 0;
  v_productivity_trend DECIMAL := 0;
  v_current_year INTEGER;
BEGIN
  -- Get current year from safra
  SELECT ano_fim INTO v_current_year FROM safras WHERE id = p_safra_id;

  -- Get current assets including ativo biológico
  SELECT COALESCE(SUM(
    CASE 
      WHEN jsonb_typeof(valores_por_safra) = 'object'
      THEN (valores_por_safra->>p_safra_id::text)::DECIMAL
      ELSE 0
    END
  ), 0)
  INTO v_current_assets
  FROM caixa_disponibilidades
  WHERE organizacao_id = p_organization_id
    AND categoria IN ('CAIXA_BANCOS', 'CLIENTES', 'ADIANTAMENTOS', 
                      'ESTOQUE_DEFENSIVOS', 'ESTOQUE_FERTILIZANTES', 
                      'ESTOQUE_COMMODITIES');

  -- Get ativo biológico
  SELECT COALESCE(SUM(
    CASE 
      WHEN jsonb_typeof(valores_por_safra) = 'object'
      THEN (valores_por_safra->>p_safra_id::text)::DECIMAL
      ELSE 0
    END
  ), 0)
  INTO v_ativo_biologico
  FROM caixa_disponibilidades
  WHERE organizacao_id = p_organization_id
    AND categoria = 'ATIVO_BIOLOGICO';

  -- Add ativo biológico to current assets
  v_current_assets := v_current_assets + v_ativo_biologico;

  -- Get current liabilities (current year debts)
  WITH current_debts AS (
    SELECT COALESCE(SUM(
      CASE 
        WHEN posicao_principal_por_safra ? p_safra_id::text 
        THEN (posicao_principal_por_safra->>p_safra_id::text)::DECIMAL
        ELSE 0
      END
    ), 0) as total
    FROM dividas_bancarias
    WHERE organizacao_id = p_organization_id
  )
  SELECT total INTO v_current_liabilities FROM current_debts;

  -- Get total debt
  v_total_debt := v_current_liabilities;

  -- Get land debt and total assets
  WITH asset_values AS (
    SELECT 
      COALESCE(SUM(
        CASE 
          WHEN tipo_bem = 'TERRA' AND posicao_principal_por_safra ? p_safra_id::text
          THEN (posicao_principal_por_safra->>p_safra_id::text)::DECIMAL
          ELSE 0
        END
      ), 0) as land_debt,
      COALESCE(SUM(
        CASE 
          WHEN tipo_bem = 'TERRA' 
          THEN valor_avaliacao
          ELSE 0
        END
      ), 0) as land_value,
      COALESCE(SUM(valor_avaliacao), 0) as total_assets
    FROM bens_direitos
    WHERE organizacao_id = p_organization_id
  )
  SELECT land_debt, land_value, total_assets 
  INTO v_land_debt, v_land_value, v_total_assets 
  FROM asset_values;

  -- Get revenue and EBITDA from projection_culture_data for the specific safra
  WITH safra_data AS (
    SELECT 
      s.nome as safra_nome
    FROM safras s
    WHERE s.id = p_safra_id
  ),
  financial_data AS (
    SELECT 
      COALESCE(SUM(pcd.revenue), 0) as revenue,
      COALESCE(SUM(pcd.revenue - pcd.total_cost), 0) as ebitda
    FROM projection_culture_data pcd
    CROSS JOIN safra_data sd
    WHERE pcd.organizacao_id = p_organization_id
      AND pcd.projection_id IS NULL
      AND pcd.safra = sd.safra_nome
  )
  SELECT revenue, ebitda INTO v_revenue, v_ebitda FROM financial_data;

  -- Calculate equity
  v_equity := v_total_assets - v_total_debt;

  -- Get total area and leased area
  SELECT 
    COALESCE(SUM(area_total), 0),
    COALESCE(SUM(CASE WHEN regime = 'ARRENDADA' THEN area_total ELSE 0 END), 0)
  INTO v_area_total, v_area_arrendada
  FROM propriedades
  WHERE organizacao_id = p_organization_id;

  -- Get core crops area and total planted area
  WITH safra_data AS (
    SELECT nome FROM safras WHERE id = p_safra_id
  ),
  culture_areas AS (
    SELECT 
      c.nome as cultura_nome,
      COALESCE(
        CASE 
          WHEN jsonb_typeof(ap.areas_por_safra) = 'object'
          THEN (ap.areas_por_safra->>p_safra_id::text)::DECIMAL
          ELSE 0
        END, 0
      ) as area_plantada
    FROM areas_plantio ap
    JOIN culturas c ON ap.cultura_id = c.id
    WHERE ap.organizacao_id = p_organization_id
  )
  SELECT 
    COALESCE(SUM(area_plantada), 0),
    COALESCE(SUM(
      CASE 
        WHEN LOWER(cultura_nome) IN ('soja', 'milho', 'algodão', 'algodao')
        THEN area_plantada 
        ELSE 0 
      END
    ), 0)
  INTO v_area_plantada_total, v_area_core_crops
  FROM culture_areas;

  -- Calculate 5-year productivity trend
  WITH historical_productivity AS (
    -- Get safras from the last 5 years
    SELECT 
      s.id as safra_id,
      s.ano_fim as year,
      AVG(
        CASE 
          WHEN p.produtividades_por_safra ? s.id::text
          THEN (p.produtividades_por_safra->>s.id::text)::DECIMAL
          ELSE NULL
        END
      ) as avg_productivity
    FROM safras s
    CROSS JOIN produtividades p
    WHERE s.organizacao_id = p_organization_id
      AND p.organizacao_id = p_organization_id
      AND s.ano_fim <= v_current_year
      AND s.ano_fim >= v_current_year - 5
    GROUP BY s.id, s.ano_fim
    HAVING AVG(
      CASE 
        WHEN p.produtividades_por_safra ? s.id::text
        THEN (p.produtividades_por_safra->>s.id::text)::DECIMAL
        ELSE NULL
      END
    ) IS NOT NULL
    ORDER BY s.ano_fim
  ),
  trend_calculation AS (
    SELECT 
      COUNT(*) as n,
      COALESCE(
        CASE 
          WHEN COUNT(*) >= 2 THEN
            -- Linear regression slope calculation
            (COUNT(*) * SUM((ROW_NUMBER() OVER (ORDER BY year) - 1) * avg_productivity) - 
             SUM(ROW_NUMBER() OVER (ORDER BY year) - 1) * SUM(avg_productivity)) /
            NULLIF(COUNT(*) * SUM(POWER(ROW_NUMBER() OVER (ORDER BY year) - 1, 2)) - 
                   POWER(SUM(ROW_NUMBER() OVER (ORDER BY year) - 1), 2), 0)
          ELSE 0
        END, 0
      ) as slope,
      AVG(avg_productivity) as avg_prod
    FROM historical_productivity
  )
  SELECT 
    CASE 
      WHEN n >= 2 AND avg_prod > 0 THEN 
        -- Calculate percentage change over the period
        (slope / avg_prod) * 100 * (n - 1)
      ELSE 0
    END
  INTO v_productivity_trend
  FROM trend_calculation;

  -- Return calculated metrics
  RETURN QUERY
  SELECT 
    -- Liquidez Corrente
    CASE 
      WHEN v_current_liabilities > 0 THEN v_current_assets / v_current_liabilities
      WHEN v_current_assets > 0 THEN 999.99
      ELSE 0
    END,
    -- Dívida/EBITDA
    CASE 
      WHEN v_ebitda > 0 THEN v_total_debt / v_ebitda
      WHEN v_total_debt > 0 THEN 999
      ELSE 0
    END,
    -- Dívida/Faturamento
    CASE 
      WHEN v_revenue > 0 THEN v_total_debt / v_revenue
      WHEN v_total_debt > 0 THEN 999
      ELSE 0
    END,
    -- Dívida/Patrimônio Líquido
    CASE 
      WHEN v_equity < 0 THEN 999
      WHEN v_equity > 0 THEN v_total_debt / v_equity
      WHEN v_total_debt > 0 THEN 999
      ELSE 0
    END,
    -- LTV
    CASE 
      WHEN v_land_value > 0 THEN (v_land_debt / v_land_value) * 100
      ELSE 0
    END,
    -- Margem EBITDA
    CASE 
      WHEN v_revenue > 0 THEN (v_ebitda / v_revenue) * 100
      ELSE 0
    END,
    -- Área Própria (% arrendada)
    CASE 
      WHEN v_area_total > 0 THEN (v_area_arrendada / v_area_total) * 100
      ELSE 0
    END,
    -- Culturas Core
    CASE 
      WHEN v_area_plantada_total > 0 THEN (v_area_core_crops / v_area_plantada_total) * 100
      ELSE 0
    END,
    -- Tendência de Produtividade 5 Anos
    v_productivity_trend;
END;
$$;