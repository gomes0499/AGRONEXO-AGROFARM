-- ==========================================
-- SR-Consultoria: Production Module Functions
-- ==========================================
-- 
-- Utility functions for production data operations
-- Multi-safra support and analytics functions
--
-- Generated with Claude Code: https://claude.ai/code
-- ==========================================

-- ==========================================
-- BULK OPERATIONS FUNCTIONS
-- ==========================================

-- Function for bulk multi-safra operations with validation
CREATE OR REPLACE FUNCTION bulk_insert_production_data(
    p_table_name TEXT,
    p_data JSONB
) RETURNS INTEGER AS $$
DECLARE
    insert_count INTEGER := 0;
    record_data JSONB;
BEGIN
    -- Validate table name
    IF p_table_name NOT IN ('areas_plantio', 'produtividades', 'custos_producao') THEN
        RAISE EXCEPTION 'Invalid table name: %', p_table_name;
    END IF;

    -- Process each record
    FOR record_data IN SELECT value FROM jsonb_array_elements(p_data)
    LOOP
        -- Dynamic insert based on table name
        CASE p_table_name
            WHEN 'areas_plantio' THEN
                INSERT INTO areas_plantio (
                    organizacao_id, propriedade_id, cultura_id, 
                    sistema_id, ciclo_id, safra_id, area, observacoes
                ) VALUES (
                    (record_data->>'organizacao_id')::UUID,
                    (record_data->>'propriedade_id')::UUID,
                    (record_data->>'cultura_id')::UUID,
                    (record_data->>'sistema_id')::UUID,
                    (record_data->>'ciclo_id')::UUID,
                    (record_data->>'safra_id')::UUID,
                    (record_data->>'area')::DECIMAL,
                    record_data->>'observacoes'
                );
                
            WHEN 'produtividades' THEN
                INSERT INTO produtividades (
                    organizacao_id, propriedade_id, cultura_id, 
                    sistema_id, safra_id, produtividade, unidade, observacoes
                ) VALUES (
                    (record_data->>'organizacao_id')::UUID,
                    NULLIF(record_data->>'propriedade_id', '')::UUID,
                    (record_data->>'cultura_id')::UUID,
                    (record_data->>'sistema_id')::UUID,
                    (record_data->>'safra_id')::UUID,
                    (record_data->>'produtividade')::DECIMAL,
                    COALESCE(record_data->>'unidade', 'sc/ha'),
                    record_data->>'observacoes'
                );
                
            WHEN 'custos_producao' THEN
                INSERT INTO custos_producao (
                    organizacao_id, propriedade_id, cultura_id, 
                    sistema_id, safra_id, categoria, valor, descricao, observacoes
                ) VALUES (
                    (record_data->>'organizacao_id')::UUID,
                    NULLIF(record_data->>'propriedade_id', '')::UUID,
                    (record_data->>'cultura_id')::UUID,
                    (record_data->>'sistema_id')::UUID,
                    (record_data->>'safra_id')::UUID,
                    (record_data->>'categoria')::custo_producao_categoria,
                    (record_data->>'valor')::DECIMAL,
                    record_data->>'descricao',
                    record_data->>'observacoes'
                );
        END CASE;
        
        insert_count := insert_count + 1;
    END LOOP;
    
    RETURN insert_count;
END;
$$ LANGUAGE plpgsql;

-- Function to delete multiple records efficiently
CREATE OR REPLACE FUNCTION bulk_delete_production_data(
    p_table_name TEXT,
    p_record_ids UUID[],
    p_organizacao_id UUID
) RETURNS INTEGER AS $$
DECLARE
    delete_count INTEGER := 0;
BEGIN
    -- Validate table name
    IF p_table_name NOT IN ('areas_plantio', 'produtividades', 'custos_producao', 'rebanhos') THEN
        RAISE EXCEPTION 'Invalid table name: %', p_table_name;
    END IF;

    -- Dynamic delete with organization validation
    EXECUTE format(
        'DELETE FROM %I WHERE id = ANY($1) AND organizacao_id = $2',
        p_table_name
    ) USING p_record_ids, p_organizacao_id;
    
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    
    RETURN delete_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- PRODUCTION METRICS FUNCTIONS
-- ==========================================

-- Function to calculate production metrics per organization
CREATE OR REPLACE FUNCTION calculate_production_metrics(
    p_organizacao_id UUID,
    p_safra_id UUID DEFAULT NULL,
    p_propriedade_ids UUID[] DEFAULT NULL
) RETURNS TABLE (
    total_area DECIMAL,
    total_cost DECIMAL,
    average_productivity DECIMAL,
    cost_per_hectare DECIMAL,
    culture_breakdown JSONB,
    system_breakdown JSONB,
    cost_breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH area_data AS (
        SELECT 
            ap.cultura_id,
            c.nome as cultura_nome,
            ap.sistema_id,
            s.nome as sistema_nome,
            SUM(ap.area) as total_area_cultura
        FROM areas_plantio ap
        JOIN culturas c ON ap.cultura_id = c.id
        JOIN sistemas s ON ap.sistema_id = s.id
        WHERE ap.organizacao_id = p_organizacao_id
        AND (p_safra_id IS NULL OR ap.safra_id = p_safra_id)
        AND (p_propriedade_ids IS NULL OR ap.propriedade_id = ANY(p_propriedade_ids))
        GROUP BY ap.cultura_id, c.nome, ap.sistema_id, s.nome
    ),
    cost_data AS (
        SELECT 
            cp.categoria,
            SUM(cp.valor) as total_custo
        FROM custos_producao cp
        WHERE cp.organizacao_id = p_organizacao_id
        AND (p_safra_id IS NULL OR cp.safra_id = p_safra_id)
        AND (p_propriedade_ids IS NULL OR cp.propriedade_id = ANY(p_propriedade_ids))
        GROUP BY cp.categoria
    ),
    productivity_data AS (
        SELECT 
            AVG(pr.produtividade) as avg_productivity
        FROM produtividades pr
        WHERE pr.organizacao_id = p_organizacao_id
        AND (p_safra_id IS NULL OR pr.safra_id = p_safra_id)
        AND (p_propriedade_ids IS NULL OR pr.propriedade_id = ANY(p_propriedade_ids))
    )
    SELECT 
        COALESCE((SELECT SUM(total_area_cultura) FROM area_data), 0) as total_area,
        COALESCE((SELECT SUM(total_custo) FROM cost_data), 0) as total_cost,
        COALESCE((SELECT avg_productivity FROM productivity_data), 0) as average_productivity,
        CASE 
            WHEN COALESCE((SELECT SUM(total_area_cultura) FROM area_data), 0) > 0 
            THEN COALESCE((SELECT SUM(total_custo) FROM cost_data), 0) / 
                 COALESCE((SELECT SUM(total_area_cultura) FROM area_data), 1)
            ELSE 0 
        END as cost_per_hectare,
        (SELECT jsonb_object_agg(cultura_nome, total_area_cultura) FROM area_data) as culture_breakdown,
        (SELECT jsonb_object_agg(sistema_nome, total_area_cultura) FROM area_data) as system_breakdown,
        (SELECT jsonb_object_agg(categoria::TEXT, total_custo) FROM cost_data) as cost_breakdown;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate productivity evolution over time
CREATE OR REPLACE FUNCTION calculate_productivity_evolution(
    p_organizacao_id UUID,
    p_cultura_id UUID DEFAULT NULL,
    p_sistema_id UUID DEFAULT NULL,
    p_years_back INTEGER DEFAULT 5
) RETURNS TABLE (
    safra_nome TEXT,
    ano_inicio INTEGER,
    produtividade_media DECIMAL,
    area_total DECIMAL,
    producao_total DECIMAL,
    numero_propriedades BIGINT,
    percentual_variacao DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH productivity_by_safra AS (
        SELECT 
            s.nome as safra_nome,
            s.ano_inicio,
            AVG(pr.produtividade) as produtividade_media,
            SUM(ap.area) as area_total,
            SUM(ap.area * pr.produtividade) as producao_total,
            COUNT(DISTINCT ap.propriedade_id) as numero_propriedades
        FROM safras s
        LEFT JOIN areas_plantio ap ON s.id = ap.safra_id
        LEFT JOIN produtividades pr ON ap.cultura_id = pr.cultura_id 
            AND ap.sistema_id = pr.sistema_id 
            AND ap.safra_id = pr.safra_id
        WHERE s.organizacao_id = p_organizacao_id
        AND s.ano_inicio >= EXTRACT(YEAR FROM NOW()) - p_years_back
        AND (p_cultura_id IS NULL OR ap.cultura_id = p_cultura_id)
        AND (p_sistema_id IS NULL OR ap.sistema_id = p_sistema_id)
        GROUP BY s.nome, s.ano_inicio
        ORDER BY s.ano_inicio
    ),
    with_variation AS (
        SELECT 
            *,
            CASE 
                WHEN LAG(produtividade_media) OVER (ORDER BY ano_inicio) IS NOT NULL 
                THEN ((produtividade_media - LAG(produtividade_media) OVER (ORDER BY ano_inicio)) / 
                      LAG(produtividade_media) OVER (ORDER BY ano_inicio)) * 100
                ELSE 0
            END as percentual_variacao
        FROM productivity_by_safra
    )
    SELECT * FROM with_variation;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate cost efficiency metrics
CREATE OR REPLACE FUNCTION calculate_cost_efficiency(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_cultura_id UUID DEFAULT NULL
) RETURNS TABLE (
    categoria custo_producao_categoria,
    valor_total DECIMAL,
    percentual_total DECIMAL,
    custo_por_hectare DECIMAL,
    custo_por_saca DECIMAL,
    propriedades_usando BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH total_costs AS (
        SELECT SUM(valor) as total_geral
        FROM custos_producao 
        WHERE organizacao_id = p_organizacao_id 
        AND safra_id = p_safra_id
        AND (p_cultura_id IS NULL OR cultura_id = p_cultura_id)
    ),
    total_area AS (
        SELECT SUM(area) as area_total
        FROM areas_plantio
        WHERE organizacao_id = p_organizacao_id
        AND safra_id = p_safra_id
        AND (p_cultura_id IS NULL OR cultura_id = p_cultura_id)
    ),
    avg_productivity AS (
        SELECT AVG(produtividade) as produtividade_media
        FROM produtividades
        WHERE organizacao_id = p_organizacao_id
        AND safra_id = p_safra_id
        AND (p_cultura_id IS NULL OR cultura_id = p_cultura_id)
    )
    SELECT 
        cp.categoria,
        SUM(cp.valor) as valor_total,
        (SUM(cp.valor) / tc.total_geral * 100) as percentual_total,
        (SUM(cp.valor) / NULLIF(ta.area_total, 0)) as custo_por_hectare,
        (SUM(cp.valor) / NULLIF(ta.area_total * ap.produtividade_media, 0)) as custo_por_saca,
        COUNT(DISTINCT cp.propriedade_id) as propriedades_usando
    FROM custos_producao cp
    CROSS JOIN total_costs tc
    CROSS JOIN total_area ta
    CROSS JOIN avg_productivity ap
    WHERE cp.organizacao_id = p_organizacao_id
    AND cp.safra_id = p_safra_id
    AND (p_cultura_id IS NULL OR cp.cultura_id = p_cultura_id)
    GROUP BY cp.categoria, tc.total_geral, ta.area_total, ap.produtividade_media
    ORDER BY valor_total DESC;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- DATA VALIDATION FUNCTIONS
-- ==========================================

-- Function to validate and clean production data
CREATE OR REPLACE FUNCTION clean_production_data(
    p_organizacao_id UUID,
    p_table_name TEXT DEFAULT 'all'
) RETURNS TABLE (
    table_name TEXT,
    cleaned_records INTEGER,
    issues_found TEXT[]
) AS $$
DECLARE
    cleaned_count INTEGER;
    issues TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Clean areas_plantio
    IF p_table_name IN ('all', 'areas_plantio') THEN
        -- Remove records with zero or negative areas
        DELETE FROM areas_plantio 
        WHERE organizacao_id = p_organizacao_id AND area <= 0;
        
        GET DIAGNOSTICS cleaned_count = ROW_COUNT;
        
        IF cleaned_count > 0 THEN
            issues := array_append(issues, cleaned_count || ' áreas com valores inválidos removidas');
        END IF;
        
        RETURN QUERY SELECT 'areas_plantio'::TEXT, cleaned_count, issues;
        issues := ARRAY[]::TEXT[];
    END IF;

    -- Clean produtividades
    IF p_table_name IN ('all', 'produtividades') THEN
        -- Remove records with zero or negative productivity
        DELETE FROM produtividades 
        WHERE organizacao_id = p_organizacao_id AND produtividade <= 0;
        
        GET DIAGNOSTICS cleaned_count = ROW_COUNT;
        
        IF cleaned_count > 0 THEN
            issues := array_append(issues, cleaned_count || ' produtividades com valores inválidos removidas');
        END IF;
        
        RETURN QUERY SELECT 'produtividades'::TEXT, cleaned_count, issues;
        issues := ARRAY[]::TEXT[];
    END IF;

    -- Clean custos_producao
    IF p_table_name IN ('all', 'custos_producao') THEN
        -- Remove records with negative costs
        DELETE FROM custos_producao 
        WHERE organizacao_id = p_organizacao_id AND valor < 0;
        
        GET DIAGNOSTICS cleaned_count = ROW_COUNT;
        
        IF cleaned_count > 0 THEN
            issues := array_append(issues, cleaned_count || ' custos com valores negativos removidos');
        END IF;
        
        RETURN QUERY SELECT 'custos_producao'::TEXT, cleaned_count, issues;
        issues := ARRAY[]::TEXT[];
    END IF;

    -- Clean rebanhos
    IF p_table_name IN ('all', 'rebanhos') THEN
        -- Fix numero_cabecas where inconsistent
        UPDATE rebanhos 
        SET numero_cabecas = quantidade 
        WHERE organizacao_id = p_organizacao_id 
        AND unidade_preco = 'CABECA' 
        AND (numero_cabecas = 0 OR numero_cabecas < quantidade);
        
        GET DIAGNOSTICS cleaned_count = ROW_COUNT;
        
        IF cleaned_count > 0 THEN
            issues := array_append(issues, cleaned_count || ' registros de rebanho com número de cabeças corrigido');
        END IF;
        
        RETURN QUERY SELECT 'rebanhos'::TEXT, cleaned_count, issues;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to validate production data consistency
CREATE OR REPLACE FUNCTION validate_production_consistency(
    p_organizacao_id UUID
) RETURNS TABLE (
    check_name TEXT,
    status TEXT,
    issue_count INTEGER,
    details TEXT
) AS $$
BEGIN
    -- Check for areas without productivity data
    RETURN QUERY
    SELECT 
        'Areas without productivity'::TEXT as check_name,
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END as status,
        COUNT(*)::INTEGER as issue_count,
        'Areas planted without corresponding productivity records'::TEXT as details
    FROM areas_plantio ap
    LEFT JOIN produtividades pr ON ap.cultura_id = pr.cultura_id 
        AND ap.sistema_id = pr.sistema_id 
        AND ap.safra_id = pr.safra_id
    WHERE ap.organizacao_id = p_organizacao_id
    AND pr.id IS NULL;

    -- Check for productivity without areas
    RETURN QUERY
    SELECT 
        'Productivity without areas'::TEXT as check_name,
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'WARNING' END as status,
        COUNT(*)::INTEGER as issue_count,
        'Productivity records without corresponding planted areas'::TEXT as details
    FROM produtividades pr
    LEFT JOIN areas_plantio ap ON pr.cultura_id = ap.cultura_id 
        AND pr.sistema_id = ap.sistema_id 
        AND pr.safra_id = ap.safra_id
    WHERE pr.organizacao_id = p_organizacao_id
    AND ap.id IS NULL;

    -- Check for costs without areas
    RETURN QUERY
    SELECT 
        'Costs without areas'::TEXT as check_name,
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'INFO' END as status,
        COUNT(*)::INTEGER as issue_count,
        'Cost records without corresponding planted areas'::TEXT as details
    FROM custos_producao cp
    LEFT JOIN areas_plantio ap ON cp.cultura_id = ap.cultura_id 
        AND cp.sistema_id = ap.sistema_id 
        AND cp.safra_id = ap.safra_id
    WHERE cp.organizacao_id = p_organizacao_id
    AND ap.id IS NULL;

    -- Check for areas exceeding property limits
    RETURN QUERY
    WITH area_check AS (
        SELECT 
            ap.propriedade_id,
            p.area_total as property_area,
            SUM(ap.area) as planted_area
        FROM areas_plantio ap
        JOIN propriedades p ON ap.propriedade_id = p.id
        WHERE ap.organizacao_id = p_organizacao_id
        AND p.area_total > 0
        GROUP BY ap.propriedade_id, p.area_total
        HAVING SUM(ap.area) > p.area_total
    )
    SELECT 
        'Areas exceeding property limits'::TEXT as check_name,
        CASE WHEN COUNT(*) = 0 THEN 'OK' ELSE 'ERROR' END as status,
        COUNT(*)::INTEGER as issue_count,
        'Properties with planted area exceeding total property area'::TEXT as details
    FROM area_check;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- REPORTING FUNCTIONS
-- ==========================================

-- Function to generate production report data
CREATE OR REPLACE FUNCTION generate_production_report(
    p_organizacao_id UUID,
    p_safra_id UUID
) RETURNS TABLE (
    propriedade_nome TEXT,
    cultura_nome TEXT,
    sistema_nome TEXT,
    ciclo_nome TEXT,
    area_plantada DECIMAL,
    produtividade DECIMAL,
    producao_total DECIMAL,
    custo_total DECIMAL,
    custo_por_hectare DECIMAL,
    custo_por_saca DECIMAL,
    margem_bruta DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.nome as propriedade_nome,
        c.nome as cultura_nome,
        s.nome as sistema_nome,
        ci.nome as ciclo_nome,
        ap.area as area_plantada,
        COALESCE(pr.produtividade, 0) as produtividade,
        (ap.area * COALESCE(pr.produtividade, 0)) as producao_total,
        COALESCE(costs.custo_total, 0) as custo_total,
        (COALESCE(costs.custo_total, 0) / ap.area) as custo_por_hectare,
        CASE 
            WHEN pr.produtividade > 0 
            THEN COALESCE(costs.custo_total, 0) / (ap.area * pr.produtividade)
            ELSE 0 
        END as custo_por_saca,
        -- Basic margin calculation (would need price data for real margin)
        0::DECIMAL as margem_bruta
    FROM areas_plantio ap
    JOIN propriedades p ON ap.propriedade_id = p.id
    JOIN culturas c ON ap.cultura_id = c.id
    JOIN sistemas s ON ap.sistema_id = s.id
    JOIN ciclos ci ON ap.ciclo_id = ci.id
    LEFT JOIN produtividades pr ON ap.cultura_id = pr.cultura_id 
        AND ap.sistema_id = pr.sistema_id 
        AND ap.safra_id = pr.safra_id
        AND ap.propriedade_id = pr.propriedade_id
    LEFT JOIN (
        SELECT 
            cultura_id, sistema_id, safra_id, propriedade_id,
            SUM(valor) as custo_total
        FROM custos_producao
        WHERE organizacao_id = p_organizacao_id AND safra_id = p_safra_id
        GROUP BY cultura_id, sistema_id, safra_id, propriedade_id
    ) costs ON ap.cultura_id = costs.cultura_id 
        AND ap.sistema_id = costs.sistema_id 
        AND ap.safra_id = costs.safra_id
        AND ap.propriedade_id = costs.propriedade_id
    WHERE ap.organizacao_id = p_organizacao_id
    AND ap.safra_id = p_safra_id
    ORDER BY p.nome, c.nome, s.nome;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- LIVESTOCK FUNCTIONS
-- ==========================================

-- Function to calculate livestock value
CREATE OR REPLACE FUNCTION calculate_livestock_value(
    p_organizacao_id UUID,
    p_propriedade_id UUID DEFAULT NULL
) RETURNS TABLE (
    tipo_animal TEXT,
    categoria TEXT,
    quantidade_total INTEGER,
    valor_unitario_medio DECIMAL,
    valor_total DECIMAL,
    propriedades_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.tipo_animal,
        r.categoria,
        SUM(r.quantidade)::INTEGER as quantidade_total,
        AVG(r.preco_unitario) as valor_unitario_medio,
        SUM(r.quantidade * r.preco_unitario) as valor_total,
        COUNT(DISTINCT r.propriedade_id) as propriedades_count
    FROM rebanhos r
    WHERE r.organizacao_id = p_organizacao_id
    AND (p_propriedade_id IS NULL OR r.propriedade_id = p_propriedade_id)
    GROUP BY r.tipo_animal, r.categoria
    ORDER BY valor_total DESC;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- PERFORMANCE ANALYSIS FUNCTIONS
-- ==========================================

-- Function to analyze query performance on production tables
CREATE OR REPLACE FUNCTION analyze_production_performance(
    p_organizacao_id UUID
) RETURNS TABLE (
    table_name TEXT,
    total_records BIGINT,
    avg_query_time_ms NUMERIC,
    index_usage_ratio NUMERIC,
    recommendations TEXT[]
) AS $$
DECLARE
    rec RECORD;
    recommendations TEXT[];
BEGIN
    -- Analyze each production table
    FOR rec IN 
        SELECT t.table_name 
        FROM information_schema.tables t 
        WHERE t.table_schema = 'public' 
        AND t.table_name IN ('areas_plantio', 'produtividades', 'custos_producao', 'rebanhos', 'operacoes_pecuarias')
    LOOP
        recommendations := ARRAY[]::TEXT[];
        
        -- Get record count
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE organizacao_id = $1', rec.table_name) 
        USING p_organizacao_id INTO total_records;
        
        -- Basic recommendations based on record count
        IF total_records > 10000 THEN
            recommendations := array_append(recommendations, 'Consider partitioning by safra_id for large datasets');
        END IF;
        
        IF total_records > 1000 AND rec.table_name = 'areas_plantio' THEN
            recommendations := array_append(recommendations, 'Monitor bulk insert performance for multi-safra operations');
        END IF;
        
        IF total_records = 0 THEN
            recommendations := array_append(recommendations, 'No data found - consider data migration or initial setup');
        END IF;
        
        RETURN QUERY SELECT 
            rec.table_name,
            total_records,
            0::NUMERIC as avg_query_time_ms, -- Would need pg_stat_statements for real data
            0::NUMERIC as index_usage_ratio, -- Would need pg_stat_user_indexes for real data
            recommendations;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- MAINTENANCE FUNCTIONS
-- ==========================================

-- Function for periodic maintenance of production tables
CREATE OR REPLACE FUNCTION maintain_production_tables()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
BEGIN
    -- Update table statistics
    ANALYZE culturas, sistemas, ciclos, safras, areas_plantio, produtividades, custos_producao, rebanhos, operacoes_pecuarias;
    result := result || 'Table statistics updated. ';
    
    -- Vacuum tables if needed (not FULL to avoid locks)
    VACUUM culturas, sistemas, ciclos, safras, areas_plantio, produtividades, custos_producao, rebanhos, operacoes_pecuarias;
    result := result || 'Tables vacuumed. ';
    
    -- Check for orphaned records and log (don't auto-delete)
    IF EXISTS (
        SELECT 1 FROM areas_plantio ap 
        LEFT JOIN propriedades p ON ap.propriedade_id = p.id 
        WHERE p.id IS NULL
    ) THEN
        result := result || 'WARNING: Orphaned areas_plantio records found. ';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM custos_producao cp 
        LEFT JOIN culturas c ON cp.cultura_id = c.id 
        WHERE c.id IS NULL
    ) THEN
        result := result || 'WARNING: Orphaned custos_producao records found. ';
    END IF;
    
    result := result || 'Maintenance completed successfully.';
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to backup production data for an organization
CREATE OR REPLACE FUNCTION backup_production_data(
    p_organizacao_id UUID,
    p_backup_name TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    backup_id UUID := gen_random_uuid();
    backup_timestamp TIMESTAMP := NOW();
    final_backup_name TEXT;
    result TEXT := '';
BEGIN
    -- Generate backup name if not provided
    final_backup_name := COALESCE(
        p_backup_name, 
        'production_backup_' || to_char(backup_timestamp, 'YYYY_MM_DD_HH24_MI_SS')
    );
    
    -- Create backup metadata table if not exists
    CREATE TABLE IF NOT EXISTS production_backups (
        id UUID PRIMARY KEY,
        backup_name TEXT NOT NULL,
        organizacao_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        tables_backed_up TEXT[],
        record_counts JSONB
    );
    
    -- Create backup tables with data
    EXECUTE format('CREATE TABLE %I AS SELECT * FROM areas_plantio WHERE organizacao_id = $1', 
                   final_backup_name || '_areas_plantio') USING p_organizacao_id;
    
    EXECUTE format('CREATE TABLE %I AS SELECT * FROM produtividades WHERE organizacao_id = $1', 
                   final_backup_name || '_produtividades') USING p_organizacao_id;
    
    EXECUTE format('CREATE TABLE %I AS SELECT * FROM custos_producao WHERE organizacao_id = $1', 
                   final_backup_name || '_custos_producao') USING p_organizacao_id;
    
    EXECUTE format('CREATE TABLE %I AS SELECT * FROM rebanhos WHERE organizacao_id = $1', 
                   final_backup_name || '_rebanhos') USING p_organizacao_id;
    
    -- Record backup metadata
    INSERT INTO production_backups (
        id, backup_name, organizacao_id, tables_backed_up,
        record_counts
    ) VALUES (
        backup_id,
        final_backup_name,
        p_organizacao_id,
        ARRAY['areas_plantio', 'produtividades', 'custos_producao', 'rebanhos'],
        jsonb_build_object(
            'areas_plantio', (SELECT COUNT(*) FROM areas_plantio WHERE organizacao_id = p_organizacao_id),
            'produtividades', (SELECT COUNT(*) FROM produtividades WHERE organizacao_id = p_organizacao_id),
            'custos_producao', (SELECT COUNT(*) FROM custos_producao WHERE organizacao_id = p_organizacao_id),
            'rebanhos', (SELECT COUNT(*) FROM rebanhos WHERE organizacao_id = p_organizacao_id)
        )
    );
    
    result := 'Backup created successfully: ' || final_backup_name || ' (ID: ' || backup_id || ')';\n    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- FUNCTION COMMENTS
-- ==========================================

COMMENT ON FUNCTION bulk_insert_production_data(TEXT, JSONB) IS 'Bulk insert function for multi-safra production data with validation';
COMMENT ON FUNCTION bulk_delete_production_data(TEXT, UUID[], UUID) IS 'Efficiently delete multiple production records with organization validation';
COMMENT ON FUNCTION calculate_production_metrics(UUID, UUID, UUID[]) IS 'Calculates comprehensive production metrics per organization';
COMMENT ON FUNCTION calculate_productivity_evolution(UUID, UUID, UUID, INTEGER) IS 'Analyzes productivity trends over time';
COMMENT ON FUNCTION calculate_cost_efficiency(UUID, UUID, UUID) IS 'Calculates cost efficiency metrics by category';
COMMENT ON FUNCTION clean_production_data(UUID, TEXT) IS 'Validates and cleans production data, removing invalid records';
COMMENT ON FUNCTION validate_production_consistency(UUID) IS 'Validates data consistency across production tables';
COMMENT ON FUNCTION generate_production_report(UUID, UUID) IS 'Generates comprehensive production report data';
COMMENT ON FUNCTION calculate_livestock_value(UUID, UUID) IS 'Calculates total livestock value by type and category';
COMMENT ON FUNCTION analyze_production_performance(UUID) IS 'Analyzes production table performance and provides recommendations';
COMMENT ON FUNCTION maintain_production_tables() IS 'Performs routine maintenance on production tables';
COMMENT ON FUNCTION backup_production_data(UUID, TEXT) IS 'Creates a backup of production data for an organization';

-- Success message
SELECT 'Production Module Functions created successfully!
' ||
'- Bulk operations: ' || (
    SELECT COUNT(*) FROM information_schema.routines 
    WHERE routine_name LIKE 'bulk_%production%'
)::TEXT || ' functions
' ||
'- Analytics functions: ' || (
    SELECT COUNT(*) FROM information_schema.routines 
    WHERE routine_name LIKE 'calculate_%'
)::TEXT || ' functions
' ||
'- Data validation: ' || (
    SELECT COUNT(*) FROM information_schema.routines 
    WHERE routine_name LIKE '%validate%' OR routine_name LIKE 'clean_%'
)::TEXT || ' functions
' ||
'- Reporting functions: ' || (
    SELECT COUNT(*) FROM information_schema.routines 
    WHERE routine_name LIKE 'generate_%' OR routine_name LIKE 'analyze_%'
)::TEXT || ' functions
' ||
'- Maintenance functions: ' || (
    SELECT COUNT(*) FROM information_schema.routines 
    WHERE routine_name LIKE 'maintain_%' OR routine_name LIKE 'backup_%'
)::TEXT || ' functions' as function_status;