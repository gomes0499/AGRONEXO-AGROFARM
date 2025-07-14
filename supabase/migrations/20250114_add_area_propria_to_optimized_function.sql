-- Add AREA_PROPRIA calculation to the optimized rating metrics function
-- This calculates the percentage of leased area vs total area

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
  area_propria DECIMAL
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
BEGIN
  -- Get current assets
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

  -- Get total outstanding debt (from current year onwards)
  WITH future_safras AS (
    SELECT id 
    FROM safras 
    WHERE organizacao_id = p_organization_id
      AND ano_fim >= (SELECT ano_fim FROM safras WHERE id = p_safra_id)
  ),
  all_debts AS (
    -- Bank debts
    SELECT SUM(
      CASE 
        WHEN jsonb_typeof(db.fluxo_pagamento_anual) = 'object'
        THEN (
          SELECT SUM((value::text)::DECIMAL)
          FROM jsonb_each(db.fluxo_pagamento_anual) 
          WHERE key::uuid IN (SELECT id FROM future_safras)
        )
        ELSE 0
      END
    ) as total
    FROM dividas_bancarias db
    WHERE db.organizacao_id = p_organization_id
    
    UNION ALL
    
    -- Supplier debts
    SELECT SUM(
      CASE 
        WHEN jsonb_typeof(df.valores_por_ano) = 'object'
        THEN (
          SELECT SUM((value::text)::DECIMAL)
          FROM jsonb_each(df.valores_por_ano) 
          WHERE key::uuid IN (SELECT id FROM future_safras)
        )
        ELSE 0
      END
    ) as total
    FROM dividas_fornecedores df
    WHERE df.organizacao_id = p_organization_id
    
    UNION ALL
    
    -- Land debts
    SELECT SUM(
      CASE 
        WHEN jsonb_typeof(di.fluxo_pagamento_anual) = 'object'
        THEN (
          SELECT SUM((value::text)::DECIMAL)
          FROM jsonb_each(di.fluxo_pagamento_anual) 
          WHERE key::uuid IN (SELECT id FROM future_safras)
        )
        ELSE 0
      END
    ) as total
    FROM dividas_imoveis di
    WHERE di.organizacao_id = p_organization_id
  )
  SELECT COALESCE(SUM(total), 0) INTO v_total_debt FROM all_debts;

  -- Get land debt specifically for LTV (CORRECTED: only current year land debt)
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
  
  -- Get revenue from production
  SELECT COALESCE(SUM(
    ap.area * 
    p.produtividade * 
    CASE 
      WHEN c.nome = 'SOJA' THEN COALESCE(pr.preco_soja_brl, 0)
      WHEN c.nome = 'MILHO' THEN COALESCE(pr.preco_milho, 0)
      WHEN c.nome = 'ALGODÃO' THEN COALESCE(pr.preco_algodao_bruto, 0)
      ELSE 0
    END
  ), 0)
  INTO v_revenue
  FROM areas_plantio ap
  JOIN produtividades p ON p.cultura_id = ap.cultura_id 
    AND p.sistema_id = ap.sistema_id 
    AND p.safra_id = ap.safra_id
  JOIN culturas c ON c.id = ap.cultura_id
  LEFT JOIN precos pr ON pr.safra_id = ap.safra_id
  WHERE ap.organizacao_id = p_organization_id
    AND ap.safra_id = p_safra_id;

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

  -- Return calculated metrics
  RETURN QUERY
  SELECT
    CASE WHEN v_current_liabilities > 0 THEN v_current_assets / v_current_liabilities ELSE 9999 END as liquidez_corrente,
    CASE 
      WHEN v_ebitda > 0 THEN v_total_debt / v_ebitda 
      ELSE CASE WHEN v_total_debt > 0 THEN 999 ELSE 0 END
    END as divida_ebitda,
    CASE 
      WHEN v_revenue > 0 THEN v_total_debt / v_revenue 
      ELSE CASE WHEN v_total_debt > 0 THEN 999 ELSE 0 END
    END as divida_faturamento,
    CASE 
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
    END as area_propria;
END;
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION calculate_rating_metrics_optimized TO authenticated;