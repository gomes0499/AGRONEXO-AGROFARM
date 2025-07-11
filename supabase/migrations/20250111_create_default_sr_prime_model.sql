-- Create default SR/Prime Rating Model with proper metric associations
DO $$
DECLARE
    v_model_id UUID;
    v_org_id UUID;
BEGIN
    -- Get a sample organization ID or NULL
    SELECT id INTO v_org_id FROM organizacoes LIMIT 1;
    
    -- Check if default model already exists
    SELECT id INTO v_model_id 
    FROM rating_models 
    WHERE nome = 'SR/Prime Rating Model' 
    AND is_default = true
    LIMIT 1;
    
    IF v_model_id IS NULL THEN
        -- Create the default SR/Prime model
        INSERT INTO rating_models (
            id, organizacao_id, nome, descricao, 
            is_default, is_active, created_at, updated_at
        ) VALUES (
            uuid_generate_v4(),
            NULL, -- Global model
            'SR/Prime Rating Model',
            'Modelo padrão SR/Prime com análise quantitativa (60%) e qualitativa (40%)',
            true,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ) RETURNING id INTO v_model_id;
        
        -- Associate only CALCULATED metrics with the model
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
        
        RAISE NOTICE 'Created default SR/Prime model with ID: %', v_model_id;
    ELSE
        -- Update existing model to ensure only calculated metrics are associated
        DELETE FROM rating_model_metrics
        WHERE rating_model_id = v_model_id;
        
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
        
        RAISE NOTICE 'Updated default SR/Prime model with ID: %', v_model_id;
    END IF;
    
    -- Log the total weight of associated metrics
    DECLARE
        total_weight NUMERIC;
    BEGIN
        SELECT SUM(rmm.peso) INTO total_weight
        FROM rating_model_metrics rmm
        WHERE rmm.rating_model_id = v_model_id;
        
        RAISE NOTICE 'Total weight of calculated metrics in SR/Prime model: %', total_weight;
    END;
END $$;