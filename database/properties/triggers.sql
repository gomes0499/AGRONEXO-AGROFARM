-- =============================================================================
-- PROPERTIES MODULE - TRIGGERS
-- =============================================================================
-- This file contains all triggers for the properties module
-- Handles JSONB validation, synchronization, and automated updates
-- =============================================================================

-- =============================================================================
-- UTILITY FUNCTIONS FOR TRIGGERS
-- =============================================================================

-- Function to update modified timestamp
CREATE OR REPLACE FUNCTION update_modified_column_properties()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate JSONB lease cost structure
CREATE OR REPLACE FUNCTION validate_custos_por_ano_jsonb()
RETURNS TRIGGER AS $$
DECLARE
    year_key TEXT;
    cost_data JSONB;
    custo_total NUMERIC;
    custo_hectare NUMERIC;
BEGIN
    -- Check if custos_por_ano is a valid object
    IF jsonb_typeof(NEW.custos_por_ano) != 'object' THEN
        RAISE EXCEPTION 'custos_por_ano deve ser um objeto JSON válido';
    END IF;
    
    -- Check if custos_por_ano is not empty
    IF NEW.custos_por_ano = '{}' THEN
        RAISE EXCEPTION 'custos_por_ano não pode estar vazio';
    END IF;
    
    -- Validate each year/cost pair
    FOR year_key IN SELECT jsonb_object_keys(NEW.custos_por_ano)
    LOOP
        -- Validate year format (must be a 4-digit number)
        IF year_key !~ '^\d{4}$' THEN
            RAISE EXCEPTION 'Ano inválido no custos_por_ano: %. Deve ser um ano de 4 dígitos.', year_key;
        END IF;
        
        -- Validate year range
        IF year_key::INTEGER < 2020 OR year_key::INTEGER > 2050 THEN
            RAISE EXCEPTION 'Ano fora do intervalo válido (2020-2050): %', year_key;
        END IF;
        
        -- Get cost data for this year
        cost_data := NEW.custos_por_ano->year_key;
        
        -- Validate cost data structure
        IF jsonb_typeof(cost_data) != 'object' THEN
            RAISE EXCEPTION 'Dados de custo para o ano % devem ser um objeto JSON válido', year_key;
        END IF;
        
        -- Validate custo_total
        IF cost_data ? 'custo_total' THEN
            custo_total := (cost_data->>'custo_total')::NUMERIC;
            IF custo_total IS NULL OR custo_total <= 0 THEN
                RAISE EXCEPTION 'custo_total inválido para o ano %: %. Deve ser um número positivo.', year_key, custo_total;
            END IF;
        ELSE
            RAISE EXCEPTION 'custo_total é obrigatório para o ano %', year_key;
        END IF;
        
        -- Validate custo_hectare
        IF cost_data ? 'custo_hectare' THEN
            custo_hectare := (cost_data->>'custo_hectare')::NUMERIC;
            IF custo_hectare IS NULL OR custo_hectare <= 0 THEN
                RAISE EXCEPTION 'custo_hectare inválido para o ano %: %. Deve ser um número positivo.', year_key, custo_hectare;
            END IF;
        ELSE
            RAISE EXCEPTION 'custo_hectare é obrigatório para o ano %', year_key;
        END IF;
        
        -- Validate consistency between custo_total and custo_hectare
        IF ABS(custo_total - (custo_hectare * NEW.area_arrendada)) > 0.01 THEN
            RAISE EXCEPTION 'Inconsistência entre custo_total (%) e custo_hectare (%) × area_arrendada (%) para o ano %', 
                custo_total, custo_hectare, NEW.area_arrendada, year_key;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Function to validate property area constraints
CREATE OR REPLACE FUNCTION validate_property_areas()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure cultivated area doesn't exceed total area
    IF NEW.area_cultivada IS NOT NULL AND NEW.area_total IS NOT NULL THEN
        IF NEW.area_cultivada > NEW.area_total THEN
            RAISE EXCEPTION 'Área cultivada (% ha) não pode ser maior que a área total (% ha)', 
                NEW.area_cultivada, NEW.area_total;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate lease area constraints
CREATE OR REPLACE FUNCTION validate_lease_areas()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure leased area doesn't exceed farm area
    IF NEW.area_arrendada > NEW.area_fazenda THEN
        RAISE EXCEPTION 'Área arrendada (% ha) não pode ser maior que a área da fazenda (% ha)', 
            NEW.area_arrendada, NEW.area_fazenda;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Function to auto-calculate lease cost per hectare
CREATE OR REPLACE FUNCTION auto_calculate_lease_cost_hectare()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-calculate custo_hectare if not provided but area_arrendada exists
    IF NEW.custo_hectare IS NULL AND NEW.area_arrendada > 0 THEN
        -- Extract average cost from JSONB if available
        IF NEW.custos_por_ano IS NOT NULL AND NEW.custos_por_ano != '{}' THEN
            SELECT AVG((value->>'custo_hectare')::NUMERIC)
            INTO NEW.custo_hectare
            FROM jsonb_each(NEW.custos_por_ano) AS t(key, value)
            WHERE value ? 'custo_hectare';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS FOR PROPRIEDADES
-- =============================================================================

-- Trigger to update timestamp
CREATE TRIGGER trigger_update_propriedades_timestamp
    BEFORE UPDATE ON propriedades
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column_properties();

-- Trigger to validate area constraints
CREATE TRIGGER trigger_validate_propriedades_areas
    BEFORE INSERT OR UPDATE ON propriedades
    FOR EACH ROW
    EXECUTE FUNCTION validate_property_areas();

-- =============================================================================
-- TRIGGERS FOR ARRENDAMENTOS
-- =============================================================================

-- Trigger to update timestamp
CREATE TRIGGER trigger_update_arrendamentos_timestamp
    BEFORE UPDATE ON arrendamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column_properties();

-- Trigger to validate JSONB structure
CREATE TRIGGER trigger_validate_arrendamentos_jsonb
    BEFORE INSERT OR UPDATE ON arrendamentos
    FOR EACH ROW
    EXECUTE FUNCTION validate_custos_por_ano_jsonb();

-- Trigger to validate area constraints
CREATE TRIGGER trigger_validate_arrendamentos_areas
    BEFORE INSERT OR UPDATE ON arrendamentos
    FOR EACH ROW
    EXECUTE FUNCTION validate_lease_areas();

-- Trigger to auto-calculate cost per hectare
CREATE TRIGGER trigger_auto_calculate_arrendamentos_custo_hectare
    BEFORE INSERT OR UPDATE ON arrendamentos
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_lease_cost_hectare();

-- Trigger to synchronize with normalized table


-- =============================================================================
-- TRIGGERS FOR BENFEITORIAS
-- =============================================================================

-- Trigger to update timestamp
CREATE TRIGGER trigger_update_benfeitorias_timestamp
    BEFORE UPDATE ON benfeitorias
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column_properties();


-- =============================================================================
-- AUDIT AND NOTIFICATION TRIGGERS
-- =============================================================================


-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION validate_custos_por_ano_jsonb() IS 'Valida estrutura JSONB de custos por ano em arrendamentos';
COMMENT ON FUNCTION validate_property_areas() IS 'Valida consistência entre área total e área cultivada';
COMMENT ON FUNCTION validate_lease_areas() IS 'Valida consistência entre área da fazenda e área arrendada';
COMMENT ON FUNCTION auto_calculate_lease_cost_hectare() IS 'Calcula automaticamente custo por hectare baseado nos dados JSONB';
