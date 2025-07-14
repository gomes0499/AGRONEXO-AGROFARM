-- Drop existing function versions to avoid conflicts
DROP FUNCTION IF EXISTS calcular_total_dividas_bancarias(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS calcular_total_dividas_bancarias(UUID);

-- Create clean version of the function to calculate bank debts dynamically
-- Uses valor_principal (not payment flows) and dynamic exchange rate per harvest
CREATE OR REPLACE FUNCTION calcular_total_dividas_bancarias(
    p_organizacao_id UUID,
    p_projection_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_brl DECIMAL(15,2),
    total_usd DECIMAL(15,2),
    total_consolidado_brl DECIMAL(15,2),
    taxa_cambio DECIMAL(10,4),
    quantidade_contratos INTEGER
) AS $$
DECLARE
    v_taxa_cambio DECIMAL(10,4);
BEGIN
    -- Get exchange rate from projections first (by harvest/safra)
    SELECT cotacao_atual INTO v_taxa_cambio
    FROM cotacoes_cambio_projections
    WHERE tipo_moeda = 'USD'
    AND organizacao_id = p_organizacao_id
    AND (p_projection_id IS NULL OR projection_id = p_projection_id)
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- If no projection rate found, try base cotacoes_cambio
    IF v_taxa_cambio IS NULL THEN
        SELECT cotacao_atual INTO v_taxa_cambio
        FROM cotacoes_cambio
        WHERE tipo_moeda = 'USD'
        AND organizacao_id = p_organizacao_id
        ORDER BY updated_at DESC
        LIMIT 1;
    END IF;
    
    -- Use default rate if none found
    IF v_taxa_cambio IS NULL THEN
        v_taxa_cambio := 5.50;
    END IF;
    
    RETURN QUERY
    WITH dividas_calculadas AS (
        SELECT 
            db.moeda,
            -- Use valor_principal ONLY (not payment flows with interest)
            COALESCE(db.valor_principal, 0) as valor_total
        FROM dividas_bancarias db
        WHERE db.organizacao_id = p_organizacao_id
    )
    SELECT 
        -- Total in BRL (only BRL debts)
        COALESCE(SUM(CASE WHEN moeda = 'BRL' THEN valor_total ELSE 0 END), 0)::DECIMAL(15,2) as total_brl,
        
        -- Total in USD (only USD debts)
        COALESCE(SUM(CASE WHEN moeda = 'USD' THEN valor_total ELSE 0 END), 0)::DECIMAL(15,2) as total_usd,
        
        -- Total consolidated in BRL (everything converted to BRL)
        COALESCE(SUM(
            CASE 
                WHEN moeda = 'BRL' THEN valor_total
                WHEN moeda = 'USD' THEN valor_total * v_taxa_cambio
                ELSE valor_total
            END
        ), 0)::DECIMAL(15,2) as total_consolidado_brl,
        
        -- Exchange rate used
        v_taxa_cambio as taxa_cambio,
        
        -- Number of contracts
        COUNT(*)::INTEGER as quantidade_contratos
    FROM dividas_calculadas
    WHERE valor_total > 0;
END;
$$ LANGUAGE plpgsql;

-- Add documentation
COMMENT ON FUNCTION calcular_total_dividas_bancarias IS 
'Dynamically calculates total bank debts for an organization, 
considering USD to BRL currency conversion. Uses valor_principal 
when available, otherwise sums payment flows.';