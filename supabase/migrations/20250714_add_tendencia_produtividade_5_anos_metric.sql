-- Add new metric: TENDENCIA_PRODUTIVIDADE_5_ANOS
INSERT INTO rating_metrics (
    id,
    organizacao_id,
    nome,
    codigo,
    tipo,
    categoria,
    descricao,
    formula,
    unidade,
    is_predefined,
    is_active,
    source_type,
    component_type,
    component_category,
    peso
) VALUES (
    gen_random_uuid(),
    NULL, -- Global metric
    'Tendência de produtividade (5 anos)',
    'TENDENCIA_PRODUTIVIDADE_5_ANOS',
    'QUANTITATIVE',
    'PRODUTIVIDADE',
    'Analisa a tendência de produtividade nos últimos 5 anos',
    'Calculado com base na regressão linear da produtividade média dos últimos 5 anos',
    '%',
    true,
    true,
    'CALCULATED',
    'QUANTITATIVE',
    'Produtividade',
    4.0
);

-- Add thresholds for TENDENCIA_PRODUTIVIDADE_5_ANOS
-- Get the metric ID and insert thresholds for each organization
DO $$
DECLARE
    metric_id uuid;
    org_id uuid;
BEGIN
    -- Get the metric ID
    SELECT id INTO metric_id FROM rating_metrics WHERE codigo = 'TENDENCIA_PRODUTIVIDADE_5_ANOS';
    
    -- For each organization, create thresholds
    FOR org_id IN SELECT DISTINCT organizacao_id FROM rating_metrics WHERE organizacao_id IS NOT NULL
    LOOP
        -- EXCELENTE: Crescimento contínuo (> 10% growth)
        INSERT INTO rating_metric_thresholds (
            id, rating_metric_id, organizacao_id, nivel, valor_min, valor_max, pontuacao
        ) VALUES (
            gen_random_uuid(), metric_id, org_id, 'EXCELENTE', 10.0, NULL, 100.0
        );
        
        -- BOM: Crescimento moderado (5% to 10% growth)
        INSERT INTO rating_metric_thresholds (
            id, rating_metric_id, organizacao_id, nivel, valor_min, valor_max, pontuacao
        ) VALUES (
            gen_random_uuid(), metric_id, org_id, 'BOM', 5.0, 10.0, 80.0
        );
        
        -- ADEQUADO: Estável (-5% to 5%)
        INSERT INTO rating_metric_thresholds (
            id, rating_metric_id, organizacao_id, nivel, valor_min, valor_max, pontuacao
        ) VALUES (
            gen_random_uuid(), metric_id, org_id, 'ADEQUADO', -5.0, 5.0, 60.0
        );
        
        -- ATENCAO: Declínio moderado (-10% to -5%)
        INSERT INTO rating_metric_thresholds (
            id, rating_metric_id, organizacao_id, nivel, valor_min, valor_max, pontuacao
        ) VALUES (
            gen_random_uuid(), metric_id, org_id, 'ATENCAO', -10.0, -5.0, 40.0
        );
        
        -- CRITICO: Declínio acentuado (< -10%)
        INSERT INTO rating_metric_thresholds (
            id, rating_metric_id, organizacao_id, nivel, valor_min, valor_max, pontuacao
        ) VALUES (
            gen_random_uuid(), metric_id, org_id, 'CRITICO', NULL, -10.0, 20.0
        );
    END LOOP;
END $$;

-- Note: organizacao_id does not allow NULL values, so we only create thresholds for existing organizations