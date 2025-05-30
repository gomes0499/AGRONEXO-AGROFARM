-- =============================================================================
-- INDICATORS MODULE - FUNCTIONS
-- =============================================================================
-- This file contains all functions for the indicators module
-- Includes query helpers, calculations, and analysis functions
-- =============================================================================

-- =============================================================================
-- COMMODITY PRICE QUERY FUNCTIONS
-- =============================================================================

-- Function to get commodity price for a specific year
CREATE OR REPLACE FUNCTION get_commodity_price_by_year(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_commodity_type tipo_commodity,
    p_year INTEGER
)
RETURNS DECIMAL(15, 4) AS $$
DECLARE
    price_value DECIMAL(15, 4);
BEGIN
    SELECT (precos_por_ano->>p_year::TEXT)::DECIMAL(15, 4)
    INTO price_value
    FROM commodity_price_projections
    WHERE organizacao_id = p_organizacao_id
      AND safra_id = p_safra_id
      AND commodity_type = p_commodity_type;
    
    RETURN COALESCE(price_value, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get all commodity prices for an organization and safra
CREATE OR REPLACE FUNCTION get_commodity_prices_by_safra(
    p_organizacao_id UUID,
    p_safra_id UUID
)
RETURNS TABLE(
    commodity_type tipo_commodity,
    unit unidade_preco_commodity,
    current_price DECIMAL(15, 4),
    precos_por_ano JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.commodity_type,
        cp.unit,
        cp.current_price,
        cp.precos_por_ano
    FROM commodity_price_projections cp
    WHERE cp.organizacao_id = p_organizacao_id
      AND cp.safra_id = p_safra_id
    ORDER BY cp.commodity_type;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get price evolution for a commodity across years
CREATE OR REPLACE FUNCTION get_commodity_price_evolution(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_commodity_type tipo_commodity
)
RETURNS TABLE(
    ano INTEGER,
    preco DECIMAL(15, 4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cpa.ano,
        cpa.preco
    FROM commodity_price_projections_anos cpa
    WHERE cpa.organizacao_id = p_organizacao_id
      AND cpa.safra_id = p_safra_id
      AND cpa.commodity_type = p_commodity_type
    ORDER BY cpa.ano;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate average price for a commodity across years
CREATE OR REPLACE FUNCTION get_commodity_average_price(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_commodity_type tipo_commodity,
    p_start_year INTEGER DEFAULT NULL,
    p_end_year INTEGER DEFAULT NULL
)
RETURNS DECIMAL(15, 4) AS $$
DECLARE
    avg_price DECIMAL(15, 4);
BEGIN
    SELECT AVG(cpa.preco)
    INTO avg_price
    FROM commodity_price_projections_anos cpa
    WHERE cpa.organizacao_id = p_organizacao_id
      AND cpa.safra_id = p_safra_id
      AND cpa.commodity_type = p_commodity_type
      AND (p_start_year IS NULL OR cpa.ano >= p_start_year)
      AND (p_end_year IS NULL OR cpa.ano <= p_end_year);
    
    RETURN COALESCE(avg_price, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get price variance/volatility
CREATE OR REPLACE FUNCTION get_commodity_price_volatility(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_commodity_type tipo_commodity
)
RETURNS DECIMAL(15, 4) AS $$
DECLARE
    price_variance DECIMAL(15, 4);
BEGIN
    WITH price_stats AS (
        SELECT 
            AVG(preco) as mean_price,
            STDDEV(preco) as std_price
        FROM commodity_price_projections_anos
        WHERE organizacao_id = p_organizacao_id
          AND safra_id = p_safra_id
          AND commodity_type = p_commodity_type
    )
    SELECT 
        CASE 
            WHEN mean_price > 0 THEN (std_price / mean_price) * 100
            ELSE 0 
        END
    INTO price_variance
    FROM price_stats;
    
    RETURN COALESCE(price_variance, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- INDICATOR THRESHOLD FUNCTIONS
-- =============================================================================

-- Function to get threshold value for a specific indicator
CREATE OR REPLACE FUNCTION get_indicator_threshold(
    p_organizacao_id UUID,
    p_indicator_type TEXT,
    p_threshold_level TEXT DEFAULT 'medio'
)
RETURNS DECIMAL(10, 4) AS $$
DECLARE
    threshold_value DECIMAL(10, 4);
    threshold_jsonb JSONB;
BEGIN
    SELECT 
        CASE p_indicator_type
            WHEN 'liquidez' THEN limiares_liquidez
            WHEN 'divida_ebitda' THEN limiares_divida_ebitda
            WHEN 'divida_receita' THEN limiares_divida_receita
            WHEN 'divida_patrimonio' THEN limiares_divida_patrimonio
            WHEN 'ltv' THEN limiares_ltv
        END
    INTO threshold_jsonb
    FROM configuracao_indicadores
    WHERE organizacao_id = p_organizacao_id;
    
    IF threshold_jsonb IS NOT NULL THEN
        threshold_value := (threshold_jsonb->>p_threshold_level)::DECIMAL(10, 4);
    END IF;
    
    RETURN COALESCE(threshold_value, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if value exceeds threshold
CREATE OR REPLACE FUNCTION check_threshold_exceeded(
    p_organizacao_id UUID,
    p_indicator_type TEXT,
    p_current_value DECIMAL(15, 4),
    p_threshold_level TEXT DEFAULT 'alto'
)
RETURNS BOOLEAN AS $$
DECLARE
    threshold_value DECIMAL(10, 4);
BEGIN
    threshold_value := get_indicator_threshold(p_organizacao_id, p_indicator_type, p_threshold_level);
    
    RETURN p_current_value > threshold_value;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get risk level based on value and thresholds
CREATE OR REPLACE FUNCTION get_risk_level(
    p_organizacao_id UUID,
    p_indicator_type TEXT,
    p_current_value DECIMAL(15, 4)
)
RETURNS TEXT AS $$
DECLARE
    threshold_baixo DECIMAL(10, 4);
    threshold_medio DECIMAL(10, 4);
    threshold_alto DECIMAL(10, 4);
BEGIN
    threshold_baixo := get_indicator_threshold(p_organizacao_id, p_indicator_type, 'baixo');
    threshold_medio := get_indicator_threshold(p_organizacao_id, p_indicator_type, 'medio');
    threshold_alto := get_indicator_threshold(p_organizacao_id, p_indicator_type, 'alto');
    
    IF p_current_value <= threshold_baixo THEN
        RETURN 'BAIXO';
    ELSIF p_current_value <= threshold_medio THEN
        RETURN 'MEDIO';
    ELSIF p_current_value <= threshold_alto THEN
        RETURN 'ALTO';
    ELSE
        RETURN 'CRITICO';
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- SENSITIVITY ANALYSIS FUNCTIONS
-- =============================================================================

-- Function to apply sensitivity parameter to a value
CREATE OR REPLACE FUNCTION apply_sensitivity_variation(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_base_value DECIMAL(15, 4),
    p_parameter_type TEXT, -- 'cambio', 'precos', 'produtividade'
    p_scenario TEXT DEFAULT 'cenario_base' -- 'cenario_baixo', 'cenario_base', 'cenario_alto'
)
RETURNS DECIMAL(15, 4) AS $$
DECLARE
    variation_factor DECIMAL(8, 4);
    parameter_jsonb JSONB;
BEGIN
    SELECT 
        CASE p_parameter_type
            WHEN 'cambio' THEN variacoes_cambio
            WHEN 'precos' THEN variacoes_precos_commodities
            WHEN 'produtividade' THEN variacoes_produtividade
        END
    INTO parameter_jsonb
    FROM parametros_sensibilidade
    WHERE organizacao_id = p_organizacao_id
      AND safra_id = p_safra_id;
    
    IF parameter_jsonb IS NOT NULL THEN
        variation_factor := (parameter_jsonb->>p_scenario)::DECIMAL(8, 4);
        RETURN p_base_value * (1 + COALESCE(variation_factor, 0));
    END IF;
    
    RETURN p_base_value;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get all sensitivity scenarios for a value
CREATE OR REPLACE FUNCTION get_sensitivity_scenarios(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_base_value DECIMAL(15, 4),
    p_parameter_type TEXT
)
RETURNS TABLE(
    cenario TEXT,
    valor_ajustado DECIMAL(15, 4),
    variacao_percentual DECIMAL(8, 4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'cenario_baixo'::TEXT,
        apply_sensitivity_variation(p_organizacao_id, p_safra_id, p_base_value, p_parameter_type, 'cenario_baixo'),
        (ps.variacoes_cambio->>'cenario_baixo')::DECIMAL(8, 4) * 100
    FROM parametros_sensibilidade ps
    WHERE ps.organizacao_id = p_organizacao_id AND ps.safra_id = p_safra_id
    
    UNION ALL
    
    SELECT 
        'cenario_base'::TEXT,
        apply_sensitivity_variation(p_organizacao_id, p_safra_id, p_base_value, p_parameter_type, 'cenario_base'),
        (ps.variacoes_cambio->>'cenario_base')::DECIMAL(8, 4) * 100
    FROM parametros_sensibilidade ps
    WHERE ps.organizacao_id = p_organizacao_id AND ps.safra_id = p_safra_id
    
    UNION ALL
    
    SELECT 
        'cenario_alto'::TEXT,
        apply_sensitivity_variation(p_organizacao_id, p_safra_id, p_base_value, p_parameter_type, 'cenario_alto'),
        (ps.variacoes_cambio->>'cenario_alto')::DECIMAL(8, 4) * 100
    FROM parametros_sensibilidade ps
    WHERE ps.organizacao_id = p_organizacao_id AND ps.safra_id = p_safra_id;
END;
$$ LANGUAGE plpgsql STABLE;


-- =============================================================================
-- UTILITY AND AGGREGATION FUNCTIONS
-- =============================================================================

-- Function to get organization's commodity portfolio summary
CREATE OR REPLACE FUNCTION get_commodity_portfolio_summary(
    p_organizacao_id UUID,
    p_safra_id UUID
)
RETURNS TABLE(
    total_commodities INTEGER,
    average_price_variation DECIMAL(8, 4),
    highest_volatility_commodity tipo_commodity,
    lowest_volatility_commodity tipo_commodity
) AS $$
BEGIN
    RETURN QUERY
    WITH portfolio_stats AS (
        SELECT 
            COUNT(*) as commodity_count,
            AVG(get_commodity_price_volatility(cp.organizacao_id, cp.safra_id, cp.commodity_type)) as avg_volatility
        FROM commodity_price_projections cp
        WHERE cp.organizacao_id = p_organizacao_id
          AND cp.safra_id = p_safra_id
    ),
    volatility_rankings AS (
        SELECT 
            cp.commodity_type,
            get_commodity_price_volatility(cp.organizacao_id, cp.safra_id, cp.commodity_type) as volatility,
            ROW_NUMBER() OVER (ORDER BY get_commodity_price_volatility(cp.organizacao_id, cp.safra_id, cp.commodity_type) DESC) as rn_high,
            ROW_NUMBER() OVER (ORDER BY get_commodity_price_volatility(cp.organizacao_id, cp.safra_id, cp.commodity_type) ASC) as rn_low
        FROM commodity_price_projections cp
        WHERE cp.organizacao_id = p_organizacao_id
          AND cp.safra_id = p_safra_id
    )
    SELECT 
        ps.commodity_count::INTEGER,
        ps.avg_volatility,
        (SELECT commodity_type FROM volatility_rankings WHERE rn_high = 1),
        (SELECT commodity_type FROM volatility_rankings WHERE rn_low = 1)
    FROM portfolio_stats ps;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION get_commodity_price_by_year(UUID, UUID, tipo_commodity, INTEGER) IS 'Obtém preço de commodity específica para um ano';
COMMENT ON FUNCTION get_commodity_prices_by_safra(UUID, UUID) IS 'Retorna todos os preços de commodities para uma organização e safra';
COMMENT ON FUNCTION get_commodity_price_evolution(UUID, UUID, tipo_commodity) IS 'Retorna evolução de preços de uma commodity ao longo dos anos';
COMMENT ON FUNCTION get_indicator_threshold(UUID, TEXT, TEXT) IS 'Obtém limiar configurado para um indicador específico';
COMMENT ON FUNCTION apply_sensitivity_variation(UUID, UUID, DECIMAL, TEXT, TEXT) IS 'Aplica variação de sensibilidade a um valor base';
