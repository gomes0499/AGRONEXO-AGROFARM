-- =============================================================================
-- PATRIMONIO MODULE - TRIGGERS
-- =============================================================================
-- This file contains all triggers for the patrimonio module
-- Handles validation, automated calculations, and data consistency
-- =============================================================================

-- =============================================================================
-- UTILITY FUNCTIONS FOR TRIGGERS
-- =============================================================================

-- Function to update modified timestamp
CREATE OR REPLACE FUNCTION update_modified_column_patrimonio()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-calculate valor_total for investments and asset sales
CREATE OR REPLACE FUNCTION auto_calculate_valor_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-calculate valor_total based on quantidade and valor_unitario
    NEW.valor_total = NEW.quantidade * NEW.valor_unitario;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate year constraints
CREATE OR REPLACE FUNCTION validate_patrimonio_year()
RETURNS TRIGGER AS $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM now());
    table_name TEXT := TG_TABLE_NAME;
BEGIN
    -- Different validation rules for different tables
    IF table_name IN ('aquisicao_terras', 'investimentos', 'vendas_ativos') THEN
        -- Historical data can be from 1900, future data up to current + 10 years
        IF NEW.ano < 1900 OR NEW.ano > (current_year + 10) THEN
            RAISE EXCEPTION 'Ano inválido para %: %. Deve estar entre 1900 e %.', 
                table_name, NEW.ano, (current_year + 10);
        END IF;
    ELSIF table_name = 'planos_investimento' THEN
        -- Investment plans should be for current year or future
        IF NEW.ano < current_year OR NEW.ano > (current_year + 20) THEN
            RAISE EXCEPTION 'Ano inválido para planos de investimento: %. Deve estar entre % e %.', 
                NEW.ano, current_year, (current_year + 20);
        END IF;
    ELSIF table_name = 'maquinas_equipamentos' THEN
        -- Equipment can be historical but not too far in the future
        IF NEW.ano < 1900 OR NEW.ano > (current_year + 5) THEN
            RAISE EXCEPTION 'Ano inválido para equipamento: %. Deve estar entre 1900 e %.', 
                NEW.ano, (current_year + 5);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- Function to validate value consistency
CREATE OR REPLACE FUNCTION validate_patrimonio_values()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure valor_total matches quantidade * valor_unitario (with small tolerance for rounding)
    IF TG_TABLE_NAME IN ('investimentos', 'vendas_ativos', 'planos_investimento') THEN
        IF ABS(NEW.valor_total - (NEW.quantidade * NEW.valor_unitario)) > 0.01 THEN
            RAISE EXCEPTION 'Inconsistência nos valores: valor_total (%) não confere com quantidade (%) × valor_unitario (%)', 
                NEW.valor_total, NEW.quantidade, NEW.valor_unitario;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS FOR AQUISICAO_TERRAS
-- =============================================================================

-- Trigger to update timestamp
CREATE TRIGGER trigger_update_aquisicao_terras_timestamp
    BEFORE UPDATE ON aquisicao_terras
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column_patrimonio();

-- Trigger to validate year
CREATE TRIGGER trigger_validate_aquisicao_terras_year
    BEFORE INSERT OR UPDATE ON aquisicao_terras
    FOR EACH ROW
    EXECUTE FUNCTION validate_patrimonio_year();

-- =============================================================================
-- TRIGGERS FOR INVESTIMENTOS
-- =============================================================================

-- Trigger to update timestamp
CREATE TRIGGER trigger_update_investimentos_timestamp
    BEFORE UPDATE ON investimentos
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column_patrimonio();

-- Trigger to auto-calculate valor_total
CREATE TRIGGER trigger_auto_calculate_investimentos_valor_total
    BEFORE INSERT OR UPDATE ON investimentos
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_valor_total();

-- Trigger to validate year
CREATE TRIGGER trigger_validate_investimentos_year
    BEFORE INSERT OR UPDATE ON investimentos
    FOR EACH ROW
    EXECUTE FUNCTION validate_patrimonio_year();

-- Trigger to validate value consistency
CREATE TRIGGER trigger_validate_investimentos_values
    BEFORE INSERT OR UPDATE ON investimentos
    FOR EACH ROW
    EXECUTE FUNCTION validate_patrimonio_values();

-- =============================================================================
-- TRIGGERS FOR VENDAS_ATIVOS
-- =============================================================================

-- Trigger to update timestamp
CREATE TRIGGER trigger_update_vendas_ativos_timestamp
    BEFORE UPDATE ON vendas_ativos
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column_patrimonio();

-- Trigger to auto-calculate valor_total
CREATE TRIGGER trigger_auto_calculate_vendas_ativos_valor_total
    BEFORE INSERT OR UPDATE ON vendas_ativos
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_valor_total();

-- Trigger to validate year
CREATE TRIGGER trigger_validate_vendas_ativos_year
    BEFORE INSERT OR UPDATE ON vendas_ativos
    FOR EACH ROW
    EXECUTE FUNCTION validate_patrimonio_year();

-- Trigger to validate value consistency
CREATE TRIGGER trigger_validate_vendas_ativos_values
    BEFORE INSERT OR UPDATE ON vendas_ativos
    FOR EACH ROW
    EXECUTE FUNCTION validate_patrimonio_values();

-- =============================================================================
-- TRIGGERS FOR MAQUINAS_EQUIPAMENTOS
-- =============================================================================

-- Trigger to update timestamp
CREATE TRIGGER trigger_update_maquinas_equipamentos_timestamp
    BEFORE UPDATE ON maquinas_equipamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column_patrimonio();

-- Trigger to validate year
CREATE TRIGGER trigger_validate_maquinas_equipamentos_year
    BEFORE INSERT OR UPDATE ON maquinas_equipamentos
    FOR EACH ROW
    EXECUTE FUNCTION validate_patrimonio_year();



-- =============================================================================
-- AUDIT AND NOTIFICATION TRIGGERS
-- =============================================================================


-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION update_modified_column_patrimonio() IS 'Atualiza timestamp de modificação para tabelas do módulo patrimônio';
COMMENT ON FUNCTION auto_calculate_valor_total() IS 'Calcula automaticamente valor_total baseado em quantidade × valor_unitario';
COMMENT ON FUNCTION validate_patrimonio_year() IS 'Valida intervalos de anos permitidos para cada tipo de registro patrimonial';
COMMENT ON FUNCTION validate_patrimonio_values() IS 'Valida consistência entre valores unitários e totais';
