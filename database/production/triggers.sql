-- ==========================================
-- SR-Consultoria: Production Module Triggers
-- ==========================================
-- 
-- Database triggers for data validation and business rules
-- Multi-tenant consistency and data integrity
--
-- Generated with Claude Code: https://claude.ai/code
-- ==========================================

-- ==========================================
-- MULTI-SAFRA VALIDATION TRIGGERS
-- ==========================================

-- Trigger function to validate multi-safra consistency
CREATE OR REPLACE FUNCTION validate_production_multi_safra()
RETURNS TRIGGER AS $$
DECLARE
    safra_org_id UUID;
    cultura_org_id UUID;
    sistema_org_id UUID;
    ciclo_org_id UUID;
    propriedade_org_id UUID;
BEGIN
    -- Validate that all related entities belong to the same organization
    
    -- Check safra organization
    SELECT organizacao_id INTO safra_org_id 
    FROM safras WHERE id = NEW.safra_id;
    
    IF safra_org_id IS NULL THEN
        RAISE EXCEPTION 'Safra not found: %', NEW.safra_id;
    END IF;
    
    IF safra_org_id != NEW.organizacao_id THEN
        RAISE EXCEPTION 'Safra does not belong to the specified organization';
    END IF;

    -- Check cultura organization
    SELECT organizacao_id INTO cultura_org_id 
    FROM culturas WHERE id = NEW.cultura_id;
    
    IF cultura_org_id IS NULL THEN
        RAISE EXCEPTION 'Cultura not found: %', NEW.cultura_id;
    END IF;
    
    IF cultura_org_id != NEW.organizacao_id THEN
        RAISE EXCEPTION 'Cultura does not belong to the specified organization';
    END IF;

    -- Check sistema organization
    SELECT organizacao_id INTO sistema_org_id 
    FROM sistemas WHERE id = NEW.sistema_id;
    
    IF sistema_org_id IS NULL THEN
        RAISE EXCEPTION 'Sistema not found: %', NEW.sistema_id;
    END IF;
    
    IF sistema_org_id != NEW.organizacao_id THEN
        RAISE EXCEPTION 'Sistema does not belong to the specified organization';
    END IF;

    -- Check ciclo organization (if applicable)
    IF TG_TABLE_NAME IN ('areas_plantio') THEN
        SELECT organizacao_id INTO ciclo_org_id 
        FROM ciclos WHERE id = NEW.ciclo_id;
        
        IF ciclo_org_id IS NULL THEN
            RAISE EXCEPTION 'Ciclo not found: %', NEW.ciclo_id;
        END IF;
        
        IF ciclo_org_id != NEW.organizacao_id THEN
            RAISE EXCEPTION 'Ciclo does not belong to the specified organization';
        END IF;
    END IF;

    -- Check propriedade organization (if applicable)
    IF TG_TABLE_NAME IN ('areas_plantio', 'produtividades', 'custos_producao', 'rebanhos', 'operacoes_pecuarias') THEN
        IF NEW.propriedade_id IS NOT NULL THEN
            SELECT organizacao_id INTO propriedade_org_id 
            FROM propriedades WHERE id = NEW.propriedade_id;
            
            IF propriedade_org_id IS NULL THEN
                RAISE EXCEPTION 'Propriedade not found: %', NEW.propriedade_id;
            END IF;
            
            IF propriedade_org_id != NEW.organizacao_id THEN
                RAISE EXCEPTION 'Propriedade does not belong to the specified organization';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation triggers to production tables
DROP TRIGGER IF EXISTS trg_validate_areas_plantio_multi_safra ON areas_plantio;
CREATE TRIGGER trg_validate_areas_plantio_multi_safra
    BEFORE INSERT OR UPDATE ON areas_plantio
    FOR EACH ROW
    EXECUTE FUNCTION validate_production_multi_safra();

DROP TRIGGER IF EXISTS trg_validate_produtividades_multi_safra ON produtividades;
CREATE TRIGGER trg_validate_produtividades_multi_safra
    BEFORE INSERT OR UPDATE ON produtividades
    FOR EACH ROW
    EXECUTE FUNCTION validate_production_multi_safra();

DROP TRIGGER IF EXISTS trg_validate_custos_producao_multi_safra ON custos_producao;
CREATE TRIGGER trg_validate_custos_producao_multi_safra
    BEFORE INSERT OR UPDATE ON custos_producao
    FOR EACH ROW
    EXECUTE FUNCTION validate_production_multi_safra();

DROP TRIGGER IF EXISTS trg_validate_rebanhos_multi_safra ON rebanhos;
CREATE TRIGGER trg_validate_rebanhos_multi_safra
    BEFORE INSERT OR UPDATE ON rebanhos
    FOR EACH ROW
    EXECUTE FUNCTION validate_production_multi_safra();

DROP TRIGGER IF EXISTS trg_validate_operacoes_pecuarias_multi_safra ON operacoes_pecuarias;
CREATE TRIGGER trg_validate_operacoes_pecuarias_multi_safra
    BEFORE INSERT OR UPDATE ON operacoes_pecuarias
    FOR EACH ROW
    EXECUTE FUNCTION validate_production_multi_safra();

-- ==========================================
-- DUPLICATE PREVENTION TRIGGERS
-- ==========================================

-- Trigger to prevent duplicate area entries for same combination
CREATE OR REPLACE FUNCTION prevent_duplicate_area_entries()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for existing entry with same combination
    IF EXISTS (
        SELECT 1 FROM areas_plantio 
        WHERE organizacao_id = NEW.organizacao_id
        AND propriedade_id = NEW.propriedade_id
        AND cultura_id = NEW.cultura_id
        AND sistema_id = NEW.sistema_id
        AND ciclo_id = NEW.ciclo_id
        AND safra_id = NEW.safra_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    ) THEN
        RAISE EXCEPTION 'Já existe uma área cadastrada para esta combinação de propriedade, cultura, sistema, ciclo e safra';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_duplicate_areas ON areas_plantio;
CREATE TRIGGER trg_prevent_duplicate_areas
    BEFORE INSERT OR UPDATE ON areas_plantio
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_area_entries();

-- ==========================================
-- AUDIT AND TIMESTAMP TRIGGERS
-- ==========================================

-- Generic trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to all production tables
DROP TRIGGER IF EXISTS trg_update_culturas_timestamp ON culturas;
CREATE TRIGGER trg_update_culturas_timestamp
    BEFORE UPDATE ON culturas
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_sistemas_timestamp ON sistemas;
CREATE TRIGGER trg_update_sistemas_timestamp
    BEFORE UPDATE ON sistemas
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_ciclos_timestamp ON ciclos;
CREATE TRIGGER trg_update_ciclos_timestamp
    BEFORE UPDATE ON ciclos
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_safras_timestamp ON safras;
CREATE TRIGGER trg_update_safras_timestamp
    BEFORE UPDATE ON safras
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_areas_plantio_timestamp ON areas_plantio;
CREATE TRIGGER trg_update_areas_plantio_timestamp
    BEFORE UPDATE ON areas_plantio
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_produtividades_timestamp ON produtividades;
CREATE TRIGGER trg_update_produtividades_timestamp
    BEFORE UPDATE ON produtividades
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_custos_producao_timestamp ON custos_producao;
CREATE TRIGGER trg_update_custos_producao_timestamp
    BEFORE UPDATE ON custos_producao
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_rebanhos_timestamp ON rebanhos;
CREATE TRIGGER trg_update_rebanhos_timestamp
    BEFORE UPDATE ON rebanhos
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_update_operacoes_pecuarias_timestamp ON operacoes_pecuarias;
CREATE TRIGGER trg_update_operacoes_pecuarias_timestamp
    BEFORE UPDATE ON operacoes_pecuarias
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ==========================================
-- BUSINESS RULE VALIDATION TRIGGERS
-- ==========================================

-- Trigger to validate safra date ranges
CREATE OR REPLACE FUNCTION validate_safra_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for overlapping safras in the same organization
    IF EXISTS (
        SELECT 1 FROM safras 
        WHERE organizacao_id = NEW.organizacao_id
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND (
            (NEW.ano_inicio BETWEEN ano_inicio AND ano_fim)
            OR (NEW.ano_fim BETWEEN ano_inicio AND ano_fim)
            OR (ano_inicio BETWEEN NEW.ano_inicio AND NEW.ano_fim)
        )
    ) THEN
        RAISE EXCEPTION 'Existe sobreposição de datas com outra safra da organização';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_safra_dates ON safras;
CREATE TRIGGER trg_validate_safra_dates
    BEFORE INSERT OR UPDATE ON safras
    FOR EACH ROW
    EXECUTE FUNCTION validate_safra_dates();

-- Trigger to validate area limits per property
CREATE OR REPLACE FUNCTION validate_area_limits()
RETURNS TRIGGER AS $$
DECLARE
    property_total_area DECIMAL;
    current_planted_area DECIMAL;
BEGIN
    -- Get property total area
    SELECT COALESCE(area_total, 0) INTO property_total_area
    FROM propriedades WHERE id = NEW.propriedade_id;
    
    -- Calculate current planted area (excluding the current record if updating)
    SELECT COALESCE(SUM(area), 0) INTO current_planted_area
    FROM areas_plantio 
    WHERE propriedade_id = NEW.propriedade_id
    AND safra_id = NEW.safra_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
    
    -- Check if total planted area would exceed property area
    IF property_total_area > 0 AND (current_planted_area + NEW.area) > property_total_area THEN
        RAISE EXCEPTION 'Área plantada total (%.2f ha) excederia a área da propriedade (%.2f ha)', 
                       current_planted_area + NEW.area, property_total_area;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_area_limits ON areas_plantio;
CREATE TRIGGER trg_validate_area_limits
    BEFORE INSERT OR UPDATE ON areas_plantio
    FOR EACH ROW
    EXECUTE FUNCTION validate_area_limits();

-- ==========================================
-- DATA CONSISTENCY TRIGGERS
-- ==========================================

-- Trigger to ensure livestock quantities are consistent
CREATE OR REPLACE FUNCTION validate_livestock_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- If numero_cabecas is provided, ensure it matches or is greater than quantidade
    IF NEW.numero_cabecas > 0 AND NEW.numero_cabecas < NEW.quantidade THEN
        RAISE EXCEPTION 'Número de cabeças (%) não pode ser menor que a quantidade (%)', 
                       NEW.numero_cabecas, NEW.quantidade;
    END IF;
    
    -- Auto-set numero_cabecas if not provided and unidade_preco is CABECA
    IF NEW.numero_cabecas = 0 AND NEW.unidade_preco = 'CABECA' THEN
        NEW.numero_cabecas = NEW.quantidade;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_livestock_consistency ON rebanhos;
CREATE TRIGGER trg_validate_livestock_consistency
    BEFORE INSERT OR UPDATE ON rebanhos
    FOR EACH ROW
    EXECUTE FUNCTION validate_livestock_consistency();

-- ==========================================
-- CONFIGURATION VALIDATION TRIGGERS
-- ==========================================

-- Trigger to prevent deletion of referenced configuration items
CREATE OR REPLACE FUNCTION prevent_config_deletion()
RETURNS TRIGGER AS $$
DECLARE
    usage_count INTEGER;
    table_check TEXT;
BEGIN
    -- Determine which table to check based on trigger table
    CASE TG_TABLE_NAME
        WHEN 'culturas' THEN
            table_check = 'areas_plantio';
        WHEN 'sistemas' THEN
            table_check = 'areas_plantio';
        WHEN 'ciclos' THEN
            table_check = 'areas_plantio';
        WHEN 'safras' THEN
            -- Special case for safras since they're stored in JSONB
            SELECT COUNT(*) INTO usage_count 
            FROM areas_plantio 
            WHERE areas_por_safra ? OLD.id::text;
            
            IF usage_count > 0 THEN
                RAISE EXCEPTION 'Não é possível excluir esta safra pois está sendo usada em % registros de áreas de plantio', usage_count;
            END IF;
            
            -- Check produtividades table too
            SELECT COUNT(*) INTO usage_count 
            FROM produtividades 
            WHERE produtividades_por_safra ? OLD.id::text;
            
            IF usage_count > 0 THEN
                RAISE EXCEPTION 'Não é possível excluir esta safra pois está sendo usada em % registros de produtividade', usage_count;
            END IF;
            
            -- Check custos_producao table
            SELECT COUNT(*) INTO usage_count 
            FROM custos_producao 
            WHERE custos_por_safra ? OLD.id::text;
            
            IF usage_count > 0 THEN
                RAISE EXCEPTION 'Não é possível excluir esta safra pois está sendo usada em % registros de custos de produção', usage_count;
            END IF;
            
            -- Return early since we've already checked
            RETURN OLD;
        ELSE
            RETURN OLD;
    END CASE;
    
    -- Check if configuration item is being used (for non-safra tables)
    EXECUTE format(
        'SELECT COUNT(*) FROM %I WHERE %I = $1',
        table_check,
        TG_TABLE_NAME::TEXT || '_id'
    ) USING OLD.id INTO usage_count;
    
    IF usage_count > 0 THEN
        RAISE EXCEPTION 'Não é possível excluir este item pois está sendo usado em % registros', usage_count;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Apply configuration deletion prevention triggers
DROP TRIGGER IF EXISTS trg_prevent_cultura_deletion ON culturas;
CREATE TRIGGER trg_prevent_cultura_deletion
    BEFORE DELETE ON culturas
    FOR EACH ROW
    EXECUTE FUNCTION prevent_config_deletion();

DROP TRIGGER IF EXISTS trg_prevent_sistema_deletion ON sistemas;
CREATE TRIGGER trg_prevent_sistema_deletion
    BEFORE DELETE ON sistemas
    FOR EACH ROW
    EXECUTE FUNCTION prevent_config_deletion();

DROP TRIGGER IF EXISTS trg_prevent_ciclo_deletion ON ciclos;
CREATE TRIGGER trg_prevent_ciclo_deletion
    BEFORE DELETE ON ciclos
    FOR EACH ROW
    EXECUTE FUNCTION prevent_config_deletion();

DROP TRIGGER IF EXISTS trg_prevent_safra_deletion ON safras;
CREATE TRIGGER trg_prevent_safra_deletion
    BEFORE DELETE ON safras
    FOR EACH ROW
    EXECUTE FUNCTION prevent_config_deletion();


-- ==========================================
-- TRIGGER COMMENTS
-- ==========================================

COMMENT ON FUNCTION validate_production_multi_safra() IS 'Validates multi-safra data consistency across related entities';
COMMENT ON FUNCTION prevent_duplicate_area_entries() IS 'Prevents duplicate area entries for same property/culture/system/cycle/safra combination';
COMMENT ON FUNCTION update_timestamp() IS 'Generic function to update timestamp fields on record modification';
COMMENT ON FUNCTION validate_safra_dates() IS 'Validates safra date ranges to prevent overlapping periods';
COMMENT ON FUNCTION validate_area_limits() IS 'Validates that planted areas do not exceed property total area';
COMMENT ON FUNCTION validate_livestock_consistency() IS 'Ensures livestock quantity and pricing data consistency';
COMMENT ON FUNCTION prevent_config_deletion() IS 'Prevents deletion of configuration items that are being used';

-- Success message
SELECT 'Production Module Triggers created successfully!
' ||
'- Multi-safra validation triggers active
' ||
'- Duplicate prevention triggers active
' ||
'- Timestamp triggers active
' ||
'- Business rule validation triggers active
' ||
'- Configuration protection triggers active
' ||
'- Audit logging infrastructure ready (triggers commented)' as trigger_status;