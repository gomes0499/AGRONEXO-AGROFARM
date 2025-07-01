-- Migration: Create Financial Calculation Functions
-- Date: 2025-06-29
-- Description: Optimize complex calculations by moving them to SQL functions

-- =====================================================
-- 1. HELPER FUNCTIONS
-- =====================================================

-- Calculate Year-over-Year Growth
CREATE OR REPLACE FUNCTION calculate_yoy_growth(
  p_current DECIMAL,
  p_previous DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_previous IS NULL OR p_previous = 0 THEN
    RETURN 0;
  END IF;
  RETURN ROUND(((p_current - p_previous) / p_previous) * 100, 2);
END;
$$;

-- =====================================================
-- 2. EBITDA CALCULATION (Used everywhere)
-- =====================================================

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
  -- Calculate total revenue from production
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
  INTO v_receita
  FROM areas_plantio ap
  JOIN produtividades p ON p.cultura_id = ap.cultura_id 
    AND p.sistema_id = ap.sistema_id 
    AND p.safra_id = ap.safra_id
  JOIN culturas c ON c.id = ap.cultura_id
  LEFT JOIN precos pr ON pr.safra_id = ap.safra_id
  WHERE ap.organizacao_id = p_organization_id
    AND ap.safra_id = p_safra_id;

  -- Calculate total production costs
  SELECT COALESCE(SUM(valor), 0)
  INTO v_custos
  FROM custos_producao
  WHERE organizacao_id = p_organization_id
    AND safra_id = p_safra_id;

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

-- =====================================================
-- 3. PRODUCTION STATISTICS
-- =====================================================

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
      -- Calculate weighted average productivity using produtividades_por_safra JSON
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
      -- Total revenue calculation
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
        CASE 
          WHEN c.nome = 'SOJA' THEN COALESCE(pr.preco_soja_brl, 0)
          WHEN c.nome = 'MILHO' THEN COALESCE(pr.preco_milho, 0)
          WHEN c.nome = 'ALGODÃO' THEN COALESCE(pr.preco_algodao_bruto, 0)
          ELSE 0
        END
      ) as receita_total
    FROM safras_filtered s
    CROSS JOIN areas_plantio ap
    LEFT JOIN produtividades p ON p.cultura_id = ap.cultura_id 
      AND p.sistema_id = ap.sistema_id 
      AND p.organizacao_id = ap.organizacao_id
    LEFT JOIN culturas c ON c.id = ap.cultura_id
    LEFT JOIN precos pr ON pr.safra_id = s.id
      AND pr.organizacao_id = ap.organizacao_id
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

-- =====================================================
-- 4. DEBT POSITION CONSOLIDATION
-- =====================================================

CREATE OR REPLACE FUNCTION get_consolidated_debt_position(
  p_organization_id UUID,
  p_projection_id UUID DEFAULT NULL
)
RETURNS TABLE (
  safra_id UUID,
  safra_nome TEXT,
  divida_bancos DECIMAL,
  divida_fornecedores DECIMAL,
  divida_terras DECIMAL,
  divida_total DECIMAL,
  caixa_disponivel DECIMAL,
  divida_liquida DECIMAL,
  receita DECIMAL,
  ebitda DECIMAL,
  divida_receita DECIMAL,
  divida_ebitda DECIMAL
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH safras_org AS (
    SELECT id, nome
    FROM safras
    WHERE organizacao_id = p_organization_id
    ORDER BY nome
  ),
  -- Bank debts aggregation
  bank_debts AS (
    SELECT 
      s.id as safra_id,
      COALESCE(SUM(
        CASE 
          WHEN jsonb_typeof(db.fluxo_pagamento_anual) = 'object'
          THEN (db.fluxo_pagamento_anual->>s.id::text)::DECIMAL
          ELSE 0
        END
      ), 0) as total
    FROM safras_org s
    CROSS JOIN dividas_bancarias db
    WHERE db.organizacao_id = p_organization_id
    GROUP BY s.id
  ),
  -- Supplier debts aggregation
  supplier_debts AS (
    SELECT 
      s.id as safra_id,
      COALESCE(SUM(
        CASE 
          WHEN jsonb_typeof(df.valores_por_ano) = 'object'
          THEN (df.valores_por_ano->>s.id::text)::DECIMAL
          ELSE 0
        END
      ), 0) as total
    FROM safras_org s
    CROSS JOIN dividas_fornecedores df
    WHERE df.organizacao_id = p_organization_id
    GROUP BY s.id
  ),
  -- Land debts aggregation
  land_debts AS (
    SELECT 
      s.id as safra_id,
      COALESCE(SUM(
        CASE 
          WHEN jsonb_typeof(di.fluxo_pagamento_anual) = 'object'
          THEN (di.fluxo_pagamento_anual->>s.id::text)::DECIMAL
          ELSE 0
        END
      ), 0) as total
    FROM safras_org s
    CROSS JOIN dividas_imoveis di
    WHERE di.organizacao_id = p_organization_id
    GROUP BY s.id
  ),
  -- Cash and liquid assets
  cash_available AS (
    SELECT 
      s.id as safra_id,
      COALESCE(SUM(
        CASE 
          WHEN jsonb_typeof(cd.valores_por_safra) = 'object'
          THEN (cd.valores_por_safra->>s.id::text)::DECIMAL
          ELSE 0
        END
      ), 0) as total
    FROM safras_org s
    CROSS JOIN caixa_disponibilidades cd
    WHERE cd.organizacao_id = p_organization_id
      AND cd.categoria IN ('CAIXA_BANCOS', 'CLIENTES', 'ADIANTAMENTOS')
    GROUP BY s.id
  ),
  -- Production metrics for indicators
  production_stats AS (
    SELECT * FROM calculate_production_stats(p_organization_id)
  )
  SELECT
    s.id as safra_id,
    s.nome as safra_nome,
    COALESCE(bd.total, 0) as divida_bancos,
    COALESCE(sd.total, 0) as divida_fornecedores,
    COALESCE(ld.total, 0) as divida_terras,
    COALESCE(bd.total, 0) + COALESCE(sd.total, 0) + COALESCE(ld.total, 0) as divida_total,
    COALESCE(ca.total, 0) as caixa_disponivel,
    GREATEST(0, COALESCE(bd.total, 0) + COALESCE(sd.total, 0) + COALESCE(ld.total, 0) - COALESCE(ca.total, 0)) as divida_liquida,
    COALESCE(ps.receita_total, 0) as receita,
    COALESCE(ps.ebitda, 0) as ebitda,
    CASE 
      WHEN ps.receita_total > 0 
      THEN (COALESCE(bd.total, 0) + COALESCE(sd.total, 0) + COALESCE(ld.total, 0)) / ps.receita_total
      ELSE CASE WHEN (COALESCE(bd.total, 0) + COALESCE(sd.total, 0) + COALESCE(ld.total, 0)) > 0 THEN 999 ELSE 0 END
    END as divida_receita,
    CASE 
      WHEN ps.ebitda > 0 
      THEN (COALESCE(bd.total, 0) + COALESCE(sd.total, 0) + COALESCE(ld.total, 0)) / ps.ebitda
      ELSE CASE WHEN (COALESCE(bd.total, 0) + COALESCE(sd.total, 0) + COALESCE(ld.total, 0)) > 0 THEN 999 ELSE 0 END
    END as divida_ebitda
  FROM safras_org s
  LEFT JOIN bank_debts bd ON bd.safra_id = s.id
  LEFT JOIN supplier_debts sd ON sd.safra_id = s.id
  LEFT JOIN land_debts ld ON ld.safra_id = s.id
  LEFT JOIN cash_available ca ON ca.safra_id = s.id
  LEFT JOIN production_stats ps ON ps.safra_id = s.id
  ORDER BY s.nome;
END;
$$;

-- =====================================================
-- 5. RATING METRICS CALCULATION
-- =====================================================

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
  margem_ebitda DECIMAL
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

  -- Get land debt specifically for LTV
  WITH future_safras AS (
    SELECT id 
    FROM safras 
    WHERE organizacao_id = p_organization_id
      AND ano_fim >= (SELECT ano_fim FROM safras WHERE id = p_safra_id)
  )
  SELECT COALESCE(SUM(
    CASE 
      WHEN jsonb_typeof(di.fluxo_pagamento_anual) = 'object'
      THEN (
        SELECT SUM((value::text)::DECIMAL)
        FROM jsonb_each(di.fluxo_pagamento_anual) 
        WHERE key::uuid IN (SELECT id FROM future_safras)
      )
      ELSE 0
    END
  ), 0)
  INTO v_land_debt
  FROM dividas_imoveis di
  WHERE di.organizacao_id = p_organization_id;

  -- Get total assets
  SELECT 
    COALESCE(SUM(p.valor_atual), 0) as land_value,
    COALESCE(SUM(p.valor_atual), 0) + 
    COALESCE((SELECT SUM(valor_aquisicao) FROM maquinas_equipamentos WHERE organizacao_id = p_organization_id), 0) +
    v_current_assets as total_assets
  INTO v_land_value, v_total_assets
  FROM propriedades p
  WHERE p.organizacao_id = p_organization_id;

  -- Calculate revenue and EBITDA
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
    CASE 
      WHEN v_land_value > 0 THEN LEAST(v_land_debt / v_land_value, 1) 
      ELSE 0
    END as ltv,
    CASE 
      WHEN v_revenue > 0 THEN (v_ebitda / v_revenue) * 100 
      ELSE 0
    END as margem_ebitda;
END;
$$;

-- =====================================================
-- 6. CASH FLOW PROJECTION
-- =====================================================

CREATE OR REPLACE FUNCTION generate_cash_flow_projection(
  p_organization_id UUID,
  p_projection_id UUID DEFAULT NULL
)
RETURNS TABLE (
  safra_id UUID,
  safra_nome TEXT,
  receitas_agricolas DECIMAL,
  despesas_agricolas DECIMAL,
  outras_receitas DECIMAL,
  outras_despesas DECIMAL,
  fluxo_operacional DECIMAL,
  investimentos DECIMAL,
  servico_divida DECIMAL,
  fluxo_livre DECIMAL,
  fluxo_liquido DECIMAL,
  fluxo_acumulado DECIMAL
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_fluxo_acumulado DECIMAL := 0;
BEGIN
  RETURN QUERY
  WITH safras_org AS (
    SELECT id, nome
    FROM safras
    WHERE organizacao_id = p_organization_id
    ORDER BY nome
  ),
  -- Agricultural revenues and expenses from production
  production_data AS (
    SELECT 
      ps.safra_id,
      ps.receita_total as receitas_agricolas,
      ps.custo_total as despesas_agricolas
    FROM calculate_production_stats(p_organization_id) ps
  ),
  -- Other operational expenses
  other_expenses AS (
    SELECT 
      s.id as safra_id,
      COALESCE(SUM(
        CASE 
          WHEN jsonb_typeof(od.valores_por_safra) = 'object'
          THEN (od.valores_por_safra->>s.id::text)::DECIMAL
          ELSE 0
        END
      ), 0) as total
    FROM safras_org s
    CROSS JOIN outras_despesas od
    WHERE od.organizacao_id = p_organization_id
    GROUP BY s.id
  ),
  -- Investments
  investments AS (
    SELECT 
      safra_id,
      SUM(valor_total) as total
    FROM investimentos
    WHERE organizacao_id = p_organization_id
    GROUP BY safra_id
  ),
  -- Debt service
  debt_service AS (
    SELECT 
      safra_id,
      divida_bancos + divida_fornecedores + divida_terras as total
    FROM get_consolidated_debt_position(p_organization_id, p_projection_id)
  ),
  -- Consolidated cash flow
  cash_flow_data AS (
    SELECT
      s.id as safra_id,
      s.nome as safra_nome,
      COALESCE(pd.receitas_agricolas, 0) as receitas_agricolas,
      COALESCE(pd.despesas_agricolas, 0) as despesas_agricolas,
      0 as outras_receitas, -- TODO: Add other revenue sources
      COALESCE(oe.total, 0) as outras_despesas,
      COALESCE(pd.receitas_agricolas, 0) - COALESCE(pd.despesas_agricolas, 0) - COALESCE(oe.total, 0) as fluxo_operacional,
      COALESCE(inv.total, 0) as investimentos,
      COALESCE(ds.total, 0) as servico_divida
    FROM safras_org s
    LEFT JOIN production_data pd ON pd.safra_id = s.id
    LEFT JOIN other_expenses oe ON oe.safra_id = s.id
    LEFT JOIN investments inv ON inv.safra_id = s.id
    LEFT JOIN debt_service ds ON ds.safra_id = s.id
  )
  SELECT
    cf.safra_id,
    cf.safra_nome,
    cf.receitas_agricolas,
    cf.despesas_agricolas,
    cf.outras_receitas,
    cf.outras_despesas,
    cf.fluxo_operacional,
    cf.investimentos,
    cf.servico_divida,
    cf.fluxo_operacional - cf.investimentos as fluxo_livre,
    cf.fluxo_operacional - cf.investimentos - cf.servico_divida as fluxo_liquido,
    SUM(cf.fluxo_operacional - cf.investimentos - cf.servico_divida) 
      OVER (ORDER BY cf.safra_nome ROWS UNBOUNDED PRECEDING) as fluxo_acumulado
  FROM cash_flow_data cf
  ORDER BY cf.safra_nome;
END;
$$;

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for JSON fields used in calculations
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_fluxo ON dividas_bancarias USING gin(fluxo_pagamento_anual);
CREATE INDEX IF NOT EXISTS idx_dividas_fornecedores_valores ON dividas_fornecedores USING gin(valores_por_ano);
CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_fluxo ON dividas_imoveis USING gin(fluxo_pagamento_anual);
CREATE INDEX IF NOT EXISTS idx_caixa_disponibilidades_valores ON caixa_disponibilidades USING gin(valores_por_safra);
CREATE INDEX IF NOT EXISTS idx_outras_despesas_valores ON outras_despesas USING gin(valores_por_safra);

-- Index for common joins
CREATE INDEX IF NOT EXISTS idx_areas_plantio_safra ON areas_plantio(safra_id, organizacao_id);
CREATE INDEX IF NOT EXISTS idx_produtividades_safra ON produtividades(safra_id, cultura_id, sistema_id);
CREATE INDEX IF NOT EXISTS idx_custos_producao_safra ON custos_producao(safra_id, organizacao_id);
CREATE INDEX IF NOT EXISTS idx_precos_safra ON precos(safra_id, organizacao_id);

-- =====================================================
-- 8. GRANTS (Adjust based on your security model)
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION calculate_yoy_growth TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_ebitda_by_safra TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_production_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_consolidated_debt_position TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_rating_metrics_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION generate_cash_flow_projection TO authenticated;