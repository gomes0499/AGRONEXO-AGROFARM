-- =============================================================================
-- PROPERTIES MODULE - FUNCTIONS
-- =============================================================================
-- This file contains all functions for the properties module
-- Includes query helpers, calculations, and analysis functions
-- =============================================================================

-- =============================================================================
-- LEASE COST QUERY FUNCTIONS
-- =============================================================================

-- Function to get lease cost for a specific year
CREATE OR REPLACE FUNCTION get_lease_cost_by_year(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_propriedade_id UUID,
    p_year INTEGER
)
RETURNS TABLE(
    custo_total DECIMAL(15, 2),
    custo_hectare DECIMAL(15, 4)
) AS $$
DECLARE
    cost_data JSONB;
BEGIN
    SELECT custos_por_ano->p_year::TEXT
    INTO cost_data
    FROM arrendamentos
    WHERE organizacao_id = p_organizacao_id
      AND safra_id = p_safra_id
      AND propriedade_id = p_propriedade_id
      AND ativo = true;
    
    IF cost_data IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            (cost_data->>'custo_total')::DECIMAL(15, 2),
            (cost_data->>'custo_hectare')::DECIMAL(15, 4);
    ELSE
        RETURN QUERY
        SELECT 
            0::DECIMAL(15, 2),
            0::DECIMAL(15, 4);
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get all lease costs for a property and safra
CREATE OR REPLACE FUNCTION get_lease_costs_by_safra(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_propriedade_id UUID DEFAULT NULL
)
RETURNS TABLE(
    arrendamento_id UUID,
    propriedade_id UUID,
    numero_arrendamento TEXT,
    nome_fazenda TEXT,
    area_arrendada DECIMAL(15, 4),
    tipo_pagamento tipo_pagamento_arrendamento,
    custos_por_ano JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.propriedade_id,
        a.numero_arrendamento,
        a.nome_fazenda,
        a.area_arrendada,
        a.tipo_pagamento,
        a.custos_por_ano
    FROM arrendamentos a
    WHERE a.organizacao_id = p_organizacao_id
      AND a.safra_id = p_safra_id
      AND (p_propriedade_id IS NULL OR a.propriedade_id = p_propriedade_id)
      AND a.ativo = true
    ORDER BY a.nome_fazenda, a.numero_arrendamento;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get lease cost evolution for a property across years
CREATE OR REPLACE FUNCTION get_lease_cost_evolution(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_propriedade_id UUID
)
RETURNS TABLE(
    ano INTEGER,
    custo_total DECIMAL(15, 2),
    custo_hectare DECIMAL(15, 4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aa.ano,
        aa.custo_total,
        aa.custo_hectare
    FROM arrendamentos_anos aa
    WHERE aa.organizacao_id = p_organizacao_id
      AND aa.safra_id = p_safra_id
      AND aa.propriedade_id = p_propriedade_id
    ORDER BY aa.ano;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate average lease cost for a property across years
CREATE OR REPLACE FUNCTION get_average_lease_cost(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_propriedade_id UUID,
    p_start_year INTEGER DEFAULT NULL,
    p_end_year INTEGER DEFAULT NULL
)
RETURNS TABLE(
    avg_custo_total DECIMAL(15, 2),
    avg_custo_hectare DECIMAL(15, 4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        AVG(aa.custo_total)::DECIMAL(15, 2),
        AVG(aa.custo_hectare)::DECIMAL(15, 4)
    FROM arrendamentos_anos aa
    WHERE aa.organizacao_id = p_organizacao_id
      AND aa.safra_id = p_safra_id
      AND aa.propriedade_id = p_propriedade_id
      AND (p_start_year IS NULL OR aa.ano >= p_start_year)
      AND (p_end_year IS NULL OR aa.ano <= p_end_year);
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- PROPERTY ANALYSIS FUNCTIONS
-- =============================================================================

-- Function to get property portfolio summary
CREATE OR REPLACE FUNCTION get_property_portfolio_summary(
    p_organizacao_id UUID
)
RETURNS TABLE(
    total_properties INTEGER,
    total_area_hectares DECIMAL(15, 4),
    total_cultivated_area DECIMAL(15, 4),
    total_property_value DECIMAL(15, 2),
    properties_by_type JSONB,
    properties_by_status JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH property_stats AS (
        SELECT 
            COUNT(*) as prop_count,
            COALESCE(SUM(area_total), 0) as total_area,
            COALESCE(SUM(area_cultivada), 0) as cultivated_area,
            COALESCE(SUM(valor_atual), 0) as total_value
        FROM propriedades
        WHERE organizacao_id = p_organizacao_id
    ),
    type_stats AS (
        SELECT jsonb_object_agg(tipo, count) as by_type
        FROM (
            SELECT tipo, COUNT(*) as count
            FROM propriedades
            WHERE organizacao_id = p_organizacao_id
            GROUP BY tipo
        ) t
    ),
    status_stats AS (
        SELECT jsonb_object_agg(status, count) as by_status
        FROM (
            SELECT status, COUNT(*) as count
            FROM propriedades
            WHERE organizacao_id = p_organizacao_id
            GROUP BY status
        ) s
    )
    SELECT 
        ps.prop_count::INTEGER,
        ps.total_area,
        ps.cultivated_area,
        ps.total_value,
        COALESCE(ts.by_type, '{}'::JSONB),
        COALESCE(ss.by_status, '{}'::JSONB)
    FROM property_stats ps
    CROSS JOIN type_stats ts
    CROSS JOIN status_stats ss;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get lease contract summary for an organization
CREATE OR REPLACE FUNCTION get_lease_contract_summary(
    p_organizacao_id UUID,
    p_safra_id UUID
)
RETURNS TABLE(
    total_contracts INTEGER,
    total_leased_area DECIMAL(15, 4),
    total_annual_cost DECIMAL(15, 2),
    avg_cost_per_hectare DECIMAL(15, 4),
    contracts_by_payment_type JSONB,
    active_contracts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH current_year_costs AS (
        SELECT 
            aa.arrendamento_id,
            aa.custo_total,
            aa.custo_hectare,
            aa.area_arrendada,
            aa.tipo_pagamento
        FROM arrendamentos_anos aa
        WHERE aa.organizacao_id = p_organizacao_id
          AND aa.safra_id = p_safra_id
          AND aa.ano = EXTRACT(YEAR FROM now())::INTEGER
    ),
    contract_stats AS (
        SELECT 
            COUNT(DISTINCT a.id) as contract_count,
            COALESCE(SUM(a.area_arrendada), 0) as total_area,
            COALESCE(SUM(cyc.custo_total), 0) as total_cost,
            CASE 
                WHEN SUM(a.area_arrendada) > 0 
                THEN (SUM(cyc.custo_total) / SUM(a.area_arrendada))
                ELSE 0 
            END as avg_cost_hectare,
            COUNT(CASE WHEN a.ativo THEN 1 END) as active_count
        FROM arrendamentos a
        LEFT JOIN current_year_costs cyc ON cyc.arrendamento_id = a.id
        WHERE a.organizacao_id = p_organizacao_id
          AND a.safra_id = p_safra_id
    ),
    payment_type_stats AS (
        SELECT jsonb_object_agg(tipo_pagamento, count) as by_payment_type
        FROM (
            SELECT tipo_pagamento, COUNT(*) as count
            FROM arrendamentos
            WHERE organizacao_id = p_organizacao_id
              AND safra_id = p_safra_id
            GROUP BY tipo_pagamento
        ) pt
    )
    SELECT 
        cs.contract_count::INTEGER,
        cs.total_area,
        cs.total_cost,
        cs.avg_cost_hectare::DECIMAL(15, 4),
        COALESCE(pts.by_payment_type, '{}'::JSONB),
        cs.active_count::INTEGER
    FROM contract_stats cs
    CROSS JOIN payment_type_stats pts;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate lease cost per hectare variance
CREATE OR REPLACE FUNCTION get_lease_cost_variance(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_propriedade_id UUID DEFAULT NULL
)
RETURNS TABLE(
    property_id UUID,
    min_cost_hectare DECIMAL(15, 4),
    max_cost_hectare DECIMAL(15, 4),
    avg_cost_hectare DECIMAL(15, 4),
    variance_percentage DECIMAL(8, 4)
) AS $$
BEGIN
    RETURN QUERY
    WITH cost_stats AS (
        SELECT 
            aa.propriedade_id,
            MIN(aa.custo_hectare) as min_cost,
            MAX(aa.custo_hectare) as max_cost,
            AVG(aa.custo_hectare) as avg_cost,
            STDDEV(aa.custo_hectare) as std_cost
        FROM arrendamentos_anos aa
        WHERE aa.organizacao_id = p_organizacao_id
          AND aa.safra_id = p_safra_id
          AND (p_propriedade_id IS NULL OR aa.propriedade_id = p_propriedade_id)
        GROUP BY aa.propriedade_id
    )
    SELECT 
        cs.propriedade_id,
        cs.min_cost,
        cs.max_cost,
        cs.avg_cost::DECIMAL(15, 4),
        CASE 
            WHEN cs.avg_cost > 0 
            THEN ((cs.std_cost / cs.avg_cost) * 100)::DECIMAL(8, 4)
            ELSE 0::DECIMAL(8, 4)
        END
    FROM cost_stats cs
    ORDER BY cs.propriedade_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- PROPERTY IMPROVEMENT FUNCTIONS
-- =============================================================================

-- Function to get property improvement summary
CREATE OR REPLACE FUNCTION get_property_improvement_summary(
    p_organizacao_id UUID,
    p_propriedade_id UUID DEFAULT NULL
)
RETURNS TABLE(
    property_id UUID,
    total_improvements INTEGER,
    total_improvement_value DECIMAL(15, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.propriedade_id,
        COUNT(*)::INTEGER,
        COALESCE(SUM(b.valor), 0)
    FROM benfeitorias b
    WHERE b.organizacao_id = p_organizacao_id
      AND (p_propriedade_id IS NULL OR b.propriedade_id = p_propriedade_id)
    GROUP BY b.propriedade_id
    ORDER BY b.propriedade_id;
END;
$$ LANGUAGE plpgsql STABLE;


-- =============================================================================
-- UTILITY AND CALCULATION FUNCTIONS
-- =============================================================================

-- Function to calculate property utilization rate
CREATE OR REPLACE FUNCTION calculate_property_utilization(
    p_organizacao_id UUID,
    p_propriedade_id UUID DEFAULT NULL
)
RETURNS TABLE(
    property_id UUID,
    property_name TEXT,
    total_area DECIMAL(15, 4),
    cultivated_area DECIMAL(15, 4),
    leased_area DECIMAL(15, 4),
    utilization_percentage DECIMAL(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH lease_areas AS (
        SELECT 
            a.propriedade_id,
            SUM(a.area_arrendada) as total_leased
        FROM arrendamentos a
        WHERE a.organizacao_id = p_organizacao_id
          AND a.ativo = true
          AND (p_propriedade_id IS NULL OR a.propriedade_id = p_propriedade_id)
        GROUP BY a.propriedade_id
    )
    SELECT 
        p.id,
        p.nome,
        p.area_total,
        p.area_cultivada,
        COALESCE(la.total_leased, 0),
        CASE 
            WHEN p.area_total > 0 
            THEN ((COALESCE(p.area_cultivada, 0) + COALESCE(la.total_leased, 0)) / p.area_total * 100)::DECIMAL(5, 2)
            ELSE 0::DECIMAL(5, 2)
        END
    FROM propriedades p
    LEFT JOIN lease_areas la ON la.propriedade_id = p.id
    WHERE p.organizacao_id = p_organizacao_id
      AND (p_propriedade_id IS NULL OR p.id = p_propriedade_id)
    ORDER BY p.nome;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get property financial summary
CREATE OR REPLACE FUNCTION get_property_financial_summary(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_propriedade_id UUID DEFAULT NULL
)
RETURNS TABLE(
    property_id UUID,
    property_name TEXT,
    property_value DECIMAL(15, 2),
    bank_evaluation DECIMAL(15, 2),
    annual_lease_cost DECIMAL(15, 2),
    improvement_value DECIMAL(15, 2),
    total_invested_value DECIMAL(15, 2)
) AS $$
BEGIN
    RETURN QUERY
    WITH current_year AS (
        SELECT EXTRACT(YEAR FROM now())::INTEGER as current_year
    ),
    lease_costs AS (
        SELECT 
            aa.propriedade_id,
            SUM(aa.custo_total) as annual_cost
        FROM arrendamentos_anos aa
        WHERE aa.organizacao_id = p_organizacao_id
          AND aa.safra_id = p_safra_id
          AND aa.ano = (SELECT current_year FROM current_year)
        GROUP BY aa.propriedade_id
    ),
    improvement_values AS (
        SELECT 
            b.propriedade_id,
            SUM(b.valor) as total_improvements
        FROM benfeitorias b
        WHERE b.organizacao_id = p_organizacao_id
        GROUP BY b.propriedade_id
    )
    SELECT 
        p.id,
        p.nome,
        p.valor_atual,
        p.avaliacao_banco,
        COALESCE(lc.annual_cost, 0),
        COALESCE(iv.total_improvements, 0),
        COALESCE(p.valor_atual, 0) + COALESCE(iv.total_improvements, 0)
    FROM propriedades p
    LEFT JOIN lease_costs lc ON lc.propriedade_id = p.id
    LEFT JOIN improvement_values iv ON iv.propriedade_id = p.id
    WHERE p.organizacao_id = p_organizacao_id
      AND (p_propriedade_id IS NULL OR p.id = p_propriedade_id)
    ORDER BY p.nome;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION get_lease_cost_by_year(UUID, UUID, UUID, INTEGER) IS 'Obtém custos de arrendamento para um ano específico';
COMMENT ON FUNCTION get_lease_costs_by_safra(UUID, UUID, UUID) IS 'Retorna todos os custos de arrendamento para uma safra';
COMMENT ON FUNCTION get_lease_cost_evolution(UUID, UUID, UUID) IS 'Retorna evolução de custos de arrendamento ao longo dos anos';
COMMENT ON FUNCTION get_property_portfolio_summary(UUID) IS 'Retorna resumo do portfólio de propriedades da organização';
COMMENT ON FUNCTION get_lease_contract_summary(UUID, UUID) IS 'Retorna resumo dos contratos de arrendamento por safra';
COMMENT ON FUNCTION calculate_property_utilization(UUID, UUID) IS 'Calcula taxa de utilização das propriedades';
COMMENT ON FUNCTION get_property_financial_summary(UUID, UUID, UUID) IS 'Retorna resumo financeiro das propriedades';