-- Make SR/Prime Rating Model a global default model available for all organizations

-- First, update the existing SR/Prime Rating Model to be global and default
UPDATE rating_models 
SET 
  organizacao_id = NULL,  -- Make it global (not tied to specific organization)
  is_default = true,
  descricao = 'Modelo padrão de rating SR/Prime com 32 métricas pré-definidas para análise completa de risco'
WHERE nome = 'SR/Prime Rating Model';

-- Ensure all other models are not default if they were
UPDATE rating_models 
SET is_default = false 
WHERE nome != 'SR/Prime Rating Model' AND is_default = true;

-- Create a function to initialize SR/Prime model for new organizations
CREATE OR REPLACE FUNCTION initialize_sr_prime_model_for_org(org_id UUID)
RETURNS VOID AS $$
DECLARE
    global_model_id UUID;
    org_model_id UUID;
BEGIN
    -- Get the global SR/Prime model
    SELECT id INTO global_model_id 
    FROM rating_models 
    WHERE nome = 'SR/Prime Rating Model' 
    AND organizacao_id IS NULL 
    AND is_default = true;
    
    -- Check if organization already has this model
    SELECT id INTO org_model_id
    FROM rating_models
    WHERE organizacao_id = org_id
    AND nome = 'SR/Prime Rating Model';
    
    -- If organization doesn't have the model, create a copy
    IF org_model_id IS NULL AND global_model_id IS NOT NULL THEN
        INSERT INTO rating_models (
            organizacao_id,
            nome,
            descricao,
            is_default,
            is_active,
            flow_data
        )
        SELECT 
            org_id,
            nome,
            descricao,
            true,  -- Make it default for the organization
            is_active,
            flow_data
        FROM rating_models
        WHERE id = global_model_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- For existing organizations that don't have the SR/Prime model, create it
DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN 
        SELECT DISTINCT id as org_id 
        FROM organizations 
        WHERE id NOT IN (
            SELECT DISTINCT organizacao_id 
            FROM rating_models 
            WHERE nome = 'SR/Prime Rating Model' 
            AND organizacao_id IS NOT NULL
        )
    LOOP
        PERFORM initialize_sr_prime_model_for_org(org_record.org_id);
    END LOOP;
END;
$$;