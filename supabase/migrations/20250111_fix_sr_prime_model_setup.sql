-- Ensure SR/Prime model is properly configured
-- The SR/Prime model uses a split system:
-- - CALCULATED metrics (automatic) are part of the model
-- - MANUAL metrics are evaluated separately via "Avaliar Métricas"

DO $$
DECLARE
    v_model_id UUID;
    v_calculated_weight NUMERIC;
    v_manual_weight NUMERIC;
BEGIN
    -- Find the SR/Prime model
    SELECT id INTO v_model_id 
    FROM rating_models 
    WHERE nome = 'SR/Prime Rating Model' 
    AND is_default = true
    LIMIT 1;
    
    IF v_model_id IS NULL THEN
        -- Create the SR/Prime model if it doesn't exist
        INSERT INTO rating_models (
            id, organizacao_id, nome, descricao, 
            is_default, is_active, created_at, updated_at
        ) VALUES (
            uuid_generate_v4(),
            NULL, -- Global model
            'SR/Prime Rating Model',
            'Modelo padrão SR/Prime com análise quantitativa (60%) e qualitativa (40%). Métricas quantitativas são calculadas automaticamente e métricas qualitativas são avaliadas manualmente.',
            true,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ) RETURNING id INTO v_model_id;
    END IF;
    
    -- Clear existing associations
    DELETE FROM rating_model_metrics WHERE rating_model_id = v_model_id;
    
    -- Associate only CALCULATED metrics with the model
    -- These are calculated automatically
    INSERT INTO rating_model_metrics (
        id, rating_model_id, rating_metric_id, peso, created_at, updated_at
    )
    SELECT 
        uuid_generate_v4(),
        v_model_id,
        rm.id,
        rm.peso,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM rating_metrics rm
    WHERE rm.is_predefined = true
    AND rm.source_type = 'CALCULATED'
    AND rm.is_active = true;
    
    -- Calculate weights for verification
    SELECT SUM(peso) INTO v_calculated_weight
    FROM rating_metrics
    WHERE is_predefined = true
    AND source_type = 'CALCULATED';
    
    SELECT SUM(peso) INTO v_manual_weight
    FROM rating_metrics
    WHERE is_predefined = true
    AND source_type = 'MANUAL';
    
    RAISE NOTICE 'SR/Prime Model Configuration:';
    RAISE NOTICE '- Model ID: %', v_model_id;
    RAISE NOTICE '- Calculated metrics weight: %% (auto-calculated)', v_calculated_weight;
    RAISE NOTICE '- Manual metrics weight: %% (evaluated via "Avaliar Métricas")', v_manual_weight;
    RAISE NOTICE '- Total weight: %%', v_calculated_weight + v_manual_weight;
    
    -- The total should be 100%
    IF (v_calculated_weight + v_manual_weight) != 100 THEN
        RAISE WARNING 'Total weight is not 100%%! Calculated: %%, Manual: %%, Total: %%', 
            v_calculated_weight, v_manual_weight, v_calculated_weight + v_manual_weight;
    END IF;
END $$;

-- Add a description to clarify how the SR/Prime model works
COMMENT ON TABLE rating_models IS 'Modelos de rating. O modelo SR/Prime é especial: usa métricas CALCULATED automaticamente e métricas MANUAL são avaliadas via interface separada.';
COMMENT ON TABLE rating_model_metrics IS 'Associação entre modelos e métricas. Para SR/Prime, contém apenas métricas CALCULATED.';
COMMENT ON TABLE rating_manual_evaluations IS 'Avaliações manuais das métricas MANUAL do modelo SR/Prime, inseridas via "Avaliar Métricas".';