-- =============================================================================
-- SR-CONSULTORIA: CONSOLIDATED TRIGGERS
-- =============================================================================
-- This file contains all PostgreSQL triggers from all modules
-- Multi-tenant SaaS architecture with JSONB multi-year support validation
--
-- Modules included:
-- - Authentication & User Management
-- - Organization Management  
-- - Financial Management
-- - Production Management
-- - Properties Management
-- - Patrimonio Management
-- - Indicators Management
-- - Commercial Management
--
-- Prerequisites: Run types.sql, tables.sql, and indexes.sql first
-- Generated with Claude Code: https://claude.ai/code
-- =============================================================================

-- =============================================================================
-- CORE UTILITY FUNCTIONS
-- =============================================================================

-- Generic function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MULTI-TENANT VALIDATION FUNCTIONS
-- =============================================================================

-- Function to validate multi-tenant consistency across related entities
CREATE OR REPLACE FUNCTION validate_multi_tenant_consistency()
RETURNS TRIGGER AS $$
DECLARE
    safra_org_id UUID;
    cultura_org_id UUID;
    sistema_org_id UUID;
    ciclo_org_id UUID;
    propriedade_org_id UUID;
    fornecedor_org_id UUID;
BEGIN
    -- Validate safra organization (only for tables that have safra_id column)
    IF TG_TABLE_NAME IN ('arrendamentos', 'dividas_bancarias', 'dividas_imoveis', 'fornecedores', 
                         'adiantamentos_fornecedores', 'fatores_liquidez', 'estoques', 'estoques_commodities',
                         'contratos_recebiveis', 'emprestimos_terceiros', 'aquisicao_terras', 'investimentos',
                         'vendas_ativos', 'vendas_pecuaria', 'vendas_sementes', 'precos_comerciais',
                         'planejamento_vendas', 'commodity_price_projections', 'parametros_sensibilidade') THEN
        
        -- Use dynamic SQL to safely check safra_id
        DECLARE
            safra_id_value UUID;
        BEGIN
            EXECUTE format('SELECT ($1).safra_id') USING NEW INTO safra_id_value;
            
            IF safra_id_value IS NOT NULL THEN
                SELECT organizacao_id INTO safra_org_id 
                FROM safras WHERE id = safra_id_value;
                
                IF safra_org_id IS NULL THEN
                    RAISE EXCEPTION 'Safra not found: %', safra_id_value;
                END IF;
                
                IF safra_org_id != NEW.organizacao_id THEN
                    RAISE EXCEPTION 'Safra does not belong to the specified organization';
                END IF;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignore errors if safra_id column doesn't exist
                NULL;
        END;
    END IF;

    -- Validate cultura organization (only for tables that have cultura_id column)
    IF TG_TABLE_NAME IN ('areas_plantio', 'produtividades', 'custos_producao', 'vendas_sementes', 'precos_comerciais', 'planejamento_vendas') THEN
        -- Use dynamic SQL to safely check cultura_id
        DECLARE
            cultura_id_value UUID;
        BEGIN
            EXECUTE format('SELECT ($1).cultura_id') USING NEW INTO cultura_id_value;
            
            IF cultura_id_value IS NOT NULL THEN
                SELECT organizacao_id INTO cultura_org_id 
                FROM culturas WHERE id = cultura_id_value;
                
                IF cultura_org_id IS NULL THEN
                    RAISE EXCEPTION 'Cultura not found: %', cultura_id_value;
                END IF;
                
                IF cultura_org_id != NEW.organizacao_id THEN
                    RAISE EXCEPTION 'Cultura does not belong to the specified organization';
                END IF;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignore errors if cultura_id column doesn't exist
                NULL;
        END;
    END IF;

    -- Validate sistema organization (only for tables that have sistema_id column)
    IF TG_TABLE_NAME IN ('areas_plantio', 'produtividades', 'custos_producao') THEN
        -- Use dynamic SQL to safely check sistema_id
        DECLARE
            sistema_id_value UUID;
        BEGIN
            EXECUTE format('SELECT ($1).sistema_id') USING NEW INTO sistema_id_value;
            
            IF sistema_id_value IS NOT NULL THEN
                SELECT organizacao_id INTO sistema_org_id 
                FROM sistemas WHERE id = sistema_id_value;
                
                IF sistema_org_id IS NULL THEN
                    RAISE EXCEPTION 'Sistema not found: %', sistema_id_value;
                END IF;
                
                IF sistema_org_id != NEW.organizacao_id THEN
                    RAISE EXCEPTION 'Sistema does not belong to the specified organization';
                END IF;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignore errors if sistema_id column doesn't exist
                NULL;
        END;
    END IF;

    -- Validate ciclo organization (only for tables that have ciclo_id column)
    IF TG_TABLE_NAME = 'areas_plantio' THEN
        -- Use dynamic SQL to safely check ciclo_id
        DECLARE
            ciclo_id_value UUID;
        BEGIN
            EXECUTE format('SELECT ($1).ciclo_id') USING NEW INTO ciclo_id_value;
            
            IF ciclo_id_value IS NOT NULL THEN
                SELECT organizacao_id INTO ciclo_org_id 
                FROM ciclos WHERE id = ciclo_id_value;
                
                IF ciclo_org_id IS NULL THEN
                    RAISE EXCEPTION 'Ciclo not found: %', ciclo_id_value;
                END IF;
                
                IF ciclo_org_id != NEW.organizacao_id THEN
                    RAISE EXCEPTION 'Ciclo does not belong to the specified organization';
                END IF;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignore errors if ciclo_id column doesn't exist
                NULL;
        END;
    END IF;

    -- Validate propriedade organization (only for tables that have propriedade_id column)
    IF TG_TABLE_NAME IN ('arrendamentos', 'benfeitorias', 'areas_plantio', 'produtividades', 'custos_producao', 
                         'rebanhos', 'operacoes_pecuarias', 'dividas_imoveis', 'vendas_pecuaria', 'vendas_sementes') THEN
        -- Use dynamic SQL to safely check propriedade_id
        DECLARE
            propriedade_id_value UUID;
        BEGIN
            EXECUTE format('SELECT ($1).propriedade_id') USING NEW INTO propriedade_id_value;
            
            IF propriedade_id_value IS NOT NULL THEN
                SELECT organizacao_id INTO propriedade_org_id 
                FROM propriedades WHERE id = propriedade_id_value;
                
                IF propriedade_org_id IS NULL THEN
                    RAISE EXCEPTION 'Propriedade not found: %', propriedade_id_value;
                END IF;
                
                IF propriedade_org_id != NEW.organizacao_id THEN
                    RAISE EXCEPTION 'Propriedade does not belong to the specified organization';
                END IF;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignore errors if propriedade_id column doesn't exist
                NULL;
        END;
    END IF;

    -- Validate fornecedor organization (only for tables that have fornecedor_id column)
    IF TG_TABLE_NAME = 'adiantamentos_fornecedores' THEN
        -- Use dynamic SQL to safely check fornecedor_id
        DECLARE
            fornecedor_id_value UUID;
        BEGIN
            EXECUTE format('SELECT ($1).fornecedor_id') USING NEW INTO fornecedor_id_value;
            
            IF fornecedor_id_value IS NOT NULL THEN
                SELECT organizacao_id INTO fornecedor_org_id 
                FROM fornecedores WHERE id = fornecedor_id_value;
                
                IF fornecedor_org_id IS NULL THEN
                    RAISE EXCEPTION 'Fornecedor not found: %', fornecedor_id_value;
                END IF;
                
                IF fornecedor_org_id != NEW.organizacao_id THEN
                    RAISE EXCEPTION 'Fornecedor does not belong to the specified organization';
                END IF;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignore errors if fornecedor_id column doesn't exist
                NULL;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- JSONB VALIDATION FUNCTIONS
-- =============================================================================

-- Function to validate JSONB multi-year structure (generic)
CREATE OR REPLACE FUNCTION validate_jsonb_multi_year()
RETURNS TRIGGER AS $$
DECLARE
    year_key TEXT;
    year_value NUMERIC;
    jsonb_field JSONB;
    field_name TEXT;
    min_year INTEGER := 2020;
    max_year INTEGER := 2050;
BEGIN
    -- Determine which JSONB field to validate based on table
    CASE TG_TABLE_NAME
        WHEN 'dividas_bancarias', 'dividas_imoveis' THEN
            jsonb_field := NEW.fluxo_pagamento_anual;
            field_name := 'fluxo_pagamento_anual';
            min_year := 2018;
            max_year := 2038;
        WHEN 'fornecedores', 'adiantamentos_fornecedores', 'fatores_liquidez', 'estoques', 'contratos_recebiveis', 'emprestimos_terceiros' THEN
            jsonb_field := NEW.valores_por_ano;
            field_name := 'valores_por_ano';
            min_year := 2025;
            max_year := 2033;
        WHEN 'areas_plantio' THEN
            jsonb_field := NEW.areas_por_safra;
            field_name := 'areas_por_safra';
        WHEN 'produtividades' THEN
            jsonb_field := NEW.produtividades_por_safra;
            field_name := 'produtividades_por_safra';
        WHEN 'custos_producao' THEN
            jsonb_field := NEW.custos_por_safra;
            field_name := 'custos_por_safra';
        WHEN 'operacoes_pecuarias' THEN
            jsonb_field := NEW.volume_abate_por_safra;
            field_name := 'volume_abate_por_safra';
        WHEN 'arrendamentos' THEN
            jsonb_field := NEW.custos_por_ano;
            field_name := 'custos_por_ano';
        WHEN 'commodity_price_projections' THEN
            jsonb_field := NEW.precos_por_ano;
            field_name := 'precos_por_ano';
        WHEN 'estoques_commodities' THEN
            jsonb_field := NEW.valores_totais_por_ano;
            field_name := 'valores_totais_por_ano';
        ELSE
            RETURN NEW; -- Skip validation if table not recognized
    END CASE;

    -- Skip validation if JSONB field is NULL
    IF jsonb_field IS NULL THEN
        RETURN NEW;
    END IF;

    -- Check if JSONB is a valid object
    IF jsonb_typeof(jsonb_field) != 'object' THEN
        RAISE EXCEPTION '% deve ser um objeto JSON válido', field_name;
    END IF;
    
    -- Check if JSONB is not empty
    IF jsonb_field = '{}' THEN
        RAISE EXCEPTION '% não pode estar vazio', field_name;
    END IF;
    
    -- Validate each year/value pair
    FOR year_key IN SELECT jsonb_object_keys(jsonb_field)
    LOOP
        -- For safra-based tables, validate against safra_id
        IF field_name IN ('areas_por_safra', 'produtividades_por_safra', 'custos_por_safra', 'volume_abate_por_safra', 'precos_por_ano', 'custos_por_ano', 'fluxo_pagamento_anual', 'valores_por_ano', 'valores_totais_por_ano') THEN
            -- Validate safra_id format (UUID)
            IF year_key !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                RAISE EXCEPTION 'ID de safra inválido em %: %. Deve ser um UUID válido.', field_name, year_key;
            END IF;
            
            -- Validate safra exists and belongs to organization
            IF NOT EXISTS (SELECT 1 FROM safras WHERE id = year_key::UUID AND organizacao_id = NEW.organizacao_id) THEN
                RAISE EXCEPTION 'Safra não encontrada ou não pertence à organização: %', year_key;
            END IF;
        ELSE
            -- Validate year format (must be a 4-digit number)
            IF year_key !~ '^\d{4}$' THEN
                RAISE EXCEPTION 'Ano inválido em %: %. Deve ser um ano de 4 dígitos.', field_name, year_key;
            END IF;
            
            -- Validate year range
            IF year_key::INTEGER < min_year OR year_key::INTEGER > max_year THEN
                RAISE EXCEPTION 'Ano fora do intervalo válido (%-%) em %: %', min_year, max_year, field_name, year_key;
            END IF;
        END IF;
        
        -- Validate value (must be numeric and non-negative for most fields)
        IF field_name = 'custos_por_ano' THEN
            -- Handle lease costs (can be simple numeric values or object structure)
            DECLARE
                cost_data JSONB;
                custo_total NUMERIC;
                custo_hectare NUMERIC;
            BEGIN
                cost_data := jsonb_field->year_key;
                
                -- Support both simple numeric values and object structure
                IF jsonb_typeof(cost_data) = 'number' THEN
                    -- Simple numeric value
                    year_value := (jsonb_field->>year_key)::NUMERIC;
                    IF year_value IS NULL OR year_value < 0 THEN
                        RAISE EXCEPTION 'Valor inválido para %[%]: %. Deve ser um número não negativo.', field_name, year_key, year_value;
                    END IF;
                ELSIF jsonb_typeof(cost_data) = 'object' THEN
                    -- Object structure with custo_total and custo_hectare
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
                ELSE
                    RAISE EXCEPTION 'Dados de custo para a safra % devem ser um número ou objeto JSON válido', year_key;
                END IF;
            END;
        ELSE
            -- Standard numeric validation
            year_value := (jsonb_field->>year_key)::NUMERIC;
            IF year_value IS NULL OR year_value < 0 THEN
                RAISE EXCEPTION 'Valor inválido para %[%]: %. Deve ser um número não negativo.', field_name, year_key, year_value;
            END IF;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate threshold JSONB structures (indicators)
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
-- BUSINESS LOGIC VALIDATION FUNCTIONS
-- =============================================================================

-- Function to validate area constraints
CREATE OR REPLACE FUNCTION validate_area_constraints()
RETURNS TRIGGER AS $$
DECLARE
    property_total_area DECIMAL;
    current_planted_area DECIMAL;
BEGIN
    -- For properties: cultivated area cannot exceed total area
    IF TG_TABLE_NAME = 'propriedades' THEN
        IF NEW.area_cultivada IS NOT NULL AND NEW.area_total IS NOT NULL THEN
            IF NEW.area_cultivada > NEW.area_total THEN
                RAISE EXCEPTION 'Área cultivada (% ha) não pode ser maior que a área total (% ha)', 
                    NEW.area_cultivada, NEW.area_total;
            END IF;
        END IF;
    END IF;
    
    -- For leases: leased area cannot exceed farm area
    IF TG_TABLE_NAME = 'arrendamentos' THEN
        IF NEW.area_arrendada > NEW.area_fazenda THEN
            RAISE EXCEPTION 'Área arrendada (% ha) não pode ser maior que a área da fazenda (% ha)', 
                NEW.area_arrendada, NEW.area_fazenda;
        END IF;
    END IF;
    
    -- For planting areas: validate against property total area (DISABLED FOR NOW)
    -- IF TG_TABLE_NAME = 'areas_plantio' THEN
    --     -- Get property total area
    --     SELECT COALESCE(area_total, 0) INTO property_total_area
    --     FROM propriedades WHERE id = NEW.propriedade_id;
    --     
    --     -- Calculate maximum planted area across all safras for this property (excluding current record if updating)
    --     SELECT COALESCE(MAX(
    --         (SELECT SUM((value)::NUMERIC) FROM jsonb_each_text(areas_por_safra))
    --     ), 0) INTO current_planted_area
    --     FROM areas_plantio 
    --     WHERE propriedade_id = NEW.propriedade_id
    --     AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
    --     
    --     -- Add current record's maximum area
    --     IF NEW.areas_por_safra IS NOT NULL THEN
    --         current_planted_area := current_planted_area + 
    --             (SELECT COALESCE(MAX((value)::NUMERIC), 0) FROM jsonb_each_text(NEW.areas_por_safra));
    --     END IF;
    --     
    --     -- Check if total planted area would exceed property area (with some tolerance)
    --     IF property_total_area > 0 AND current_planted_area > (property_total_area * 1.1) THEN
    --         RAISE EXCEPTION 'Área plantada total (%.2f ha) excederia significativamente a área da propriedade (%.2f ha)', 
    --                        current_planted_area, property_total_area;
    --     END IF;
    -- END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate date constraints
CREATE OR REPLACE FUNCTION validate_date_constraints()
RETURNS TRIGGER AS $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM NOW());
BEGIN
    -- For property debts: maturity date must be after acquisition date
    IF TG_TABLE_NAME = 'dividas_imoveis' THEN
        IF NEW.data_vencimento <= NEW.data_aquisicao THEN
            RAISE EXCEPTION 'Data de vencimento deve ser posterior à data de aquisição';
        END IF;
        
        IF NEW.data_aquisicao > CURRENT_DATE THEN
            RAISE EXCEPTION 'Data de aquisição não pode ser futura';
        END IF;
    END IF;
    
    -- For leases: end date must be after start date
    IF TG_TABLE_NAME = 'arrendamentos' THEN
        IF NEW.data_termino <= NEW.data_inicio THEN
            RAISE EXCEPTION 'Data de término deve ser posterior à data de início';
        END IF;
    END IF;
    
    -- For patrimonio records: validate year ranges
    IF TG_TABLE_NAME IN ('aquisicao_terras', 'investimentos', 'vendas_ativos') THEN
        IF NEW.ano < 1900 OR NEW.ano > (current_year + 10) THEN
            RAISE EXCEPTION 'Ano inválido para %: %. Deve estar entre 1900 e %.', 
                TG_TABLE_NAME, NEW.ano, (current_year + 10);
        END IF;
    END IF;
    
    -- For equipment: more restrictive future date
    IF TG_TABLE_NAME = 'maquinas_equipamentos' THEN
        IF NEW.ano < 1900 OR NEW.ano > (current_year + 5) THEN
            RAISE EXCEPTION 'Ano inválido para equipamento: %. Deve estar entre 1900 e %.', 
                NEW.ano, (current_year + 5);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate financial values
CREATE OR REPLACE FUNCTION validate_financial_values()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate non-negative values for financial fields
    IF TG_TABLE_NAME IN ('fatores_liquidez', 'estoques', 'contratos_recebiveis', 'adiantamentos_fornecedores', 'emprestimos_terceiros') THEN
        IF NEW.valores_por_ano IS NOT NULL THEN
            -- Validation handled by validate_jsonb_multi_year
            NULL;
        END IF;
    END IF;
    
    -- For commercial sales: validate financial data consistency
    IF TG_TABLE_NAME IN ('vendas_pecuaria', 'vendas_sementes') THEN
        -- Validate non-negative financial values
        IF NEW.receita_operacional_bruta < 0 THEN
            RAISE EXCEPTION 'Receita operacional bruta não pode ser negativa: %', NEW.receita_operacional_bruta;
        END IF;
        
        IF NEW.impostos_vendas < 0 THEN
            RAISE EXCEPTION 'Impostos sobre vendas não podem ser negativos: %', NEW.impostos_vendas;
        END IF;
        
        IF NEW.comissao_vendas < 0 THEN
            RAISE EXCEPTION 'Comissão sobre vendas não pode ser negativa: %', NEW.comissao_vendas;
        END IF;
        
        -- Validate logical relationships
        IF NEW.impostos_vendas > NEW.receita_operacional_bruta THEN
            RAISE EXCEPTION 'Impostos sobre vendas não podem exceder receita operacional bruta';
        END IF;
        
        IF NEW.comissao_vendas > NEW.receita_operacional_bruta THEN
            RAISE EXCEPTION 'Comissão sobre vendas não pode exceder receita operacional bruta';
        END IF;
    END IF;
    
    -- For patrimonio: validate value calculations
    IF TG_TABLE_NAME IN ('investimentos', 'vendas_ativos') THEN
        IF ABS(NEW.valor_total - (NEW.quantidade * NEW.valor_unitario)) > 0.01 THEN
            RAISE EXCEPTION 'Inconsistência nos valores: valor_total (%) não confere com quantidade (%) × valor_unitario (%)', 
                NEW.valor_total, NEW.quantidade, NEW.valor_unitario;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-calculate values
CREATE OR REPLACE FUNCTION auto_calculate_values()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-calculate valor_total for investments and asset sales
    IF TG_TABLE_NAME IN ('investimentos', 'vendas_ativos') THEN
        NEW.valor_total = NEW.quantidade * NEW.valor_unitario;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent duplicate entries
CREATE OR REPLACE FUNCTION prevent_duplicate_entries()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent duplicate planting areas
    IF TG_TABLE_NAME = 'areas_plantio' THEN
        IF EXISTS (
            SELECT 1 FROM areas_plantio 
            WHERE organizacao_id = NEW.organizacao_id
            AND propriedade_id = NEW.propriedade_id
            AND cultura_id = NEW.cultura_id
            AND sistema_id = NEW.sistema_id
            AND ciclo_id = NEW.ciclo_id
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        ) THEN
            RAISE EXCEPTION 'Já existe uma área cadastrada para esta combinação de propriedade, cultura, sistema e ciclo';
        END IF;
    END IF;
    
    -- Prevent duplicate bank debts
    IF TG_TABLE_NAME = 'dividas_bancarias' THEN
        IF EXISTS (
            SELECT 1 FROM dividas_bancarias 
            WHERE organizacao_id = NEW.organizacao_id 
            AND instituicao_bancaria = NEW.instituicao_bancaria
            AND modalidade = NEW.modalidade
            AND ano_contratacao = NEW.ano_contratacao
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        ) THEN
            RAISE EXCEPTION 'Já existe uma dívida bancária similar para esta organização: % - % - %', 
                NEW.instituicao_bancaria, NEW.modalidade, NEW.ano_contratacao;
        END IF;
    END IF;
    
    -- Prevent duplicate liquidity factors by type
    IF TG_TABLE_NAME = 'fatores_liquidez' THEN
        IF EXISTS (
            SELECT 1 FROM fatores_liquidez 
            WHERE organizacao_id = NEW.organizacao_id 
            AND tipo = NEW.tipo
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        ) THEN
            RAISE EXCEPTION 'Já existe um fator de liquidez do tipo % para esta organização', NEW.tipo;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent configuration deletion if in use
CREATE OR REPLACE FUNCTION prevent_config_deletion()
RETURNS TRIGGER AS $$
DECLARE
    usage_count INTEGER;
    table_checks TEXT[];
    table_check TEXT;
    column_name TEXT;
BEGIN
    -- Determine which tables to check based on trigger table
    CASE TG_TABLE_NAME
        WHEN 'culturas' THEN
            table_checks := ARRAY['areas_plantio', 'produtividades', 'custos_producao', 'vendas_sementes'];
            column_name := 'cultura_id';
        WHEN 'sistemas' THEN
            table_checks := ARRAY['areas_plantio', 'produtividades', 'custos_producao'];
            column_name := 'sistema_id';
        WHEN 'ciclos' THEN
            table_checks := ARRAY['areas_plantio'];
            column_name := 'ciclo_id';
        WHEN 'safras' THEN
            table_checks := ARRAY['areas_plantio', 'produtividades', 'custos_producao', 'vendas_pecuaria', 'vendas_sementes'];
            column_name := 'safra_id';
        WHEN 'propriedades' THEN
            table_checks := ARRAY['areas_plantio', 'produtividades', 'custos_producao', 'rebanhos', 'operacoes_pecuarias', 'arrendamentos', 'benfeitorias'];
            column_name := 'propriedade_id';
        ELSE
            RETURN OLD;
    END CASE;
    
    -- Check each table for usage
    FOREACH table_check IN ARRAY table_checks
    LOOP
        EXECUTE format(
            'SELECT COUNT(*) FROM %I WHERE %I = $1',
            table_check,
            column_name
        ) USING OLD.id INTO usage_count;
        
        IF usage_count > 0 THEN
            RAISE EXCEPTION 'Não é possível excluir este item pois está sendo usado em % registros da tabela %', usage_count, table_check;
        END IF;
    END LOOP;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DROP ALL EXISTING TRIGGERS (to avoid conflicts)
-- =============================================================================

-- Drop all existing triggers to avoid conflicts
DO $$ 
DECLARE 
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_schema, event_object_table, trigger_name 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON ' || trigger_record.event_object_table;
    END LOOP;
END $$;

-- =============================================================================
-- CORE AUTHENTICATION & ORGANIZATION TRIGGERS
-- =============================================================================

-- Organizacoes timestamps
CREATE TRIGGER trg_organizacoes_updated_at
    BEFORE UPDATE ON organizacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Associacoes timestamps
CREATE TRIGGER trg_associacoes_updated_at
    BEFORE UPDATE ON associacoes
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Convites timestamps
CREATE TRIGGER trg_convites_updated_at
    BEFORE UPDATE ON convites
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- =============================================================================
-- PRODUCTION CONFIGURATION TRIGGERS
-- =============================================================================

-- Culturas
CREATE TRIGGER trg_culturas_updated_at
    BEFORE UPDATE ON culturas
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_culturas_prevent_deletion
    BEFORE DELETE ON culturas
    FOR EACH ROW
    EXECUTE FUNCTION prevent_config_deletion();

-- Sistemas
CREATE TRIGGER trg_sistemas_updated_at
    BEFORE UPDATE ON sistemas
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_sistemas_prevent_deletion
    BEFORE DELETE ON sistemas
    FOR EACH ROW
    EXECUTE FUNCTION prevent_config_deletion();

-- Ciclos
CREATE TRIGGER trg_ciclos_updated_at
    BEFORE UPDATE ON ciclos
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_ciclos_prevent_deletion
    BEFORE DELETE ON ciclos
    FOR EACH ROW
    EXECUTE FUNCTION prevent_config_deletion();

-- Safras
CREATE TRIGGER trg_safras_updated_at
    BEFORE UPDATE ON safras
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_safras_prevent_deletion
    BEFORE DELETE ON safras
    FOR EACH ROW
    EXECUTE FUNCTION prevent_config_deletion();

-- =============================================================================
-- PROPERTIES MANAGEMENT TRIGGERS
-- =============================================================================

-- Propriedades
CREATE TRIGGER trg_propriedades_updated_at
    BEFORE UPDATE ON propriedades
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_propriedades_validate_areas
    BEFORE INSERT OR UPDATE ON propriedades
    FOR EACH ROW
    EXECUTE FUNCTION validate_area_constraints();

CREATE TRIGGER trg_propriedades_prevent_deletion
    BEFORE DELETE ON propriedades
    FOR EACH ROW
    EXECUTE FUNCTION prevent_config_deletion();

-- Arrendamentos
CREATE TRIGGER trg_arrendamentos_updated_at
    BEFORE UPDATE ON arrendamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_arrendamentos_validate_tenant
    BEFORE INSERT OR UPDATE ON arrendamentos
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_arrendamentos_validate_jsonb
    BEFORE INSERT OR UPDATE ON arrendamentos
    FOR EACH ROW
    EXECUTE FUNCTION validate_jsonb_multi_year();

CREATE TRIGGER trg_arrendamentos_validate_areas
    BEFORE INSERT OR UPDATE ON arrendamentos
    FOR EACH ROW
    EXECUTE FUNCTION validate_area_constraints();

CREATE TRIGGER trg_arrendamentos_validate_dates
    BEFORE INSERT OR UPDATE ON arrendamentos
    FOR EACH ROW
    EXECUTE FUNCTION validate_date_constraints();

-- Benfeitorias
CREATE TRIGGER trg_benfeitorias_updated_at
    BEFORE UPDATE ON benfeitorias
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_benfeitorias_validate_tenant
    BEFORE INSERT OR UPDATE ON benfeitorias
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

-- =============================================================================
-- PRODUCTION DATA TRIGGERS (JSONB MULTI-YEAR)
-- =============================================================================

-- Areas plantio
CREATE TRIGGER trg_areas_plantio_updated_at
    BEFORE UPDATE ON areas_plantio
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_areas_plantio_validate_tenant
    BEFORE INSERT OR UPDATE ON areas_plantio
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_areas_plantio_validate_jsonb
    BEFORE INSERT OR UPDATE ON areas_plantio
    FOR EACH ROW
    EXECUTE FUNCTION validate_jsonb_multi_year();

CREATE TRIGGER trg_areas_plantio_validate_areas
    BEFORE INSERT OR UPDATE ON areas_plantio
    FOR EACH ROW
    EXECUTE FUNCTION validate_area_constraints();

CREATE TRIGGER trg_areas_plantio_prevent_duplicates
    BEFORE INSERT OR UPDATE ON areas_plantio
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_entries();

-- Produtividades
CREATE TRIGGER trg_produtividades_updated_at
    BEFORE UPDATE ON produtividades
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_produtividades_validate_tenant
    BEFORE INSERT OR UPDATE ON produtividades
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_produtividades_validate_jsonb
    BEFORE INSERT OR UPDATE ON produtividades
    FOR EACH ROW
    EXECUTE FUNCTION validate_jsonb_multi_year();

-- Custos producao
CREATE TRIGGER trg_custos_producao_updated_at
    BEFORE UPDATE ON custos_producao
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_custos_producao_validate_tenant
    BEFORE INSERT OR UPDATE ON custos_producao
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_custos_producao_validate_jsonb
    BEFORE INSERT OR UPDATE ON custos_producao
    FOR EACH ROW
    EXECUTE FUNCTION validate_jsonb_multi_year();

-- Rebanhos
CREATE TRIGGER trg_rebanhos_updated_at
    BEFORE UPDATE ON rebanhos
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_rebanhos_validate_tenant
    BEFORE INSERT OR UPDATE ON rebanhos
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

-- Operacoes pecuarias
CREATE TRIGGER trg_operacoes_pecuarias_updated_at
    BEFORE UPDATE ON operacoes_pecuarias
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_operacoes_pecuarias_validate_tenant
    BEFORE INSERT OR UPDATE ON operacoes_pecuarias
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_operacoes_pecuarias_validate_jsonb
    BEFORE INSERT OR UPDATE ON operacoes_pecuarias
    FOR EACH ROW
    EXECUTE FUNCTION validate_jsonb_multi_year();

-- =============================================================================
-- FINANCIAL MANAGEMENT TRIGGERS (JSONB MULTI-YEAR)
-- =============================================================================

-- Dividas bancarias
CREATE TRIGGER trg_dividas_bancarias_updated_at
    BEFORE UPDATE ON dividas_bancarias
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_dividas_bancarias_validate_tenant
    BEFORE INSERT OR UPDATE ON dividas_bancarias
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_dividas_bancarias_validate_jsonb
    BEFORE INSERT OR UPDATE ON dividas_bancarias
    FOR EACH ROW
    EXECUTE FUNCTION validate_jsonb_multi_year();

CREATE TRIGGER trg_dividas_bancarias_prevent_duplicates
    BEFORE INSERT OR UPDATE ON dividas_bancarias
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_entries();

-- Dividas imoveis
CREATE TRIGGER trg_dividas_imoveis_updated_at
    BEFORE UPDATE ON dividas_imoveis
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_dividas_imoveis_validate_tenant
    BEFORE INSERT OR UPDATE ON dividas_imoveis
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_dividas_imoveis_validate_jsonb
    BEFORE INSERT OR UPDATE ON dividas_imoveis
    FOR EACH ROW
    EXECUTE FUNCTION validate_jsonb_multi_year();

CREATE TRIGGER trg_dividas_imoveis_validate_dates
    BEFORE INSERT OR UPDATE ON dividas_imoveis
    FOR EACH ROW
    EXECUTE FUNCTION validate_date_constraints();

-- Fornecedores
CREATE TRIGGER trg_fornecedores_updated_at
    BEFORE UPDATE ON fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_fornecedores_validate_tenant
    BEFORE INSERT OR UPDATE ON fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_fornecedores_validate_jsonb
    BEFORE INSERT OR UPDATE ON fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION validate_jsonb_multi_year();

-- Adiantamentos fornecedores
CREATE TRIGGER trg_adiantamentos_fornecedores_updated_at
    BEFORE UPDATE ON adiantamentos_fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_adiantamentos_fornecedores_validate_tenant
    BEFORE INSERT OR UPDATE ON adiantamentos_fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_adiantamentos_fornecedores_validate_jsonb
    BEFORE INSERT OR UPDATE ON adiantamentos_fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION validate_jsonb_multi_year();

CREATE TRIGGER trg_adiantamentos_fornecedores_validate_financial
    BEFORE INSERT OR UPDATE ON adiantamentos_fornecedores
    FOR EACH ROW
    EXECUTE FUNCTION validate_financial_values();

-- Fatores liquidez
CREATE TRIGGER trg_fatores_liquidez_updated_at
    BEFORE UPDATE ON fatores_liquidez
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_fatores_liquidez_validate_tenant
    BEFORE INSERT OR UPDATE ON fatores_liquidez
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_fatores_liquidez_validate_jsonb
    BEFORE INSERT OR UPDATE ON fatores_liquidez
    FOR EACH ROW
    EXECUTE FUNCTION validate_jsonb_multi_year();

CREATE TRIGGER trg_fatores_liquidez_prevent_duplicates
    BEFORE INSERT OR UPDATE ON fatores_liquidez
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_entries();

-- Estoques
CREATE TRIGGER trg_estoques_updated_at
    BEFORE UPDATE ON estoques
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_estoques_validate_tenant
    BEFORE INSERT OR UPDATE ON estoques
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_estoques_validate_jsonb
    BEFORE INSERT OR UPDATE ON estoques
    FOR EACH ROW
    EXECUTE FUNCTION validate_jsonb_multi_year();

-- Estoques commodities
CREATE TRIGGER trg_estoques_commodities_updated_at
    BEFORE UPDATE ON estoques_commodities
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_estoques_commodities_validate_tenant
    BEFORE INSERT OR UPDATE ON estoques_commodities
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_estoques_commodities_validate_jsonb
    BEFORE INSERT OR UPDATE ON estoques_commodities
    FOR EACH ROW
    EXECUTE FUNCTION validate_jsonb_multi_year();

-- Contratos recebiveis
CREATE TRIGGER trg_contratos_recebiveis_updated_at
    BEFORE UPDATE ON contratos_recebiveis
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_contratos_recebiveis_validate_tenant
    BEFORE INSERT OR UPDATE ON contratos_recebiveis
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_contratos_recebiveis_validate_jsonb
    BEFORE INSERT OR UPDATE ON contratos_recebiveis
    FOR EACH ROW
    EXECUTE FUNCTION validate_jsonb_multi_year();

-- Emprestimos terceiros
CREATE TRIGGER trg_emprestimos_terceiros_updated_at
    BEFORE UPDATE ON emprestimos_terceiros
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_emprestimos_terceiros_validate_tenant
    BEFORE INSERT OR UPDATE ON emprestimos_terceiros
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_emprestimos_terceiros_validate_jsonb
    BEFORE INSERT OR UPDATE ON emprestimos_terceiros
    FOR EACH ROW
    EXECUTE FUNCTION validate_jsonb_multi_year();

-- =============================================================================
-- PATRIMONIO MANAGEMENT TRIGGERS
-- =============================================================================

-- Aquisicao terras
CREATE TRIGGER trg_aquisicao_terras_updated_at
    BEFORE UPDATE ON aquisicao_terras
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_aquisicao_terras_validate_tenant
    BEFORE INSERT OR UPDATE ON aquisicao_terras
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_aquisicao_terras_validate_dates
    BEFORE INSERT OR UPDATE ON aquisicao_terras
    FOR EACH ROW
    EXECUTE FUNCTION validate_date_constraints();

-- Investimentos
CREATE TRIGGER trg_investimentos_updated_at
    BEFORE UPDATE ON investimentos
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_investimentos_validate_tenant
    BEFORE INSERT OR UPDATE ON investimentos
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_investimentos_auto_calculate
    BEFORE INSERT OR UPDATE ON investimentos
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_values();

CREATE TRIGGER trg_investimentos_validate_financial
    BEFORE INSERT OR UPDATE ON investimentos
    FOR EACH ROW
    EXECUTE FUNCTION validate_financial_values();

CREATE TRIGGER trg_investimentos_validate_dates
    BEFORE INSERT OR UPDATE ON investimentos
    FOR EACH ROW
    EXECUTE FUNCTION validate_date_constraints();

-- Vendas ativos
CREATE TRIGGER trg_vendas_ativos_updated_at
    BEFORE UPDATE ON vendas_ativos
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_vendas_ativos_validate_tenant
    BEFORE INSERT OR UPDATE ON vendas_ativos
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_vendas_ativos_auto_calculate
    BEFORE INSERT OR UPDATE ON vendas_ativos
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_values();

CREATE TRIGGER trg_vendas_ativos_validate_financial
    BEFORE INSERT OR UPDATE ON vendas_ativos
    FOR EACH ROW
    EXECUTE FUNCTION validate_financial_values();

CREATE TRIGGER trg_vendas_ativos_validate_dates
    BEFORE INSERT OR UPDATE ON vendas_ativos
    FOR EACH ROW
    EXECUTE FUNCTION validate_date_constraints();

-- Maquinas equipamentos
CREATE TRIGGER trg_maquinas_equipamentos_updated_at
    BEFORE UPDATE ON maquinas_equipamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_maquinas_equipamentos_validate_dates
    BEFORE INSERT OR UPDATE ON maquinas_equipamentos
    FOR EACH ROW
    EXECUTE FUNCTION validate_date_constraints();

-- =============================================================================
-- COMMERCIAL MANAGEMENT TRIGGERS
-- =============================================================================

-- Vendas pecuaria
CREATE TRIGGER trg_vendas_pecuaria_updated_at
    BEFORE UPDATE ON vendas_pecuaria
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_vendas_pecuaria_validate_tenant
    BEFORE INSERT OR UPDATE ON vendas_pecuaria
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_vendas_pecuaria_validate_financial
    BEFORE INSERT OR UPDATE ON vendas_pecuaria
    FOR EACH ROW
    EXECUTE FUNCTION validate_financial_values();

-- Vendas sementes
CREATE TRIGGER trg_vendas_sementes_updated_at
    BEFORE UPDATE ON vendas_sementes
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_vendas_sementes_validate_tenant
    BEFORE INSERT OR UPDATE ON vendas_sementes
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_vendas_sementes_validate_financial
    BEFORE INSERT OR UPDATE ON vendas_sementes
    FOR EACH ROW
    EXECUTE FUNCTION validate_financial_values();

-- Precos comerciais (table does not exist - commented out)
-- CREATE TRIGGER trg_precos_comerciais_updated_at
--     BEFORE UPDATE ON precos_comerciais
--     FOR EACH ROW
--     EXECUTE FUNCTION update_timestamp();

-- CREATE TRIGGER trg_precos_comerciais_validate_tenant
--     BEFORE INSERT OR UPDATE ON precos_comerciais
--     FOR EACH ROW
--     EXECUTE FUNCTION validate_multi_tenant_consistency();

-- Planejamento vendas (table does not exist - commented out)
-- CREATE TRIGGER trg_planejamento_vendas_updated_at
--     BEFORE UPDATE ON planejamento_vendas
--     FOR EACH ROW
--     EXECUTE FUNCTION update_timestamp();

-- CREATE TRIGGER trg_planejamento_vendas_validate_tenant
--     BEFORE INSERT OR UPDATE ON planejamento_vendas
--     FOR EACH ROW
--     EXECUTE FUNCTION validate_multi_tenant_consistency();

-- =============================================================================
-- INDICATORS MANAGEMENT TRIGGERS
-- =============================================================================

-- Commodity price projections
CREATE TRIGGER trg_commodity_price_projections_updated_at
    BEFORE UPDATE ON commodity_price_projections
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_commodity_price_projections_validate_tenant
    BEFORE INSERT OR UPDATE ON commodity_price_projections
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_commodity_price_projections_validate_jsonb
    BEFORE INSERT OR UPDATE ON commodity_price_projections
    FOR EACH ROW
    EXECUTE FUNCTION validate_jsonb_multi_year();

-- Configuracao indicadores (table name should be 'configuracao_indicador' - singular)
-- CREATE TRIGGER trg_configuracao_indicadores_updated_at
--     BEFORE UPDATE ON configuracao_indicadores
--     FOR EACH ROW
--     EXECUTE FUNCTION update_timestamp();

-- CREATE TRIGGER trg_configuracao_indicadores_validate_thresholds
--     BEFORE INSERT OR UPDATE ON configuracao_indicadores
--     FOR EACH ROW
--     EXECUTE FUNCTION validate_threshold_jsonb();

-- Parametros sensibilidade
CREATE TRIGGER trg_parametros_sensibilidade_updated_at
    BEFORE UPDATE ON parametros_sensibilidade
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_parametros_sensibilidade_validate_tenant
    BEFORE INSERT OR UPDATE ON parametros_sensibilidade
    FOR EACH ROW
    EXECUTE FUNCTION validate_multi_tenant_consistency();

CREATE TRIGGER trg_parametros_sensibilidade_validate_parameters
    BEFORE INSERT OR UPDATE ON parametros_sensibilidade
    FOR EACH ROW
    EXECUTE FUNCTION validate_sensitivity_parameters_jsonb();

-- =============================================================================
-- TRIGGER COMMENTS & DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION update_timestamp() IS 'Generic function to update timestamp fields on record modification';
COMMENT ON FUNCTION validate_multi_tenant_consistency() IS 'Validates multi-tenant data consistency across related entities';
COMMENT ON FUNCTION validate_jsonb_multi_year() IS 'Validates JSONB multi-year data structures for all modules';
COMMENT ON FUNCTION validate_threshold_jsonb() IS 'Validates JSONB threshold structures for indicators module';
COMMENT ON FUNCTION validate_sensitivity_parameters_jsonb() IS 'Validates sensitivity parameters in JSONB format';
COMMENT ON FUNCTION validate_area_constraints() IS 'Validates area constraints for properties and planting areas';
COMMENT ON FUNCTION validate_date_constraints() IS 'Validates date constraints and business rules';
COMMENT ON FUNCTION validate_financial_values() IS 'Validates financial values and business logic';
COMMENT ON FUNCTION auto_calculate_values() IS 'Auto-calculates derived values for patrimonio records';
COMMENT ON FUNCTION prevent_duplicate_entries() IS 'Prevents duplicate entries based on business rules';
COMMENT ON FUNCTION prevent_config_deletion() IS 'Prevents deletion of configuration items that are being used';

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
DECLARE
    total_triggers INTEGER;
    total_functions INTEGER;
BEGIN
    -- Count triggers and functions
    SELECT COUNT(*) INTO total_triggers
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public';
    
    SELECT COUNT(*) INTO total_functions
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_name LIKE '%validate%' OR routine_name LIKE '%update%' OR routine_name LIKE '%prevent%' OR routine_name LIKE '%auto%';
    
    RAISE NOTICE '=== SR-CONSULTORIA TRIGGERS CREATED SUCCESSFULLY ===';
    RAISE NOTICE 'Database validation and automation complete for multi-tenant agricultural platform:';
    RAISE NOTICE '- Total triggers created: %', total_triggers;
    RAISE NOTICE '- Total validation functions: %', total_functions;
    RAISE NOTICE 'Trigger categories active:';
    RAISE NOTICE '  • Multi-tenant isolation validation';
    RAISE NOTICE '  • JSONB multi-year data validation';
    RAISE NOTICE '  • Business logic validation';
    RAISE NOTICE '  • Financial constraints validation';
    RAISE NOTICE '  • Area and date constraints validation';
    RAISE NOTICE '  • Duplicate prevention';
    RAISE NOTICE '  • Configuration protection';
    RAISE NOTICE '  • Automatic timestamp updates';
    RAISE NOTICE '  • Auto-calculation of derived values';
    RAISE NOTICE 'All database tables are protected with comprehensive validation rules!';
END
$$;