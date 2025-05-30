-- =============================================================================
-- PATRIMONIO MODULE - FUNCTIONS
-- =============================================================================
-- This file contains all functions for the patrimonio module
-- Includes query helpers, calculations, and analysis functions
-- =============================================================================

-- =============================================================================
-- LAND ACQUISITION FUNCTIONS
-- =============================================================================

-- Function to get land acquisitions summary by safra
CREATE OR REPLACE FUNCTION get_land_acquisitions_by_safra(
    p_organizacao_id UUID,
    p_safra_id UUID
)
RETURNS TABLE(
    total_acquisitions INTEGER,
    total_hectares DECIMAL(15, 4),
    total_value DECIMAL(15, 2),
    avg_value_per_hectare DECIMAL(15, 4),
    acquisitions_by_type JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH acquisition_stats AS (
        SELECT 
            COUNT(*) as acq_count,
            COALESCE(SUM(hectares), 0) as total_ha,
            COALESCE(SUM(valor_total), 0) as total_val,
            CASE 
                WHEN SUM(hectares) > 0 
                THEN (SUM(valor_total) / SUM(hectares))
                ELSE 0 
            END as avg_val_per_ha
        FROM aquisicao_terras
        WHERE organizacao_id = p_organizacao_id
          AND safra_id = p_safra_id
    ),
    type_stats AS (
        SELECT jsonb_object_agg(tipo, count) as by_type
        FROM (
            SELECT tipo, COUNT(*) as count
            FROM aquisicao_terras
            WHERE organizacao_id = p_organizacao_id
              AND safra_id = p_safra_id
            GROUP BY tipo
        ) t
    )
    SELECT 
        acq.acq_count::INTEGER,
        acq.total_ha,
        acq.total_val,
        acq.avg_val_per_ha::DECIMAL(15, 4),
        COALESCE(ts.by_type, '{}'::JSONB)
    FROM acquisition_stats acq
    CROSS JOIN type_stats ts;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get land acquisition evolution over years
CREATE OR REPLACE FUNCTION get_land_acquisition_evolution(
    p_organizacao_id UUID,
    p_start_year INTEGER DEFAULT NULL,
    p_end_year INTEGER DEFAULT NULL
)
RETURNS TABLE(
    ano INTEGER,
    total_hectares DECIMAL(15, 4),
    total_value DECIMAL(15, 2),
    acquisitions_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        at.ano,
        SUM(at.hectares),
        SUM(at.valor_total),
        COUNT(*)::INTEGER
    FROM aquisicao_terras at
    WHERE at.organizacao_id = p_organizacao_id
      AND (p_start_year IS NULL OR at.ano >= p_start_year)
      AND (p_end_year IS NULL OR at.ano <= p_end_year)
    GROUP BY at.ano
    ORDER BY at.ano;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- INVESTMENT FUNCTIONS
-- =============================================================================

-- Function to get investments summary by safra and category
CREATE OR REPLACE FUNCTION get_investments_by_safra_category(
    p_organizacao_id UUID,
    p_safra_id UUID
)
RETURNS TABLE(
    categoria categoria_investimento,
    total_investments INTEGER,
    total_quantity INTEGER,
    total_value DECIMAL(15, 2),
    avg_unit_value DECIMAL(15, 4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.categoria,
        COUNT(*)::INTEGER,
        SUM(i.quantidade)::INTEGER,
        SUM(i.valor_total),
        AVG(i.valor_unitario)::DECIMAL(15, 4)
    FROM investimentos i
    WHERE i.organizacao_id = p_organizacao_id
      AND i.safra_id = p_safra_id
    GROUP BY i.categoria
    ORDER BY SUM(i.valor_total) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get investment evolution over years
CREATE OR REPLACE FUNCTION get_investment_evolution(
    p_organizacao_id UUID,
    p_categoria categoria_investimento DEFAULT NULL
)
RETURNS TABLE(
    ano INTEGER,
    total_value DECIMAL(15, 2),
    investment_count INTEGER,
    avg_investment_value DECIMAL(15, 4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.ano,
        SUM(i.valor_total),
        COUNT(*)::INTEGER,
        AVG(i.valor_total)::DECIMAL(15, 4)
    FROM investimentos i
    WHERE i.organizacao_id = p_organizacao_id
      AND (p_categoria IS NULL OR i.categoria = p_categoria)
    GROUP BY i.ano
    ORDER BY i.ano;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate ROI for investments (requires revenue data)
CREATE OR REPLACE FUNCTION calculate_investment_roi(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_categoria categoria_investimento
)
RETURNS DECIMAL(8, 4) AS $$
DECLARE
    total_investment DECIMAL(15, 2);
    estimated_benefit DECIMAL(15, 2) := 0; -- Placeholder - would integrate with production/revenue data
BEGIN
    SELECT SUM(valor_total)
    INTO total_investment
    FROM investimentos
    WHERE organizacao_id = p_organizacao_id
      AND safra_id = p_safra_id
      AND categoria = p_categoria;
    
    -- This is a simplified ROI calculation
    -- In practice, this would integrate with production and revenue modules
    estimated_benefit := total_investment * 1.15; -- Placeholder 15% benefit
    
    IF total_investment > 0 THEN
        RETURN ((estimated_benefit - total_investment) / total_investment * 100)::DECIMAL(8, 4);
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- ASSET SALES FUNCTIONS
-- =============================================================================

-- Function to get asset sales summary by safra
CREATE OR REPLACE FUNCTION get_asset_sales_by_safra(
    p_organizacao_id UUID,
    p_safra_id UUID
)
RETURNS TABLE(
    categoria categoria_venda_ativo,
    total_sales INTEGER,
    total_quantity INTEGER,
    total_value DECIMAL(15, 2),
    avg_unit_value DECIMAL(15, 4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        va.categoria,
        COUNT(*)::INTEGER,
        SUM(va.quantidade)::INTEGER,
        SUM(va.valor_total),
        AVG(va.valor_unitario)::DECIMAL(15, 4)
    FROM vendas_ativos va
    WHERE va.organizacao_id = p_organizacao_id
      AND va.safra_id = p_safra_id
    GROUP BY va.categoria
    ORDER BY SUM(va.valor_total) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get recent asset sales
CREATE OR REPLACE FUNCTION get_recent_asset_sales(
    p_organizacao_id UUID,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    sale_id UUID,
    categoria categoria_venda_ativo,
    descricao TEXT,
    data_venda DATE,
    valor_total DECIMAL(15, 2),
    days_ago INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        va.id,
        va.categoria,
        va.descricao,
        va.data_venda,
        va.valor_total,
        (now()::DATE - va.data_venda)::INTEGER
    FROM vendas_ativos va
    WHERE va.organizacao_id = p_organizacao_id
      AND va.data_venda IS NOT NULL
      AND va.data_venda >= (now()::DATE - p_days_back)
    ORDER BY va.data_venda DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- EQUIPMENT MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to get equipment inventory summary
CREATE OR REPLACE FUNCTION get_equipment_inventory_summary(
    p_organizacao_id UUID
)
RETURNS TABLE(
    total_equipment INTEGER,
    alienated_equipment INTEGER,
    total_acquisition_value DECIMAL(15, 2),
    avg_equipment_age DECIMAL(8, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH equipment_stats AS (
        SELECT 
            COUNT(*) as total_eq,
            COUNT(CASE WHEN alienado = true THEN 1 END) as alienated_eq,
            COALESCE(SUM(valor_aquisicao), 0) as total_value,
            AVG(EXTRACT(YEAR FROM now()) - ano) as avg_age
        FROM maquinas_equipamentos
        WHERE organizacao_id = p_organizacao_id
    )
    SELECT 
        es.total_eq::INTEGER,
        es.alienated_eq::INTEGER,
        es.total_value,
        es.avg_age::DECIMAL(8, 2)
    FROM equipment_stats es;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get equipment requiring maintenance (based on age)
CREATE OR REPLACE FUNCTION get_equipment_maintenance_candidates(
    p_organizacao_id UUID,
    p_max_age_years INTEGER DEFAULT 5
)
RETURNS TABLE(
    equipment_id UUID,
    descricao TEXT,
    marca TEXT,
    ano INTEGER,
    age_years INTEGER,
    valor_aquisicao DECIMAL(15, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        me.id,
        me.descricao,
        me.marca,
        me.ano,
        (EXTRACT(YEAR FROM now()) - me.ano)::INTEGER,
        me.valor_aquisicao
    FROM maquinas_equipamentos me
    WHERE me.organizacao_id = p_organizacao_id
      AND (EXTRACT(YEAR FROM now()) - me.ano) >= p_max_age_years
    ORDER BY (EXTRACT(YEAR FROM now()) - me.ano) DESC;
END;
$$ LANGUAGE plpgsql STABLE;


-- =============================================================================
-- PATRIMONIO ANALYSIS FUNCTIONS
-- =============================================================================

-- Function to get patrimonio overview by safra
CREATE OR REPLACE FUNCTION get_patrimonio_overview_by_safra(
    p_organizacao_id UUID,
    p_safra_id UUID
)
RETURNS TABLE(
    total_investments DECIMAL(15, 2),
    total_asset_sales DECIMAL(15, 2),
    total_land_acquisitions DECIMAL(15, 2),
    net_patrimonio_change DECIMAL(15, 2),
    investment_distribution JSONB,
    largest_investment categoria_investimento,
    largest_sale categoria_venda_ativo
) AS $$
BEGIN
    RETURN QUERY
    WITH investment_summary AS (
        SELECT 
            COALESCE(SUM(valor_total), 0) as total_inv,
            categoria as top_inv_category
        FROM investimentos 
        WHERE organizacao_id = p_organizacao_id 
          AND safra_id = p_safra_id
        GROUP BY categoria
        ORDER BY SUM(valor_total) DESC
        LIMIT 1
    ),
    sales_summary AS (
        SELECT 
            COALESCE(SUM(valor_total), 0) as total_sales,
            categoria as top_sale_category
        FROM vendas_ativos 
        WHERE organizacao_id = p_organizacao_id 
          AND safra_id = p_safra_id
        GROUP BY categoria
        ORDER BY SUM(valor_total) DESC
        LIMIT 1
    ),
    land_summary AS (
        SELECT COALESCE(SUM(valor_total), 0) as total_land
        FROM aquisicao_terras 
        WHERE organizacao_id = p_organizacao_id 
          AND safra_id = p_safra_id
    ),
    investment_dist AS (
        SELECT jsonb_object_agg(categoria, valor_total) as distribution
        FROM (
            SELECT categoria, SUM(valor_total) as valor_total
            FROM investimentos
            WHERE organizacao_id = p_organizacao_id
              AND safra_id = p_safra_id
            GROUP BY categoria
        ) d
    )
    SELECT 
        COALESCE(i.total_inv, 0),
        COALESCE(s.total_sales, 0),
        COALESCE(l.total_land, 0),
        (COALESCE(i.total_inv, 0) + COALESCE(l.total_land, 0) - COALESCE(s.total_sales, 0)),
        COALESCE(id.distribution, '{}'::JSONB),
        i.top_inv_category,
        s.top_sale_category
    FROM investment_summary i
    CROSS JOIN sales_summary s
    CROSS JOIN land_summary l
    CROSS JOIN investment_dist id;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION get_land_acquisitions_by_safra(UUID, UUID) IS 'Retorna resumo de aquisições de terras por safra';
COMMENT ON FUNCTION get_investments_by_safra_category(UUID, UUID) IS 'Retorna resumo de investimentos por safra e categoria';
COMMENT ON FUNCTION get_asset_sales_by_safra(UUID, UUID) IS 'Retorna resumo de vendas de ativos por safra';
COMMENT ON FUNCTION get_equipment_inventory_summary(UUID) IS 'Retorna resumo do inventário de equipamentos';
COMMENT ON FUNCTION get_patrimonio_overview_by_safra(UUID, UUID) IS 'Retorna visão geral do patrimônio por safra';
COMMENT ON FUNCTION calculate_investment_roi(UUID, UUID, categoria_investimento) IS 'Calcula ROI dos investimentos por categoria';