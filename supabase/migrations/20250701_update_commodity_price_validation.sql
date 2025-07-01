-- Update the validate_jsonb_multi_year function to handle both year-based and safra-based keys for commodity_price_projections
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
    
    -- MODIFICAÇÃO: Permitir JSONB vazio para commodity_price_projections
    -- Isso permite criar preços sem projeções automáticas
    IF jsonb_field = '{}' THEN
        IF TG_TABLE_NAME = 'commodity_price_projections' THEN
            -- Permitir vazio para commodity_price_projections
            RETURN NEW;
        ELSE
            -- Manter validação para outras tabelas
            RAISE EXCEPTION '% não pode estar vazio', field_name;
        END IF;
    END IF;
    
    -- Validate each year/value pair
    FOR year_key IN SELECT jsonb_object_keys(jsonb_field)
    LOOP
        -- For safra-based tables, validate against safra_id
        -- EXCEPTION: commodity_price_projections can use either safra IDs or years
        IF field_name IN ('areas_por_safra', 'produtividades_por_safra', 'custos_por_safra', 'volume_abate_por_safra', 'custos_por_ano', 'fluxo_pagamento_anual', 'valores_por_ano', 'valores_totais_por_ano') THEN
            -- Validate safra_id format (UUID)
            IF year_key !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                RAISE EXCEPTION 'ID de safra inválido em %: %. Deve ser um UUID válido.', field_name, year_key;
            END IF;
            
            -- Validate safra exists and belongs to organization
            IF NOT EXISTS (SELECT 1 FROM safras WHERE id = year_key::UUID AND organizacao_id = NEW.organizacao_id) THEN
                RAISE EXCEPTION 'Safra não encontrada ou não pertence à organização: %', year_key;
            END IF;
        ELSIF TG_TABLE_NAME = 'commodity_price_projections' AND field_name = 'precos_por_ano' THEN
            -- Special handling for commodity_price_projections: allow both safra IDs and years
            IF year_key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
                -- It's a UUID (safra ID)
                IF NOT EXISTS (SELECT 1 FROM safras WHERE id = year_key::UUID AND organizacao_id = NEW.organizacao_id) THEN
                    RAISE EXCEPTION 'Safra não encontrada ou não pertence à organização: %', year_key;
                END IF;
            ELSIF year_key ~ '^\d{4}$' THEN
                -- It's a year
                IF year_key::INTEGER < 2020 OR year_key::INTEGER > 2050 THEN
                    RAISE EXCEPTION 'Ano fora do intervalo válido (2020-2050) em %: %', field_name, year_key;
                END IF;
            ELSE
                RAISE EXCEPTION 'Chave inválida em %: %. Deve ser um ano de 4 dígitos ou um UUID de safra.', field_name, year_key;
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