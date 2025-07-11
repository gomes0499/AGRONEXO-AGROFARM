-- Ensure SR/Prime model is correctly set up with all predefined metrics enabled by default

DO $$
DECLARE
    v_sr_prime_id UUID;
BEGIN
    -- Find or create SR/Prime model
    SELECT id INTO v_sr_prime_id
    FROM rating_models
    WHERE nome = 'SR/Prime Rating Model';
    
    IF v_sr_prime_id IS NULL THEN
        INSERT INTO rating_models (
            id, organizacao_id, nome, descricao, is_default, is_active
        ) VALUES (
            uuid_generate_v4(),
            NULL,
            'SR/Prime Rating Model',
            'Modelo padrão SR/Prime com análise quantitativa (60%) e qualitativa (40%)',
            true,
            true
        ) RETURNING id INTO v_sr_prime_id;
    END IF;
    
    -- Clear existing associations
    DELETE FROM rating_model_metrics WHERE rating_model_id = v_sr_prime_id;
    
    -- Associate ALL predefined metrics with SR/Prime model
    INSERT INTO rating_model_metrics (
        id, rating_model_id, rating_metric_id, peso
    )
    SELECT 
        uuid_generate_v4(),
        v_sr_prime_id,
        id,
        peso
    FROM rating_metrics
    WHERE is_predefined = true;
    
    RAISE NOTICE 'SR/Prime model configured with all predefined metrics';
END $$;