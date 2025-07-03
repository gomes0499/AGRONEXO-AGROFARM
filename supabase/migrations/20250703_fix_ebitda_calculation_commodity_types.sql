-- Migration: Fix EBITDA Calculation with Correct Commodity Types
-- Date: 2025-07-03
-- Description: Update EBITDA calculation functions to use commodity_price_projections with correct commodity types

-- Drop the old function
DROP FUNCTION IF EXISTS calculate_ebitda_by_safra(uuid, uuid);

-- Create improved EBITDA calculation function that uses commodity_price_projections
CREATE OR REPLACE FUNCTION calculate_ebitda_by_safra(
  p_organization_id UUID,
  p_safra_id UUID
)
RETURNS DECIMAL
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_receita DECIMAL := 0;
  v_custos DECIMAL := 0;
  v_outras_despesas DECIMAL := 0;
BEGIN
  -- Calculate total revenue from production using commodity_price_projections
  WITH revenue_calc AS (
    SELECT SUM(
      CASE 
        WHEN jsonb_typeof(ap.areas_por_safra) = 'object' AND
             jsonb_typeof(p.produtividades_por_safra) = 'object' 
        THEN (ap.areas_por_safra->>p_safra_id::text)::DECIMAL * 
             (p.produtividades_por_safra->>p_safra_id::text)::DECIMAL * 
             COALESCE(
               CASE 
                 WHEN jsonb_typeof(cpp.valores_por_safra) = 'object' 
                 THEN (cpp.valores_por_safra->>p_safra_id::text)::DECIMAL
                 ELSE cpp.current_price
               END, 0
             )
        ELSE 0
      END
    ) as total_revenue
    FROM areas_plantio ap
    JOIN produtividades p ON p.cultura_id = ap.cultura_id 
      AND p.sistema_id = ap.sistema_id 
      AND p.organizacao_id = ap.organizacao_id
    JOIN culturas c ON c.id = ap.cultura_id
    JOIN sistemas s ON s.id = ap.sistema_id
    LEFT JOIN commodity_price_projections cpp ON 
      cpp.organizacao_id = ap.organizacao_id AND
      cpp.commodity_type = CASE
        WHEN UPPER(c.nome) LIKE '%SOJA%' THEN 
          CASE WHEN UPPER(s.nome) LIKE '%IRRIGAD%' THEN 'SOJA_IRRIGADO' ELSE 'SOJA_SEQUEIRO' END
        WHEN UPPER(c.nome) LIKE '%MILHO%' THEN 
          CASE WHEN UPPER(s.nome) LIKE '%IRRIGAD%' THEN 'MILHO_IRRIGADO' ELSE 'MILHO_SEQUEIRO' END
        WHEN UPPER(c.nome) LIKE '%ALGOD%' THEN 
          CASE WHEN UPPER(s.nome) LIKE '%IRRIGAD%' THEN 'ALGODAO_IRRIGADO' ELSE 'ALGODAO_SEQUEIRO' END
        ELSE NULL
      END
    WHERE ap.organizacao_id = p_organization_id
  )
  SELECT COALESCE(total_revenue, 0) INTO v_receita FROM revenue_calc;

  -- Calculate total production costs
  SELECT COALESCE(SUM(
    CASE 
      WHEN jsonb_typeof(custos_por_safra) = 'object' 
      THEN (custos_por_safra->>p_safra_id::text)::DECIMAL
      ELSE 0
    END
  ), 0)
  INTO v_custos
  FROM custos_producao
  WHERE organizacao_id = p_organization_id;

  -- Calculate other operational expenses
  SELECT COALESCE(SUM(
    CASE 
      WHEN jsonb_typeof(valores_por_safra) = 'object' 
      THEN (valores_por_safra->>p_safra_id::text)::DECIMAL
      ELSE 0
    END
  ), 0)
  INTO v_outras_despesas
  FROM outras_despesas
  WHERE organizacao_id = p_organization_id
    AND categoria IN ('ADMINISTRATIVAS', 'PESSOAL', 'MANUTENCAO', 'OUTROS');

  RETURN v_receita - v_custos - v_outras_despesas;
END;
$$;

-- Update production stats calculation to use commodity_price_projections
CREATE OR REPLACE FUNCTION calculate_production_stats(
  p_organization_id UUID,
  p_selected_year TEXT DEFAULT NULL
)
RETURNS TABLE (
  safra_id UUID,
  safra_nome TEXT,
  area_total DECIMAL,
  produtividade_media DECIMAL,
  receita_total DECIMAL,
  custo_total DECIMAL,
  ebitda DECIMAL,
  margem_ebitda DECIMAL,
  crescimento_area DECIMAL,
  crescimento_receita DECIMAL,
  crescimento_ebitda DECIMAL
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH safras_filtered AS (
    SELECT s.id, s.nome, s.ano_fim
    FROM safras s
    WHERE s.organizacao_id = p_organization_id
      AND (p_selected_year IS NULL OR s.nome LIKE p_selected_year || '%')
    ORDER BY s.ano_fim
  ),
  production_metrics AS (
    SELECT
      s.id as safra_id,
      -- Calculate area total from areas_plantio with areas_por_safra JSON
      COALESCE(SUM(
        CASE 
          WHEN jsonb_typeof(ap.areas_por_safra) = 'object' 
          THEN (ap.areas_por_safra->>s.id::text)::DECIMAL
          ELSE 0
        END
      ), 0) as area_total,
      -- Calculate weighted average productivity
      CASE 
        WHEN SUM(
          CASE 
            WHEN jsonb_typeof(ap.areas_por_safra) = 'object' 
            THEN (ap.areas_por_safra->>s.id::text)::DECIMAL
            ELSE 0
          END
        ) > 0 
        THEN SUM(
          (CASE 
            WHEN jsonb_typeof(ap.areas_por_safra) = 'object' 
            THEN (ap.areas_por_safra->>s.id::text)::DECIMAL
            ELSE 0
          END) * 
          COALESCE(
            CASE 
              WHEN jsonb_typeof(p.produtividades_por_safra) = 'object' 
              THEN (p.produtividades_por_safra->>s.id::text)::DECIMAL
              ELSE 0
            END, 0
          )
        ) / NULLIF(SUM(
          CASE 
            WHEN jsonb_typeof(ap.areas_por_safra) = 'object' 
            THEN (ap.areas_por_safra->>s.id::text)::DECIMAL
            ELSE 0
          END
        ), 0)
        ELSE 0
      END as produtividade_media,
      -- Total revenue calculation using commodity_price_projections
      SUM(
        (CASE 
          WHEN jsonb_typeof(ap.areas_por_safra) = 'object' 
          THEN (ap.areas_por_safra->>s.id::text)::DECIMAL
          ELSE 0
        END) * 
        COALESCE(
          CASE 
            WHEN jsonb_typeof(p.produtividades_por_safra) = 'object' 
            THEN (p.produtividades_por_safra->>s.id::text)::DECIMAL
            ELSE 0
          END, 0
        ) * 
        COALESCE(
          CASE 
            WHEN jsonb_typeof(cpp.valores_por_safra) = 'object' 
            THEN (cpp.valores_por_safra->>s.id::text)::DECIMAL
            ELSE cpp.current_price
          END, 0
        )
      ) as receita_total
    FROM safras_filtered s
    CROSS JOIN areas_plantio ap
    LEFT JOIN produtividades p ON p.cultura_id = ap.cultura_id 
      AND p.sistema_id = ap.sistema_id 
      AND p.organizacao_id = ap.organizacao_id
    LEFT JOIN culturas c ON c.id = ap.cultura_id
    LEFT JOIN sistemas si ON si.id = ap.sistema_id
    LEFT JOIN commodity_price_projections cpp ON 
      cpp.organizacao_id = ap.organizacao_id AND
      cpp.commodity_type = CASE
        WHEN UPPER(c.nome) LIKE '%SOJA%' THEN 
          CASE WHEN UPPER(si.nome) LIKE '%IRRIGAD%' THEN 'SOJA_IRRIGADO' ELSE 'SOJA_SEQUEIRO' END
        WHEN UPPER(c.nome) LIKE '%MILHO%' THEN 
          CASE WHEN UPPER(si.nome) LIKE '%IRRIGAD%' THEN 'MILHO_IRRIGADO' ELSE 'MILHO_SEQUEIRO' END
        WHEN UPPER(c.nome) LIKE '%ALGOD%' THEN 
          CASE WHEN UPPER(si.nome) LIKE '%IRRIGAD%' THEN 'ALGODAO_IRRIGADO' ELSE 'ALGODAO_SEQUEIRO' END
        ELSE NULL
      END
    WHERE ap.organizacao_id = p_organization_id
    GROUP BY s.id, s.nome, s.ano_fim
  ),
  cost_metrics AS (
    SELECT
      s.id as safra_id,
      COALESCE(SUM(
        CASE 
          WHEN jsonb_typeof(cp.custos_por_safra) = 'object'
          THEN (cp.custos_por_safra->>s.id::text)::DECIMAL
          ELSE 0
        END
      ), 0) as custo_total
    FROM safras_filtered s
    CROSS JOIN custos_producao cp
    WHERE cp.organizacao_id = p_organization_id
    GROUP BY s.id
  ),
  consolidated_metrics AS (
    SELECT
      s.id as safra_id,
      s.nome as safra_nome,
      COALESCE(pm.area_total, 0) as area_total,
      COALESCE(pm.produtividade_media, 0) as produtividade_media,
      COALESCE(pm.receita_total, 0) as receita_total,
      COALESCE(cm.custo_total, 0) as custo_total,
      COALESCE(pm.receita_total, 0) - COALESCE(cm.custo_total, 0) as ebitda,
      CASE 
        WHEN pm.receita_total > 0 
        THEN ((pm.receita_total - cm.custo_total) / pm.receita_total) * 100
        ELSE 0
      END as margem_ebitda,
      LAG(pm.area_total) OVER (ORDER BY s.ano_fim) as area_anterior,
      LAG(pm.receita_total) OVER (ORDER BY s.ano_fim) as receita_anterior,
      LAG(pm.receita_total - cm.custo_total) OVER (ORDER BY s.ano_fim) as ebitda_anterior
    FROM safras_filtered s
    LEFT JOIN production_metrics pm ON pm.safra_id = s.id
    LEFT JOIN cost_metrics cm ON cm.safra_id = s.id
  )
  SELECT
    safra_id,
    safra_nome,
    area_total,
    produtividade_media,
    receita_total,
    custo_total,
    ebitda,
    margem_ebitda,
    calculate_yoy_growth(area_total, area_anterior) as crescimento_area,
    calculate_yoy_growth(receita_total, receita_anterior) as crescimento_receita,
    calculate_yoy_growth(ebitda, ebitda_anterior) as crescimento_ebitda
  FROM consolidated_metrics
  ORDER BY safra_nome;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_ebitda_by_safra TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_production_stats TO authenticated;