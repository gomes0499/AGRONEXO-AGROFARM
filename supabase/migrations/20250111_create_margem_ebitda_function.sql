-- Create calculate_margem_ebitda function to use real DRE data exactly like frontend

CREATE OR REPLACE FUNCTION calculate_margem_ebitda(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_scenario_id UUID DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
    v_receita_bruta NUMERIC := 0;
    v_ebitda NUMERIC := 0;
    v_margem_ebitda NUMERIC := 0;
    v_safra_nome TEXT;
    v_safra_ano INTEGER;
BEGIN
    -- Get safra info
    SELECT nome, ano_inicio INTO v_safra_nome, v_safra_ano 
    FROM safras WHERE id = p_safra_id;
    
    -- Calculate exactly like DRE: Margem EBITDA = EBITDA / Receita Bruta * 100
    
    -- 1. Calculate Receita Bruta (Agricola + Pecuaria + Outras)
    WITH receita_data AS (
        -- Receita Agrícola
        SELECT 
            'agricola' as tipo,
            COALESCE(SUM(
                CASE 
                    WHEN r.valores_por_ano ? v_safra_ano::text THEN
                        (r.valores_por_ano->v_safra_ano::text)::numeric
                    ELSE 0
                END
            ), 0) as valor
        FROM receitas r
        WHERE r.organizacao_id = p_organizacao_id 
        AND r.categoria = 'AGRICOLA'
        
        UNION ALL
        
        -- Receita Pecuária
        SELECT 
            'pecuaria' as tipo,
            COALESCE(SUM(
                CASE 
                    WHEN r.valores_por_ano ? v_safra_ano::text THEN
                        (r.valores_por_ano->v_safra_ano::text)::numeric
                    ELSE 0
                END
            ), 0) as valor
        FROM receitas r
        WHERE r.organizacao_id = p_organizacao_id 
        AND r.categoria = 'PECUARIA'
        
        UNION ALL
        
        -- Outras Receitas
        SELECT 
            'outras' as tipo,
            COALESCE(SUM(
                CASE 
                    WHEN r.valores_por_ano ? v_safra_ano::text THEN
                        (r.valores_por_ano->v_safra_ano::text)::numeric
                    ELSE 0
                END
            ), 0) as valor
        FROM receitas r
        WHERE r.organizacao_id = p_organizacao_id 
        AND r.categoria NOT IN ('AGRICOLA', 'PECUARIA')
    )
    SELECT COALESCE(SUM(valor), 0) INTO v_receita_bruta FROM receita_data;
    
    -- 2. Calculate EBITDA (Receita Bruta - Custos - Despesas Operacionais)
    WITH ebitda_data AS (
        -- Custos diretos
        SELECT 
            COALESCE(SUM(
                CASE 
                    WHEN c.valores_por_ano ? v_safra_ano::text THEN
                        (c.valores_por_ano->v_safra_ano::text)::numeric
                    ELSE 0
                END
            ), 0) as custos_diretos
        FROM custos c
        WHERE c.organizacao_id = p_organizacao_id
    ),
    despesas_data AS (
        -- Despesas operacionais (não incluir financeiras)
        SELECT 
            COALESCE(SUM(
                CASE 
                    WHEN od.valores_por_ano ? v_safra_ano::text THEN
                        (od.valores_por_ano->v_safra_ano::text)::numeric
                    ELSE 0
                END
            ), 0) as despesas_operacionais
        FROM outras_despesas od
        WHERE od.organizacao_id = p_organizacao_id
        AND od.categoria NOT IN ('DESPESAS_FINANCEIRAS', 'JUROS', 'IMPOSTOS')
    )
    SELECT 
        v_receita_bruta - ed.custos_diretos - dd.despesas_operacionais
    INTO v_ebitda
    FROM ebitda_data ed, despesas_data dd;
    
    -- 3. Calculate Margem EBITDA = EBITDA / Receita Bruta * 100
    IF v_receita_bruta > 0 THEN
        v_margem_ebitda := (v_ebitda / v_receita_bruta) * 100;
    ELSE
        v_margem_ebitda := 0;
    END IF;
    
    RETURN v_margem_ebitda;
END;
$$ LANGUAGE plpgsql;