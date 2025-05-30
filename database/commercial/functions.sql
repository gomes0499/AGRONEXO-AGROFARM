-- =====================================================
-- COMMERCIAL MODULE - FUNCTIONS
-- =====================================================
-- Query helpers and business logic for commercial module

-- =====================================================
-- QUERY HELPER FUNCTIONS
-- =====================================================

-- Get vendas pecuaria by organization and safra
CREATE OR REPLACE FUNCTION get_vendas_pecuaria_by_org_safra(
    p_organizacao_id UUID,
    p_safra_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    propriedade_id UUID,
    propriedade_nome TEXT,
    safra_id UUID,
    safra_nome TEXT,
    receita_operacional_bruta DECIMAL(15,2),
    impostos_vendas DECIMAL(15,2),
    comissao_vendas DECIMAL(15,2),
    logistica_entregas DECIMAL(15,2),
    custo_mercadorias_vendidas DECIMAL(15,2),
    despesas_gerais DECIMAL(15,2),
    imposto_renda DECIMAL(15,2),
    receita_liquida DECIMAL(15,2),
    margem_bruta DECIMAL(15,2),
    margem_liquida DECIMAL(15,2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vp.id,
        vp.propriedade_id,
        p.nome as propriedade_nome,
        vp.safra_id,
        s.nome as safra_nome,
        vp.receita_operacional_bruta,
        vp.impostos_vendas,
        vp.comissao_vendas,
        vp.logistica_entregas,
        vp.custo_mercadorias_vendidas,
        vp.despesas_gerais,
        vp.imposto_renda,
        -- Calculated fields
        (vp.receita_operacional_bruta - vp.impostos_vendas - vp.comissao_vendas - vp.logistica_entregas)::DECIMAL(15,2) as receita_liquida,
        (vp.receita_operacional_bruta - vp.impostos_vendas - vp.comissao_vendas - vp.logistica_entregas - vp.custo_mercadorias_vendidas)::DECIMAL(15,2) as margem_bruta,
        (vp.receita_operacional_bruta - vp.impostos_vendas - vp.comissao_vendas - vp.logistica_entregas - vp.custo_mercadorias_vendidas - vp.despesas_gerais - vp.imposto_renda)::DECIMAL(15,2) as margem_liquida,
        vp.created_at,
        vp.updated_at
    FROM vendas_pecuaria vp
    INNER JOIN propriedades p ON vp.propriedade_id = p.id
    INNER JOIN safras s ON vp.safra_id = s.id
    WHERE vp.organizacao_id = p_organizacao_id
    AND (p_safra_id IS NULL OR vp.safra_id = p_safra_id)
    ORDER BY s.nome DESC, p.nome;
END;
$$ LANGUAGE plpgsql;

-- Get vendas sementes by organization, safra and cultura
CREATE OR REPLACE FUNCTION get_vendas_sementes_by_org_safra_cultura(
    p_organizacao_id UUID,
    p_safra_id UUID DEFAULT NULL,
    p_cultura_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    propriedade_id UUID,
    propriedade_nome TEXT,
    cultura_id UUID,
    cultura_nome TEXT,
    safra_id UUID,
    safra_nome TEXT,
    receita_operacional_bruta DECIMAL(15,2),
    impostos_vendas DECIMAL(15,2),
    comissao_vendas DECIMAL(15,2),
    logistica_entregas DECIMAL(15,2),
    custo_mercadorias_vendidas DECIMAL(15,2),
    despesas_gerais DECIMAL(15,2),
    imposto_renda DECIMAL(15,2),
    receita_liquida DECIMAL(15,2),
    margem_bruta DECIMAL(15,2),
    margem_liquida DECIMAL(15,2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vs.id,
        vs.propriedade_id,
        p.nome as propriedade_nome,
        vs.cultura_id,
        c.nome as cultura_nome,
        vs.safra_id,
        s.nome as safra_nome,
        vs.receita_operacional_bruta,
        vs.impostos_vendas,
        vs.comissao_vendas,
        vs.logistica_entregas,
        vs.custo_mercadorias_vendidas,
        vs.despesas_gerais,
        vs.imposto_renda,
        -- Calculated fields
        (vs.receita_operacional_bruta - vs.impostos_vendas - vs.comissao_vendas - vs.logistica_entregas)::DECIMAL(15,2) as receita_liquida,
        (vs.receita_operacional_bruta - vs.impostos_vendas - vs.comissao_vendas - vs.logistica_entregas - vs.custo_mercadorias_vendidas)::DECIMAL(15,2) as margem_bruta,
        (vs.receita_operacional_bruta - vs.impostos_vendas - vs.comissao_vendas - vs.logistica_entregas - vs.custo_mercadorias_vendidas - vs.despesas_gerais - vs.imposto_renda)::DECIMAL(15,2) as margem_liquida,
        vs.created_at,
        vs.updated_at
    FROM vendas_sementes vs
    INNER JOIN propriedades p ON vs.propriedade_id = p.id
    INNER JOIN culturas c ON vs.cultura_id = c.id
    INNER JOIN safras s ON vs.safra_id = s.id
    WHERE vs.organizacao_id = p_organizacao_id
    AND (p_safra_id IS NULL OR vs.safra_id = p_safra_id)
    AND (p_cultura_id IS NULL OR vs.cultura_id = p_cultura_id)
    ORDER BY s.nome DESC, c.nome, p.nome;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- BUSINESS LOGIC FUNCTIONS
-- =====================================================

-- Calculate commercial summary by organization and safra
CREATE OR REPLACE FUNCTION get_commercial_summary_by_org_safra(
    p_organizacao_id UUID,
    p_safra_id UUID
)
RETURNS TABLE (
    total_receita_bruta_pecuaria DECIMAL(15,2),
    total_receita_liquida_pecuaria DECIMAL(15,2),
    total_margem_bruta_pecuaria DECIMAL(15,2),
    total_margem_liquida_pecuaria DECIMAL(15,2),
    total_receita_bruta_sementes DECIMAL(15,2),
    total_receita_liquida_sementes DECIMAL(15,2),
    total_margem_bruta_sementes DECIMAL(15,2),
    total_margem_liquida_sementes DECIMAL(15,2),
    total_receita_bruta_geral DECIMAL(15,2),
    total_receita_liquida_geral DECIMAL(15,2),
    total_margem_bruta_geral DECIMAL(15,2),
    total_margem_liquida_geral DECIMAL(15,2),
    count_vendas_pecuaria INTEGER,
    count_vendas_sementes INTEGER
) AS $$
DECLARE
    pecuaria_stats RECORD;
    sementes_stats RECORD;
BEGIN
    -- Calculate pecuaria totals
    SELECT 
        COALESCE(SUM(receita_operacional_bruta), 0) as receita_bruta,
        COALESCE(SUM(receita_operacional_bruta - impostos_vendas - comissao_vendas - logistica_entregas), 0) as receita_liquida,
        COALESCE(SUM(receita_operacional_bruta - impostos_vendas - comissao_vendas - logistica_entregas - custo_mercadorias_vendidas), 0) as margem_bruta,
        COALESCE(SUM(receita_operacional_bruta - impostos_vendas - comissao_vendas - logistica_entregas - custo_mercadorias_vendidas - despesas_gerais - imposto_renda), 0) as margem_liquida,
        COUNT(*) as count_vendas
    INTO pecuaria_stats
    FROM vendas_pecuaria
    WHERE organizacao_id = p_organizacao_id AND safra_id = p_safra_id;
    
    -- Calculate sementes totals
    SELECT 
        COALESCE(SUM(receita_operacional_bruta), 0) as receita_bruta,
        COALESCE(SUM(receita_operacional_bruta - impostos_vendas - comissao_vendas - logistica_entregas), 0) as receita_liquida,
        COALESCE(SUM(receita_operacional_bruta - impostos_vendas - comissao_vendas - logistica_entregas - custo_mercadorias_vendidas), 0) as margem_bruta,
        COALESCE(SUM(receita_operacional_bruta - impostos_vendas - comissao_vendas - logistica_entregas - custo_mercadorias_vendidas - despesas_gerais - imposto_renda), 0) as margem_liquida,
        COUNT(*) as count_vendas
    INTO sementes_stats
    FROM vendas_sementes
    WHERE organizacao_id = p_organizacao_id AND safra_id = p_safra_id;
    
    -- Return consolidated results
    RETURN QUERY
    SELECT 
        pecuaria_stats.receita_bruta::DECIMAL(15,2),
        pecuaria_stats.receita_liquida::DECIMAL(15,2),
        pecuaria_stats.margem_bruta::DECIMAL(15,2),
        pecuaria_stats.margem_liquida::DECIMAL(15,2),
        sementes_stats.receita_bruta::DECIMAL(15,2),
        sementes_stats.receita_liquida::DECIMAL(15,2),
        sementes_stats.margem_bruta::DECIMAL(15,2),
        sementes_stats.margem_liquida::DECIMAL(15,2),
        (pecuaria_stats.receita_bruta + sementes_stats.receita_bruta)::DECIMAL(15,2),
        (pecuaria_stats.receita_liquida + sementes_stats.receita_liquida)::DECIMAL(15,2),
        (pecuaria_stats.margem_bruta + sementes_stats.margem_bruta)::DECIMAL(15,2),
        (pecuaria_stats.margem_liquida + sementes_stats.margem_liquida)::DECIMAL(15,2),
        pecuaria_stats.count_vendas::INTEGER,
        sementes_stats.count_vendas::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Get commercial performance by cultura
CREATE OR REPLACE FUNCTION get_commercial_performance_by_cultura(
    p_organizacao_id UUID,
    p_safra_id UUID DEFAULT NULL
)
RETURNS TABLE (
    cultura_id UUID,
    cultura_nome TEXT,
    total_receita_bruta DECIMAL(15,2),
    total_receita_liquida DECIMAL(15,2),
    total_margem_bruta DECIMAL(15,2),
    total_margem_liquida DECIMAL(15,2),
    margem_bruta_percentual DECIMAL(5,2),
    margem_liquida_percentual DECIMAL(5,2),
    count_vendas INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as cultura_id,
        c.nome as cultura_nome,
        COALESCE(SUM(vs.receita_operacional_bruta), 0)::DECIMAL(15,2) as total_receita_bruta,
        COALESCE(SUM(vs.receita_operacional_bruta - vs.impostos_vendas - vs.comissao_vendas - vs.logistica_entregas), 0)::DECIMAL(15,2) as total_receita_liquida,
        COALESCE(SUM(vs.receita_operacional_bruta - vs.impostos_vendas - vs.comissao_vendas - vs.logistica_entregas - vs.custo_mercadorias_vendidas), 0)::DECIMAL(15,2) as total_margem_bruta,
        COALESCE(SUM(vs.receita_operacional_bruta - vs.impostos_vendas - vs.comissao_vendas - vs.logistica_entregas - vs.custo_mercadorias_vendidas - vs.despesas_gerais - vs.imposto_renda), 0)::DECIMAL(15,2) as total_margem_liquida,
        CASE 
            WHEN SUM(vs.receita_operacional_bruta) > 0 THEN 
                (SUM(vs.receita_operacional_bruta - vs.impostos_vendas - vs.comissao_vendas - vs.logistica_entregas - vs.custo_mercadorias_vendidas) * 100.0 / SUM(vs.receita_operacional_bruta))::DECIMAL(5,2)
            ELSE 0 
        END as margem_bruta_percentual,
        CASE 
            WHEN SUM(vs.receita_operacional_bruta) > 0 THEN 
                (SUM(vs.receita_operacional_bruta - vs.impostos_vendas - vs.comissao_vendas - vs.logistica_entregas - vs.custo_mercadorias_vendidas - vs.despesas_gerais - vs.imposto_renda) * 100.0 / SUM(vs.receita_operacional_bruta))::DECIMAL(5,2)
            ELSE 0 
        END as margem_liquida_percentual,
        COUNT(vs.id)::INTEGER as count_vendas
    FROM culturas c
    LEFT JOIN vendas_sementes vs ON c.id = vs.cultura_id 
        AND vs.organizacao_id = p_organizacao_id
        AND (p_safra_id IS NULL OR vs.safra_id = p_safra_id)
    WHERE c.organizacao_id = p_organizacao_id
    GROUP BY c.id, c.nome
    HAVING COUNT(vs.id) > 0 OR p_safra_id IS NULL
    ORDER BY total_receita_bruta DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Delete commercial data by organization (for cleanup/reset)
CREATE OR REPLACE FUNCTION delete_commercial_data_by_organization(
    p_organizacao_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Delete vendas_pecuaria
    DELETE FROM vendas_pecuaria WHERE organizacao_id = p_organizacao_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Delete vendas_sementes
    DELETE FROM vendas_sementes WHERE organizacao_id = p_organizacao_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Delete precos_comerciais
    DELETE FROM precos_comerciais WHERE organizacao_id = p_organizacao_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Delete planejamento_vendas
    DELETE FROM planejamento_vendas WHERE organizacao_id = p_organizacao_id;
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;