-- Fix LTV calculation to use net bank debt divided by equity
-- Based on the debt position module calculation: (Bank Debts - Cash) / Equity

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
BEGIN
    -- Get safra years
    SELECT ano_inicio, ano_fim INTO v_safra_ano_inicio, v_safra_ano_fim
    FROM safras
    WHERE id = p_safra_id;

    -- 1. Calculate total bank debts
    SELECT COALESCE(SUM(
        CASE 
            WHEN db.fluxo_pagamento_anual IS NOT NULL AND db.fluxo_pagamento_anual::text != '{}' THEN
                (
                    SELECT SUM(valor::numeric)
                    FROM jsonb_each_text(db.fluxo_pagamento_anual) AS f(safra_id, valor)
                    WHERE EXISTS (
                        SELECT 1 FROM safras s 
                        WHERE s.id = f.safra_id::uuid 
                        AND s.ano_inicio <= v_safra_ano_fim
                    )
                )
            ELSE 0
        END
    ), 0) INTO v_dividas_bancarias
    FROM dividas_bancarias db
    WHERE db.organizacao_id = p_organizacao_id
    AND db.modalidade IN ('CREDITO_RURAL', 'CAPITAL_GIRO', 'FINANCIAMENTO_INVESTIMENTO');

    -- 2. Calculate cash and liquid assets
    SELECT COALESCE(SUM(
        CASE 
            WHEN cd.valores_por_ano IS NOT NULL AND cd.valores_por_ano::text != '{}' THEN
                (
                    SELECT SUM(valor::numeric)
                    FROM jsonb_each_text(cd.valores_por_ano) AS f(safra_id, valor)
                    WHERE EXISTS (
                        SELECT 1 FROM safras s 
                        WHERE s.id = f.safra_id::uuid 
                        AND s.ano_inicio = v_safra_ano_inicio
                    )
                )
            ELSE 0
        END
    ), 0) INTO v_caixa_disponibilidades
    FROM caixa_disponibilidades cd
    WHERE cd.organizacao_id = p_organizacao_id;

    -- 3. Calculate equity (patrimônio líquido)
    -- Based on the financial module, this should come from the balance sheet
    -- For now, we'll use a placeholder calculation based on assets
    SELECT COALESCE(SUM(p.valor_atual), 0) INTO v_patrimonio_liquido
    FROM propriedades p
    WHERE p.organizacao_id = p_organizacao_id;

    -- Add other assets if available
    -- This is a simplified version - in production, this would come from the balance sheet

    -- 4. Calculate net bank debt
    v_endividamento_liquido := v_dividas_bancarias - v_caixa_disponibilidades;

    -- 5. Calculate LTV
    IF v_patrimonio_liquido > 0 THEN
        v_ltv := v_endividamento_liquido / v_patrimonio_liquido;
    ELSE
        v_ltv := 0;
    END IF;

    -- Ensure LTV is not negative
    IF v_ltv < 0 THEN
        v_ltv := 0;
    END IF;

    RETURN ROUND(v_ltv, 4); -- Return as decimal (e.g., 0.396 for 39.6%)
END;
$$ LANGUAGE plpgsql;

-- Update the rating calculation to handle LTV properly
-- The scoring thresholds remain the same:
-- <= 30% = 100 points
-- <= 40% = 80 points  
-- <= 50% = 60 points
-- <= 60% = 40 points
-- > 60% = 20 points