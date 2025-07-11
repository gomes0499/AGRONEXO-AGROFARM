-- Fix LTV calculation to use net bank debt divided by equity from balance sheet
-- Formula: (Bank Debts - Cash) / Equity (Patrimônio Líquido)

CREATE OR REPLACE FUNCTION calculate_ltv(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_scenario_id UUID DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
    v_dividas_bancarias NUMERIC := 0;
    v_caixa_disponibilidades NUMERIC := 0;
    v_patrimonio_liquido NUMERIC := 0;
    v_endividamento_liquido NUMERIC := 0;
    v_ltv NUMERIC := 0;
    v_safra_ano_inicio INTEGER;
    v_safra_ano_fim INTEGER;
    v_total_ativos NUMERIC := 0;
    v_total_passivos NUMERIC := 0;
BEGIN
    -- Get safra years
    SELECT ano_inicio, ano_fim INTO v_safra_ano_inicio, v_safra_ano_fim
    FROM safras
    WHERE id = p_safra_id;

    -- 1. Calculate total bank debts for the safra
    -- Include all bank modalities
    SELECT COALESCE(SUM(
        CASE 
            WHEN db.fluxo_pagamento_anual IS NOT NULL AND db.fluxo_pagamento_anual::text != '{}' THEN
                (
                    SELECT valor::numeric
                    FROM jsonb_each_text(db.fluxo_pagamento_anual) AS f(safra_id, valor)
                    WHERE f.safra_id::uuid = p_safra_id
                )
            ELSE 0
        END
    ), 0) INTO v_dividas_bancarias
    FROM dividas_bancarias db
    WHERE db.organizacao_id = p_organizacao_id
    AND db.modalidade IN ('CREDITO_RURAL', 'CAPITAL_GIRO', 'FINANCIAMENTO_INVESTIMENTO', 'FINANCIAMENTO_TERRAS');

    -- 2. Calculate cash and liquid assets for the safra
    SELECT COALESCE(SUM(
        CASE 
            WHEN cd.valores_por_safra IS NOT NULL AND cd.valores_por_safra::text != '{}' THEN
                (
                    SELECT valor::numeric
                    FROM jsonb_each_text(cd.valores_por_safra) AS f(safra_id, valor)
                    WHERE f.safra_id::uuid = p_safra_id
                )
            ELSE 0
        END
    ), 0) INTO v_caixa_disponibilidades
    FROM caixa_disponibilidades cd
    WHERE cd.organizacao_id = p_organizacao_id
    AND cd.categoria = 'CAIXA_BANCOS'; -- Only cash in banks

    -- 3. Calculate equity (patrimônio líquido) from balance sheet components
    -- First, calculate total assets
    SELECT COALESCE(SUM(
        CASE 
            WHEN cd.valores_por_safra IS NOT NULL AND cd.valores_por_safra::text != '{}' THEN
                (
                    SELECT valor::numeric
                    FROM jsonb_each_text(cd.valores_por_safra) AS f(safra_id, valor)
                    WHERE f.safra_id::uuid = p_safra_id
                )
            ELSE 0
        END
    ), 0) INTO v_total_ativos
    FROM caixa_disponibilidades cd
    WHERE cd.organizacao_id = p_organizacao_id;

    -- Add property values to assets
    SELECT v_total_ativos + COALESCE(SUM(p.valor_atual), 0) INTO v_total_ativos
    FROM propriedades p
    WHERE p.organizacao_id = p_organizacao_id;

    -- Calculate total liabilities (all debts)
    -- Bank debts
    v_total_passivos := v_dividas_bancarias;
    
    -- Add land debts
    SELECT v_total_passivos + COALESCE(SUM(dt.valor_total), 0) INTO v_total_passivos
    FROM dividas_terras dt
    WHERE dt.organizacao_id = p_organizacao_id;
    
    -- Add supplier debts for the safra
    SELECT v_total_passivos + COALESCE(SUM(
        CASE 
            WHEN df.valores_por_safra IS NOT NULL AND df.valores_por_safra::text != '{}' THEN
                (
                    SELECT valor::numeric
                    FROM jsonb_each_text(df.valores_por_safra) AS f(safra_id, valor)
                    WHERE f.safra_id::uuid = p_safra_id
                )
            ELSE 0
        END
    ), 0) INTO v_total_passivos
    FROM dividas_fornecedores df
    WHERE df.organizacao_id = p_organizacao_id;

    -- Calculate equity as Assets - Liabilities
    v_patrimonio_liquido := v_total_ativos - v_total_passivos;

    -- 4. Calculate net bank debt
    v_endividamento_liquido := v_dividas_bancarias - v_caixa_disponibilidades;

    -- 5. Calculate LTV
    IF v_patrimonio_liquido > 0 THEN
        v_ltv := v_endividamento_liquido / v_patrimonio_liquido;
    ELSE
        -- If equity is zero or negative, return max LTV
        v_ltv := 0.999; -- 99.9%
    END IF;

    -- Ensure LTV is within reasonable bounds
    IF v_ltv < 0 THEN
        v_ltv := 0;
    ELSIF v_ltv > 0.999 THEN
        v_ltv := 0.999;
    END IF;

    RETURN ROUND(v_ltv, 4); -- Return as decimal (e.g., 0.396 for 39.6%)
END;
$$ LANGUAGE plpgsql;