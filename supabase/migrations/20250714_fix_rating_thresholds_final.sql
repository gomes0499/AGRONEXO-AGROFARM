-- Fix rating metric thresholds to match the user's requirements
-- Based on the table provided:
-- Liquidez Corrente 7% > 2,0(5) 1,5-2,0(4) 1,2-1,5(3) 1,0-1,2(2) < 1,0(1)
-- LTV 8% < 40%(5) 40%-55%(4) 55%-70%(3) 70%-80%(2) > 80%(1)
-- Margem EBITDA 7% > 25%(5) 20%-25%(4) 15%-20%(3) 10%-15%(2) < 10%(1)
-- Dívida Estrutural/EBITDA 7% < -2(5) -1,9-0(4) 0,1-1,1(3) 1,2-2,9(2) > 3(1)

-- First, get the metric IDs
DO $$
DECLARE
    v_liquidez_corrente_id UUID;
    v_ltv_id UUID;
    v_margem_ebitda_id UUID;
    v_divida_ebitda_id UUID;
BEGIN
    -- Get metric IDs
    SELECT id INTO v_liquidez_corrente_id FROM rating_metrics WHERE codigo = 'LIQUIDEZ_CORRENTE';
    SELECT id INTO v_ltv_id FROM rating_metrics WHERE codigo = 'LTV';
    SELECT id INTO v_margem_ebitda_id FROM rating_metrics WHERE codigo = 'MARGEM_EBITDA';
    SELECT id INTO v_divida_ebitda_id FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA';

    -- Delete existing thresholds
    DELETE FROM rating_metric_thresholds WHERE rating_metric_id IN (
        v_liquidez_corrente_id, v_ltv_id, v_margem_ebitda_id, v_divida_ebitda_id
    );

    -- LIQUIDEZ_CORRENTE thresholds
    IF v_liquidez_corrente_id IS NOT NULL THEN
        INSERT INTO rating_metric_thresholds (rating_metric_id, classificacao, valor_min, valor_max, pontuacao) VALUES
        (v_liquidez_corrente_id, 'EXCELENTE', 2.0, NULL, 100),      -- > 2.0
        (v_liquidez_corrente_id, 'BOM', 1.5, 2.0, 80),             -- 1.5-2.0
        (v_liquidez_corrente_id, 'ADEQUADO', 1.2, 1.5, 60),        -- 1.2-1.5
        (v_liquidez_corrente_id, 'ATENCAO', 1.0, 1.2, 40),         -- 1.0-1.2
        (v_liquidez_corrente_id, 'CRITICO', NULL, 1.0, 20);        -- < 1.0
    END IF;

    -- LTV thresholds (percentage values)
    IF v_ltv_id IS NOT NULL THEN
        INSERT INTO rating_metric_thresholds (rating_metric_id, classificacao, valor_min, valor_max, pontuacao) VALUES
        (v_ltv_id, 'EXCELENTE', NULL, 40, 100),     -- < 40%
        (v_ltv_id, 'BOM', 40, 55, 80),              -- 40%-55%
        (v_ltv_id, 'ADEQUADO', 55, 70, 60),         -- 55%-70%
        (v_ltv_id, 'ATENCAO', 70, 80, 40),          -- 70%-80%
        (v_ltv_id, 'CRITICO', 80, NULL, 20);        -- > 80%
    END IF;

    -- MARGEM_EBITDA thresholds (percentage values)
    IF v_margem_ebitda_id IS NOT NULL THEN
        INSERT INTO rating_metric_thresholds (rating_metric_id, classificacao, valor_min, valor_max, pontuacao) VALUES
        (v_margem_ebitda_id, 'EXCELENTE', 25, NULL, 100),    -- > 25%
        (v_margem_ebitda_id, 'BOM', 20, 25, 80),             -- 20%-25%
        (v_margem_ebitda_id, 'ADEQUADO', 15, 20, 60),        -- 15%-20%
        (v_margem_ebitda_id, 'ATENCAO', 10, 15, 40),         -- 10%-15%
        (v_margem_ebitda_id, 'CRITICO', NULL, 10, 20);       -- < 10%
    END IF;

    -- DIVIDA_EBITDA thresholds
    IF v_divida_ebitda_id IS NOT NULL THEN
        INSERT INTO rating_metric_thresholds (rating_metric_id, classificacao, valor_min, valor_max, pontuacao) VALUES
        (v_divida_ebitda_id, 'EXCELENTE', NULL, -2, 100),    -- < -2 (company is net creditor)
        (v_divida_ebitda_id, 'BOM', -2, 0, 80),              -- -2 to 0
        (v_divida_ebitda_id, 'ADEQUADO', 0, 1.1, 60),        -- 0.1-1.1
        (v_divida_ebitda_id, 'ATENCAO', 1.1, 3, 40),         -- 1.2-2.9
        (v_divida_ebitda_id, 'CRITICO', 3, NULL, 20);        -- > 3
    END IF;
END $$;