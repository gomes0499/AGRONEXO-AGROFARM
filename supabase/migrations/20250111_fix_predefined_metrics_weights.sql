-- Fix predefined metrics weights to ensure they sum to 100%
-- First, let's check current weights
DO $$
DECLARE
    total_weight NUMERIC;
BEGIN
    SELECT SUM(peso) INTO total_weight
    FROM rating_metrics
    WHERE is_predefined = true;
    
    RAISE NOTICE 'Total weight of predefined metrics: %', total_weight;
END $$;

-- Update metrics with decimal weights to ensure proper storage
UPDATE rating_metrics 
SET peso = 1.5
WHERE codigo = 'BENEFICIAMENTO' AND is_predefined = true;

UPDATE rating_metrics 
SET peso = 0.5
WHERE codigo = 'ATIVIDADES_INTEGRADAS' AND is_predefined = true;

-- Verify all predefined metrics have correct weights
UPDATE rating_metrics SET peso = CASE
    -- Indicadores Financeiros (29% total)
    WHEN codigo = 'LIQUIDEZ_CORRENTE' THEN 7
    WHEN codigo = 'LTV' THEN 8
    WHEN codigo = 'MARGEM_EBITDA' THEN 7
    WHEN codigo = 'DIVIDA_EBITDA' THEN 7
    
    -- Histórico de Crédito (15% total)
    WHEN codigo = 'PONTUALIDADE_PAGAMENTOS' THEN 6
    WHEN codigo = 'RESTRICOES_CREDITO' THEN 5
    WHEN codigo = 'APONTAMENTOS_SISBACEN' THEN 4
    
    -- Produtividade (12% total)
    WHEN codigo = 'CULTURAS_CORE' THEN 4
    WHEN codigo = 'PRODUTIVIDADE_VS_MEDIA' THEN 4
    WHEN codigo = 'TENDENCIA_PRODUTIVIDADE' THEN 4
    
    -- Área (4% total)
    WHEN codigo = 'AREA_PROPRIA' THEN 4
    
    -- Gestão e Governança (12% total)
    WHEN codigo = 'EXPERIENCIA_PRODUTOR' THEN 4
    WHEN codigo = 'FORMACAO_ESPECIFICA' THEN 1
    WHEN codigo = 'AGRICULTURA_PRINCIPAL' THEN 1
    WHEN codigo = 'PLANO_SUCESSAO' THEN 2
    WHEN codigo = 'SUCESSORES_GESTAO' THEN 1
    WHEN codigo = 'DOCUMENTACAO_SUCESSAO' THEN 1
    WHEN codigo = 'SOFTWARE_GESTAO' THEN 2
    WHEN codigo = 'REGISTROS_DETALHADOS' THEN 2
    WHEN codigo = 'ORCAMENTOS_ANUAIS' THEN 2
    
    -- Sustentabilidade (5% total)
    WHEN codigo = 'PLANTIO_DIRETO' THEN 1
    WHEN codigo = 'ENERGIA_RENOVAVEL' THEN 1
    WHEN codigo = 'AUTUACOES_AMBIENTAIS' THEN 3
    
    -- Irrigação/Equipamentos (8% total)
    WHEN codigo = 'SISTEMAS_IRRIGACAO' THEN 5
    WHEN codigo = 'EQUIPAMENTOS_SUFICIENTES' THEN 2
    WHEN codigo = 'ARMAZENAGEM_PROPRIA' THEN 1
    
    -- Diversificação (8% total)
    WHEN codigo = 'ROTACAO_CULTURAS' THEN 4
    WHEN codigo = 'POLITICA_COMERCIALIZACAO' THEN 1
    WHEN codigo = 'UTILIZACAO_DERIVATIVOS' THEN 1
    WHEN codigo = 'BENEFICIAMENTO' THEN 1.5
    WHEN codigo = 'ATIVIDADES_INTEGRADAS' THEN 0.5
    
    -- Fatores Externos (4% total)
    WHEN codigo = 'RISCOS_CLIMATICOS' THEN 4
    
    ELSE peso
END
WHERE is_predefined = true;

-- Final verification
DO $$
DECLARE
    total_weight NUMERIC;
    quantitative_weight NUMERIC;
    qualitative_weight NUMERIC;
BEGIN
    -- Total weight
    SELECT SUM(peso) INTO total_weight
    FROM rating_metrics
    WHERE is_predefined = true;
    
    -- Quantitative weight
    SELECT SUM(peso) INTO quantitative_weight
    FROM rating_metrics
    WHERE is_predefined = true AND component_type = 'QUANTITATIVE';
    
    -- Qualitative weight
    SELECT SUM(peso) INTO qualitative_weight
    FROM rating_metrics
    WHERE is_predefined = true AND component_type = 'QUALITATIVE';
    
    RAISE NOTICE 'Total weight: %', total_weight;
    RAISE NOTICE 'Quantitative weight: %', quantitative_weight;
    RAISE NOTICE 'Qualitative weight: %', qualitative_weight;
    
    IF total_weight != 100 THEN
        RAISE EXCEPTION 'Total weight is not 100%: %', total_weight;
    END IF;
END $$;