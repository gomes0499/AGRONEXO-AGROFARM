-- Update calculate_rating_metrics_optimized to include ATIVO_BIOLOGICO in current assets calculation
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
  v_ativo_biologico DECIMAL := 0;
  v_current_liabilities DECIMAL := 0;
  v_total_debt DECIMAL := 0;
  v_land_debt DECIMAL := 0;
  v_total_assets DECIMAL := 0;
  v_land_value DECIMAL := 0;
  v_revenue DECIMAL := 0;
  v_ebitda DECIMAL := 0;
  v_equity DECIMAL := 0;
BEGIN
  -- Get current assets (including ATIVO_BIOLOGICO now)
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
                      'ESTOQUE_COMMODITIES', 'ATIVO_BIOLOGICO');  -- Added ATIVO_BIOLOGICO

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
    FROM dividas_imobiliarias di
    WHERE di.organizacao_id = p_organization_id
  )
  SELECT SUM(total) INTO v_total_debt FROM all_debts;

  -- Get land-specific debt
  WITH future_safras AS (
    SELECT id 
    FROM safras 
    WHERE organizacao_id = p_organization_id
      AND ano_fim >= (SELECT ano_fim FROM safras WHERE id = p_safra_id)
  )
  SELECT COALESCE(SUM(
    CASE 
      WHEN jsonb_typeof(fluxo_pagamento_anual) = 'object'
      THEN (
        SELECT SUM((value::text)::DECIMAL)
        FROM jsonb_each(fluxo_pagamento_anual) 
        WHERE key::uuid IN (SELECT id FROM future_safras)
      )
      ELSE 0
    END
  ), 0)
  INTO v_land_debt
  FROM dividas_imobiliarias
  WHERE organizacao_id = p_organization_id;

  -- Get land value from patrimonios
  SELECT COALESCE(SUM(
    CASE 
      WHEN jsonb_typeof(valores_por_safra) = 'object'
      THEN (valores_por_safra->>p_safra_id::text)::DECIMAL
      ELSE 0
    END
  ), 0)
  INTO v_land_value
  FROM patrimonios
  WHERE organizacao_id = p_organization_id
    AND categoria = 'TERRAS';

  -- Get total assets
  SELECT COALESCE(SUM(
    CASE 
      WHEN jsonb_typeof(valores_por_safra) = 'object'
      THEN (valores_por_safra->>p_safra_id::text)::DECIMAL
      ELSE 0
    END
  ), 0)
  INTO v_total_assets
  FROM patrimonios
  WHERE organizacao_id = p_organization_id;

  -- Get revenue and EBITDA from financial projections
  SELECT 
    COALESCE(SUM(CASE WHEN cp.culture_name = 'Consolidado' THEN cp.receita ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN cp.culture_name = 'Consolidado' THEN cp.ebitda ELSE 0 END), 0)
  INTO v_revenue, v_ebitda
  FROM culture_projections cp
  WHERE cp.organizacao_id = p_organization_id
    AND cp.safra_id = p_safra_id;

  -- Calculate equity (Total Assets - Total Debt)
  v_equity := v_total_assets - v_total_debt;

  -- Return calculated metrics
  RETURN QUERY
  SELECT 
    CASE 
      WHEN v_current_liabilities > 0 THEN v_current_assets / v_current_liabilities
      ELSE 10.0 -- High liquidity when no current liabilities
    END as liquidez_corrente,
    
    CASE 
      WHEN v_ebitda > 0 THEN v_total_debt / v_ebitda
      ELSE CASE WHEN v_total_debt > 0 THEN 999.0 ELSE 0 END
    END as divida_ebitda,
    
    CASE 
      WHEN v_revenue > 0 THEN v_total_debt / v_revenue
      ELSE CASE WHEN v_total_debt > 0 THEN 999.0 ELSE 0 END
    END as divida_faturamento,
    
    CASE 
      WHEN v_equity > 0 THEN v_total_debt / v_equity
      ELSE CASE WHEN v_total_debt > 0 THEN 999.0 ELSE 0 END
    END as divida_patrimonio_liquido,
    
    CASE 
      WHEN v_land_value > 0 THEN (v_land_debt / v_land_value) * 100
      ELSE 0
    END as ltv,
    
    CASE 
      WHEN v_revenue > 0 THEN (v_ebitda / v_revenue) * 100
      ELSE 0
    END as margem_ebitda;
END;
$$;

-- Also update the calculate_liquidez_corrente function for consistency
CREATE OR REPLACE FUNCTION calculate_liquidez_corrente(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_scenario_id UUID DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
    v_ativo_circulante NUMERIC := 0;
    v_ativo_biologico NUMERIC := 0;
    v_passivo_circulante NUMERIC := 0;
    v_safra_nome TEXT;
BEGIN
    -- Get safra name
    SELECT nome INTO v_safra_nome
    FROM safras 
    WHERE id = p_safra_id;

    -- Get current assets (including ATIVO_BIOLOGICO)
    SELECT COALESCE(SUM(
        CASE 
            WHEN valores_por_ano IS NOT NULL AND valores_por_ano ? v_safra_nome 
            THEN (valores_por_ano->>v_safra_nome)::NUMERIC
            ELSE 0
        END
    ), 0) INTO v_ativo_circulante
    FROM caixa_disponibilidades
    WHERE organizacao_id = p_organizacao_id
    AND categoria IN ('CAIXA_BANCOS', 'CLIENTES', 'ADIANTAMENTOS', 
                      'ESTOQUE_DEFENSIVOS', 'ESTOQUE_FERTILIZANTES', 
                      'ESTOQUE_COMMODITIES', 'ATIVO_BIOLOGICO');  -- Added ATIVO_BIOLOGICO

    -- Get current liabilities from debts
    WITH dividas_safra AS (
        SELECT COALESCE(SUM(
            CASE 
                WHEN fluxo_pagamento_anual IS NOT NULL AND fluxo_pagamento_anual ? v_safra_nome 
                THEN (fluxo_pagamento_anual->>v_safra_nome)::NUMERIC
                ELSE 0
            END
        ), 0) as total
        FROM dividas_bancarias
        WHERE organizacao_id = p_organizacao_id
        
        UNION ALL
        
        SELECT COALESCE(SUM(
            CASE 
                WHEN valores_por_ano IS NOT NULL AND valores_por_ano ? v_safra_nome 
                THEN (valores_por_ano->>v_safra_nome)::NUMERIC
                ELSE 0
            END
        ), 0) as total
        FROM dividas_fornecedores
        WHERE organizacao_id = p_organizacao_id
    )
    SELECT SUM(total) INTO v_passivo_circulante FROM dividas_safra;

    -- Calculate liquidity ratio
    IF v_passivo_circulante > 0 THEN
        RETURN ROUND(v_ativo_circulante / v_passivo_circulante, 2);
    ELSE
        -- Se não há passivos circulantes mas há ativos, a liquidez é teoricamente infinita
        -- Retornamos um valor muito alto para indicar excelente liquidez
        IF v_ativo_circulante > 0 THEN
            RETURN 999.99; -- Valor máximo para indicar liquidez extremamente alta
        ELSE
            -- Se não há nem ativos nem passivos circulantes, retorna 0
            RETURN 0;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Log the update
INSERT INTO system_logs (message, created_at) 
VALUES ('Updated liquidez corrente calculation to include ATIVO_BIOLOGICO', NOW());