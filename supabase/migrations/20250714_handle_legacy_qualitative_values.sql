-- For existing qualitative values without safra_id, we'll update the rating calculation
-- to check both with safra_id and without (legacy support)

-- First, let's create a function to get qualitative value with fallback
CREATE OR REPLACE FUNCTION get_qualitative_metric_value(
    p_organization_id UUID,
    p_metric_id UUID,
    p_safra_id UUID
) RETURNS NUMERIC AS $$
DECLARE
    v_value NUMERIC;
BEGIN
    -- First try to get value for specific safra
    SELECT valor INTO v_value
    FROM qualitative_metric_values
    WHERE organizacao_id = p_organization_id
      AND rating_metric_id = p_metric_id
      AND safra_id = p_safra_id
      AND is_current = true
    ORDER BY data_avaliacao DESC
    LIMIT 1;
    
    -- If not found, try to get value without safra_id (legacy data)
    IF v_value IS NULL THEN
        SELECT valor INTO v_value
        FROM qualitative_metric_values
        WHERE organizacao_id = p_organization_id
          AND rating_metric_id = p_metric_id
          AND safra_id IS NULL
          AND is_current = true
        ORDER BY data_avaliacao DESC
        LIMIT 1;
    END IF;
    
    -- Return value or 0 if not found
    RETURN COALESCE(v_value, 0);
END;
$$ LANGUAGE plpgsql;