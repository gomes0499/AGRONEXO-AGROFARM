-- Add CULTURAS_CORE metric to track percentage of core crops (soja, milho, algodão)
-- This calculates the percentage of planted area with core crops

-- 1. Insert the new metric
INSERT INTO rating_metrics (codigo, nome, descricao, tipo, categoria, unidade, is_predefined, is_active, formula)
VALUES (
  'CULTURAS_CORE',
  'Atua em culturas core (soja, milho, algodão)?',
  'Percentual da área plantada com culturas core (soja, milho, algodão)',
  'QUANTITATIVE',
  'PRODUTIVIDADE',
  '%',
  true,
  true,
  'area_culturas_core / area_total * 100'
)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  categoria = EXCLUDED.categoria,
  unidade = EXCLUDED.unidade,
  formula = EXCLUDED.formula;

-- 2. Insert thresholds for CULTURAS_CORE metric
-- Based on requirements:
-- Excelente (5): 100% of area
-- Bom (4): 80% of area
-- Regular (3): 60% of area
-- Fraco (2): 40% of area
-- Crítico (1): 20% of area

DO $$
DECLARE
  v_culturas_core_id UUID;
BEGIN
  -- Get metric ID
  SELECT id INTO v_culturas_core_id FROM rating_metrics WHERE codigo = 'CULTURAS_CORE';

  -- Delete existing thresholds
  DELETE FROM rating_metric_thresholds WHERE rating_metric_id = v_culturas_core_id;

  -- Insert new thresholds
  IF v_culturas_core_id IS NOT NULL THEN
    INSERT INTO rating_metric_thresholds (rating_metric_id, classificacao, valor_min, valor_max, pontuacao) VALUES
    (v_culturas_core_id, 'EXCELENTE', 100, NULL, 100),     -- 100%
    (v_culturas_core_id, 'BOM', 80, 100, 80),              -- 80-100%
    (v_culturas_core_id, 'ADEQUADO', 60, 80, 60),          -- 60-80%
    (v_culturas_core_id, 'ATENCAO', 40, 60, 40),           -- 40-60%
    (v_culturas_core_id, 'CRITICO', NULL, 40, 20);         -- < 40%
  END IF;
END $$;

-- 3. Add CULTURAS_CORE to the predefined metrics weight
-- Weight is 4% according to requirements
UPDATE rating_model_metrics
SET peso = 4
WHERE rating_metric_id = (SELECT id FROM rating_metrics WHERE codigo = 'CULTURAS_CORE')
  AND rating_model_id IN (
    SELECT id FROM rating_models WHERE nome IN ('SR/Prime Rating Model', 'Modelo SR/Prime')
  );

-- 4. Update the optimized rating metrics function to include CULTURAS_CORE calculation
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
  culturas_core DECIMAL
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
BEGIN
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
    AND categoria IN ('ATIVO_BIOLOGICO', 'ATIVO_BIOLOGICO_LAVOURAS');

  -- Add ativo biológico to current assets
  v_current_assets := v_current_assets + v_ativo_biologico;

  -- Get current liabilities (current year debts)
  WITH current_debts AS (
    SELECT COALESCE(SUM(
      CASE 
        WHEN jsonb_typeof(fluxo_pagamento_anual) = 'object'
        THEN (fluxo_pagamento_anual->>p_safra_id::text)::DECIMAL
        ELSE 0
      END
    ), 0) as total
    FROM dividas_bancarias
    WHERE organizacao_id = p_organization_id
    
    UNION ALL
    
    SELECT COALESCE(SUM(
      CASE 
        WHEN jsonb_typeof(valores_por_ano) = 'object'
        THEN (valores_por_ano->>p_safra_id::text)::DECIMAL
        ELSE 0
      END
    ), 0) as total
    FROM dividas_fornecedores
    WHERE organizacao_id = p_organization_id
  )
  SELECT SUM(total) INTO v_current_liabilities FROM current_debts;

  -- Get total outstanding debt (using valor_principal for bank debts)
  WITH bank_debts AS (
    SELECT COALESCE(SUM(valor_principal), 0) as total
    FROM dividas_bancarias
    WHERE organizacao_id = p_organization_id
  ),
  supplier_debts AS (
    SELECT COALESCE(SUM((valores_por_ano->>(
      SELECT id::text FROM safras 
      WHERE organizacao_id = p_organization_id 
      ORDER BY ano_fim DESC 
      LIMIT 1
    ))::DECIMAL), 0) as total
    FROM dividas_fornecedores
    WHERE organizacao_id = p_organization_id
  ),
  land_debts AS (
    SELECT COALESCE(SUM(valor_total), 0) as total
    FROM dividas_imoveis
    WHERE organizacao_id = p_organization_id
  )
  SELECT 
    bank_debts.total + supplier_debts.total + land_debts.total
  INTO v_total_debt
  FROM bank_debts, supplier_debts, land_debts;

  -- Get land debt for LTV (current year only)
  SELECT COALESCE(SUM(
    CASE 
      WHEN jsonb_typeof(di.fluxo_pagamento_anual) = 'object'
      THEN (di.fluxo_pagamento_anual->>p_safra_id::text)::DECIMAL
      ELSE 0
    END
  ), 0)
  INTO v_land_debt
  FROM dividas_imoveis di
  WHERE di.organizacao_id = p_organization_id;

  -- Get land value (property values)
  SELECT COALESCE(SUM(p.valor_atual), 0)
  INTO v_land_value
  FROM propriedades p
  WHERE p.organizacao_id = p_organization_id;

  -- Get total assets (land + equipment + current assets)
  SELECT 
    v_land_value + 
    COALESCE((SELECT SUM(valor_aquisicao) FROM maquinas_equipamentos WHERE organizacao_id = p_organization_id), 0) +
    v_current_assets
  INTO v_total_assets;

  -- Calculate revenue and EBITDA using existing function
  v_ebitda := calculate_ebitda_by_safra(p_organization_id, p_safra_id);
  
  -- Get revenue from areas_plantio using JSONB structure
  WITH revenue_calc AS (
    SELECT COALESCE(SUM(
      CASE 
        WHEN jsonb_typeof(ap.areas_por_safra) = 'object' AND ap.areas_por_safra ? p_safra_id::text
        THEN (ap.areas_por_safra->>p_safra_id::text)::DECIMAL *
             CASE 
               WHEN jsonb_typeof(prod.produtividades_por_safra) = 'object' AND prod.produtividades_por_safra ? p_safra_id::text
               THEN 
                 CASE
                   WHEN jsonb_typeof(prod.produtividades_por_safra->p_safra_id::text) = 'number'
                   THEN (prod.produtividades_por_safra->>p_safra_id::text)::DECIMAL
                   WHEN jsonb_typeof(prod.produtividades_por_safra->p_safra_id::text) = 'object'
                   THEN ((prod.produtividades_por_safra->p_safra_id::text)->>'produtividade')::DECIMAL
                   ELSE 0
                 END
               ELSE 0
             END *
             COALESCE(
               (SELECT (cp.precos_por_ano->>p_safra_id::text)::DECIMAL
                FROM commodity_price_projections cp
                WHERE cp.organizacao_id = p_organization_id
                  AND cp.projection_id IS NULL
                  AND cp.commodity_type = 
                    CASE 
                      WHEN c.nome ILIKE '%soja%' THEN 
                        CASE WHEN s.nome ILIKE '%irrigado%' THEN 'SOJA_IRRIGADO' ELSE 'SOJA_SEQUEIRO' END
                      WHEN c.nome ILIKE '%milho%' THEN 
                        CASE WHEN s.nome ILIKE '%irrigado%' THEN 'MILHO_IRRIGADO' ELSE 'MILHO_SEQUEIRO' END
                      WHEN c.nome ILIKE '%algod%' THEN 
                        CASE WHEN s.nome ILIKE '%irrigado%' THEN 'ALGODAO_IRRIGADO' ELSE 'ALGODAO_SEQUEIRO' END
                      ELSE NULL
                    END
                LIMIT 1), 0)
        ELSE 0
      END
    ), 0) as total_revenue
    FROM areas_plantio ap
    JOIN culturas c ON c.id = ap.cultura_id
    JOIN sistemas s ON s.id = ap.sistema_id
    LEFT JOIN produtividades prod ON 
      prod.cultura_id = ap.cultura_id 
      AND prod.sistema_id = ap.sistema_id 
      AND prod.organizacao_id = ap.organizacao_id
    WHERE ap.organizacao_id = p_organization_id
  )
  SELECT total_revenue INTO v_revenue FROM revenue_calc;

  -- Calculate equity
  v_equity := v_total_assets - v_total_debt;

  -- Calculate area statistics for AREA_PROPRIA metric
  -- Get total area
  SELECT COALESCE(SUM(area_total), 0)
  INTO v_area_total
  FROM propriedades
  WHERE organizacao_id = p_organization_id;

  -- Get leased area (ARRENDADO)
  SELECT COALESCE(SUM(area_total), 0)
  INTO v_area_arrendada
  FROM propriedades
  WHERE organizacao_id = p_organization_id
    AND tipo = 'ARRENDADO';

  -- Calculate CULTURAS_CORE metric
  -- Get total planted area and area with core crops (soja, milho, algodão)
  WITH area_by_crop AS (
    SELECT 
      c.nome as cultura_nome,
      CASE 
        WHEN jsonb_typeof(ap.areas_por_safra) = 'object' AND ap.areas_por_safra ? p_safra_id::text
        THEN (ap.areas_por_safra->>p_safra_id::text)::DECIMAL
        ELSE 0
      END as area
    FROM areas_plantio ap
    JOIN culturas c ON c.id = ap.cultura_id
    WHERE ap.organizacao_id = p_organization_id
  )
  SELECT 
    COALESCE(SUM(area), 0) as total_area,
    COALESCE(SUM(
      CASE 
        WHEN cultura_nome ILIKE '%soja%' OR 
             cultura_nome ILIKE '%milho%' OR 
             cultura_nome ILIKE '%algod%'
        THEN area
        ELSE 0
      END
    ), 0) as core_area
  INTO v_area_plantada_total, v_area_core_crops
  FROM area_by_crop;

  -- Return calculated metrics
  RETURN QUERY
  SELECT
    CASE 
      WHEN v_current_liabilities > 0 THEN v_current_assets / v_current_liabilities 
      WHEN v_current_assets > 0 THEN 999.99
      ELSE 0
    END as liquidez_corrente,
    CASE 
      WHEN v_ebitda > 0 THEN v_total_debt / v_ebitda 
      ELSE CASE WHEN v_total_debt > 0 THEN 999 ELSE 0 END
    END as divida_ebitda,
    CASE 
      WHEN v_revenue > 0 THEN v_total_debt / v_revenue 
      ELSE CASE WHEN v_total_debt > 0 THEN 999 ELSE 0 END
    END as divida_faturamento,
    CASE 
      WHEN v_equity < 0 THEN 999
      WHEN v_equity > 0 THEN v_total_debt / v_equity 
      ELSE CASE WHEN v_total_debt > 0 THEN 999 ELSE 0 END
    END as divida_patrimonio_liquido,
    -- LTV = Land Debt / Land Value (in percentage)
    CASE 
      WHEN v_land_value > 0 THEN (v_land_debt / v_land_value) * 100
      ELSE 0
    END as ltv,
    -- MARGEM_EBITDA = (EBITDA / Revenue) * 100 (in percentage)
    CASE 
      WHEN v_revenue > 0 THEN (v_ebitda / v_revenue) * 100 
      ELSE 0
    END as margem_ebitda,
    -- AREA_PROPRIA = (Leased Area / Total Area) * 100 (in percentage)
    CASE 
      WHEN v_area_total > 0 THEN (v_area_arrendada / v_area_total) * 100
      ELSE 0
    END as area_propria,
    -- CULTURAS_CORE = (Core Crops Area / Total Planted Area) * 100 (in percentage)
    CASE 
      WHEN v_area_plantada_total > 0 THEN (v_area_core_crops / v_area_plantada_total) * 100
      ELSE 0
    END as culturas_core;
END;
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION calculate_rating_metrics_optimized TO authenticated;