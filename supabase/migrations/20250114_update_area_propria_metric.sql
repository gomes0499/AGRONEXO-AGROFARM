-- Update the AREA_PROPRIA metric to calculate percentage of leased area instead of owned area
-- This matches the requirement: "% Área própria e arrendada" with thresholds showing higher percentages = worse ratings

UPDATE rating_metrics 
SET 
    nome = '% Área própria e arrendada',
    descricao = 'Percentual de área arrendada em relação à área total',
    formula = 'area_arrendada / area_total * 100'
WHERE codigo = 'AREA_PROPRIA';

-- Insert thresholds for AREA_PROPRIA metric
-- Based on requirements:
-- Excelente (5): < 15%
-- Bom (4): 15-25%
-- Regular (3): 25-35%
-- Fraco (2): 35-50%
-- Crítico (1): > 50%

DO $$
DECLARE
    v_area_propria_id UUID;
BEGIN
    -- Get metric ID
    SELECT id INTO v_area_propria_id FROM rating_metrics WHERE codigo = 'AREA_PROPRIA';

    -- Delete existing thresholds
    DELETE FROM rating_metric_thresholds WHERE rating_metric_id = v_area_propria_id;

    -- Insert new thresholds
    IF v_area_propria_id IS NOT NULL THEN
        INSERT INTO rating_metric_thresholds (rating_metric_id, classificacao, valor_min, valor_max, pontuacao) VALUES
        (v_area_propria_id, 'EXCELENTE', NULL, 15, 100),    -- < 15%
        (v_area_propria_id, 'BOM', 15, 25, 80),             -- 15-25%
        (v_area_propria_id, 'ADEQUADO', 25, 35, 60),        -- 25-35%
        (v_area_propria_id, 'ATENCAO', 35, 50, 40),         -- 35-50%
        (v_area_propria_id, 'CRITICO', 50, NULL, 20);       -- > 50%
    END IF;
END $$;