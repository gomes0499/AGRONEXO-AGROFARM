-- =============================================================================
-- INDICATORS MODULE - TRIGGERS
-- =============================================================================
-- This file contains all triggers for the indicators module
-- Handles JSONB validation, synchronization, and automated updates
-- =============================================================================

-- =============================================================================
-- UTILITY FUNCTIONS FOR TRIGGERS
-- =============================================================================

-- Function to update modified timestamp
CREATE OR REPLACE FUNCTION update_modified_column_indicators()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate JSONB price structure
CREATE OR REPLACE FUNCTION validate_precos_por_ano_jsonb()
RETURNS TRIGGER AS $$
DECLARE
    year_key TEXT;
    price_value NUMERIC;
BEGIN
    -- Check if precos_por_ano is a valid object
    IF jsonb_typeof(NEW.precos_por_ano) != 'object' THEN
        RAISE EXCEPTION 'precos_por_ano deve ser um objeto JSON válido';
    END IF;
    
    -- Check if precos_por_ano is not empty
    IF NEW.precos_por_ano = '{}' THEN
        RAISE EXCEPTION 'precos_por_ano não pode estar vazio';
    END IF;
    
    -- Validate each year/price pair
    FOR year_key IN SELECT jsonb_object_keys(NEW.precos_por_ano)
    LOOP
        -- Validate year format (must be a 4-digit number)
        IF year_key !~ '^\d{4}$' THEN
            RAISE EXCEPTION 'Ano inválido no precos_por_ano: %. Deve ser um ano de 4 dígitos.', year_key;
        END IF;
        
        -- Validate year range
        IF year_key::INTEGER < 2020 OR year_key::INTEGER > 2050 THEN
            RAISE EXCEPTION 'Ano fora do intervalo válido (2020-2050): %', year_key;
        END IF;
        
        -- Validate price value (must be a positive number)
        price_value := (NEW.precos_por_ano->>year_key)::NUMERIC;
        IF price_value IS NULL OR price_value <= 0 THEN
            RAISE EXCEPTION 'Preço inválido para o ano %: %. Deve ser um número positivo.', year_key, price_value;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Function to validate threshold JSONB structure
CREATE OR REPLACE FUNCTION validate_threshold_jsonb()
RETURNS TRIGGER AS $$
DECLARE
    threshold_key TEXT;
    threshold_value NUMERIC;
BEGIN
    -- Check limiares_liquidez
    IF NEW.limiares_liquidez IS NOT NULL THEN
        FOR threshold_key IN SELECT jsonb_object_keys(NEW.limiares_liquidez)
        LOOP
            threshold_value := (NEW.limiares_liquidez->>threshold_key)::NUMERIC;
            IF threshold_value IS NULL OR threshold_value < 0 THEN
                RAISE EXCEPTION 'Limiar de liquidez inválido para %: %. Deve ser um número não negativo.', threshold_key, threshold_value;
            END IF;
        END LOOP;
    END IF;
    
    -- Check limiares_divida_ebitda
    IF NEW.limiares_divida_ebitda IS NOT NULL THEN
        FOR threshold_key IN SELECT jsonb_object_keys(NEW.limiares_divida_ebitda)
        LOOP
            threshold_value := (NEW.limiares_divida_ebitda->>threshold_key)::NUMERIC;
            IF threshold_value IS NULL OR threshold_value < 0 THEN
                RAISE EXCEPTION 'Limiar de dívida/EBITDA inválido para %: %. Deve ser um número não negativo.', threshold_key, threshold_value;
            END IF;
        END LOOP;
    END IF;
    
    -- Check limiares_divida_receita
    IF NEW.limiares_divida_receita IS NOT NULL THEN
        FOR threshold_key IN SELECT jsonb_object_keys(NEW.limiares_divida_receita)
        LOOP
            threshold_value := (NEW.limiares_divida_receita->>threshold_key)::NUMERIC;
            IF threshold_value IS NULL OR threshold_value < 0 OR threshold_value > 1 THEN
                RAISE EXCEPTION 'Limiar de dívida/receita inválido para %: %. Deve ser um número entre 0 e 1.', threshold_key, threshold_value;
            END IF;
        END LOOP;
    END IF;
    
    -- Check limiares_divida_patrimonio
    IF NEW.limiares_divida_patrimonio IS NOT NULL THEN
        FOR threshold_key IN SELECT jsonb_object_keys(NEW.limiares_divida_patrimonio)
        LOOP
            threshold_value := (NEW.limiares_divida_patrimonio->>threshold_key)::NUMERIC;
            IF threshold_value IS NULL OR threshold_value < 0 OR threshold_value > 1 THEN
                RAISE EXCEPTION 'Limiar de dívida/patrimônio inválido para %: %. Deve ser um número entre 0 e 1.', threshold_key, threshold_value;
            END IF;
        END LOOP;
    END IF;
    
    -- Check limiares_ltv
    IF NEW.limiares_ltv IS NOT NULL THEN
        FOR threshold_key IN SELECT jsonb_object_keys(NEW.limiares_ltv)
        LOOP
            threshold_value := (NEW.limiares_ltv->>threshold_key)::NUMERIC;
            IF threshold_value IS NULL OR threshold_value < 0 OR threshold_value > 1 THEN
                RAISE EXCEPTION 'Limiar de LTV inválido para %: %. Deve ser um número entre 0 e 1.', threshold_key, threshold_value;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate sensitivity parameters JSONB
CREATE OR REPLACE FUNCTION validate_sensitivity_parameters_jsonb()
RETURNS TRIGGER AS $$
DECLARE
    param_key TEXT;
    param_value NUMERIC;
BEGIN
    -- Validate variacoes_cambio
    IF NEW.variacoes_cambio IS NOT NULL THEN
        FOR param_key IN SELECT jsonb_object_keys(NEW.variacoes_cambio)
        LOOP
            param_value := (NEW.variacoes_cambio->>param_key)::NUMERIC;
            IF param_value IS NULL OR param_value < -1 OR param_value > 5 THEN
                RAISE EXCEPTION 'Variação de câmbio inválida para %: %. Deve ser entre -100%% e 500%% (-1 a 5).', param_key, param_value;
            END IF;
        END LOOP;
    END IF;
    
    -- Validate variacoes_precos_commodities
    IF NEW.variacoes_precos_commodities IS NOT NULL THEN
        FOR param_key IN SELECT jsonb_object_keys(NEW.variacoes_precos_commodities)
        LOOP
            param_value := (NEW.variacoes_precos_commodities->>param_key)::NUMERIC;
            IF param_value IS NULL OR param_value < -1 OR param_value > 5 THEN
                RAISE EXCEPTION 'Variação de preços de commodities inválida para %: %. Deve ser entre -100%% e 500%% (-1 a 5).', param_key, param_value;
            END IF;
        END LOOP;
    END IF;
    
    -- Validate variacoes_produtividade
    IF NEW.variacoes_produtividade IS NOT NULL THEN
        FOR param_key IN SELECT jsonb_object_keys(NEW.variacoes_produtividade)
        LOOP
            param_value := (NEW.variacoes_produtividade->>param_key)::NUMERIC;
            IF param_value IS NULL OR param_value < -1 OR param_value > 2 THEN
                RAISE EXCEPTION 'Variação de produtividade inválida para %: %. Deve ser entre -100%% e 200%% (-1 a 2).', param_key, param_value;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS FOR COMMODITY PRICE PROJECTIONS
-- =============================================================================

-- Trigger to update timestamp
CREATE TRIGGER trigger_update_commodity_projections_timestamp
    BEFORE UPDATE ON commodity_price_projections
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column_indicators();

-- Trigger to validate JSONB structure
CREATE TRIGGER trigger_validate_commodity_projections_jsonb
    BEFORE INSERT OR UPDATE ON commodity_price_projections
    FOR EACH ROW
    EXECUTE FUNCTION validate_precos_por_ano_jsonb();


-- =============================================================================
-- TRIGGERS FOR COMMODITY PRICE PROJECTIONS ANOS
-- =============================================================================

-- Trigger to update timestamp
CREATE TRIGGER trigger_update_commodity_projections_anos_timestamp
    BEFORE UPDATE ON commodity_price_projections_anos
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column_indicators();

-- =============================================================================
-- TRIGGERS FOR CONFIGURACAO INDICADORES
-- =============================================================================

-- Trigger to update timestamp
CREATE TRIGGER trigger_update_config_indicadores_timestamp
    BEFORE UPDATE ON configuracao_indicadores
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column_indicators();

-- Trigger to validate threshold JSONB
CREATE TRIGGER trigger_validate_config_indicadores_jsonb
    BEFORE INSERT OR UPDATE ON configuracao_indicadores
    FOR EACH ROW
    EXECUTE FUNCTION validate_threshold_jsonb();

-- =============================================================================
-- TRIGGERS FOR PARAMETROS SENSIBILIDADE
-- =============================================================================

-- Trigger to update timestamp
CREATE TRIGGER trigger_update_parametros_sensibilidade_timestamp
    BEFORE UPDATE ON parametros_sensibilidade
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column_indicators();

-- Trigger to validate sensitivity parameters JSONB
CREATE TRIGGER trigger_validate_parametros_sensibilidade_jsonb
    BEFORE INSERT OR UPDATE ON parametros_sensibilidade
    FOR EACH ROW
    EXECUTE FUNCTION validate_sensitivity_parameters_jsonb();


-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION validate_precos_por_ano_jsonb() IS 'Valida estrutura JSONB de preços por ano em commodity_price_projections';
COMMENT ON FUNCTION validate_threshold_jsonb() IS 'Valida estrutura JSONB de limiares de indicadores';
COMMENT ON FUNCTION validate_sensitivity_parameters_jsonb() IS 'Valida parâmetros de análise de sensibilidade em formato JSONB';