-- Funções para o módulo financeiro
-- Cálculos, métricas, operações bulk e utilitários

-- ================================================
-- FUNÇÕES DE CÁLCULO FINANCEIRO
-- ================================================

-- Função para calcular total de dívidas por ano
CREATE OR REPLACE FUNCTION calcular_total_dividas_ano(
    p_organizacao_id UUID,
    p_ano INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
    total_bancarias NUMERIC := 0;
    total_tradings NUMERIC := 0;
    total_imoveis NUMERIC := 0;
    total_geral NUMERIC;
BEGIN
    -- Somar dívidas bancárias do ano
    SELECT COALESCE(SUM((fluxo_pagamento_anual->>p_ano::text)::NUMERIC), 0)
    INTO total_bancarias
    FROM dividas_bancarias 
    WHERE organizacao_id = p_organizacao_id
    AND fluxo_pagamento_anual ? p_ano::text;
    
    -- Somar dívidas de trading do ano (agora parte de dividas_bancarias)
    SELECT COALESCE(SUM((fluxo_pagamento_anual->>p_ano::text)::NUMERIC), 0)
    INTO total_tradings
    FROM dividas_bancarias 
    WHERE organizacao_id = p_organizacao_id
    AND tipo = 'TRADING'
    AND fluxo_pagamento_anual ? p_ano::text;
    
    -- Somar dívidas imóveis do ano
    SELECT COALESCE(SUM((fluxo_pagamento_anual->>p_ano::text)::NUMERIC), 0)
    INTO total_imoveis
    FROM dividas_imoveis 
    WHERE organizacao_id = p_organizacao_id
    AND fluxo_pagamento_anual ? p_ano::text;
    
    total_geral := total_bancarias + total_tradings + total_imoveis;
    
    RETURN total_geral;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular liquidez total
CREATE OR REPLACE FUNCTION calcular_liquidez_total(
    p_organizacao_id UUID
)
RETURNS TABLE(
    total_caixa NUMERIC,
    total_bancos NUMERIC,
    total_investimentos NUMERIC,
    total_geral NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'CAIXA' THEN valor ELSE 0 END), 0) as total_caixa,
        COALESCE(SUM(CASE WHEN tipo = 'BANCO' THEN valor ELSE 0 END), 0) as total_bancos,
        COALESCE(SUM(CASE WHEN tipo = 'INVESTIMENTO' THEN valor ELSE 0 END), 0) as total_investimentos,
        COALESCE(SUM(valor), 0) as total_geral
    FROM fatores_liquidez
    WHERE organizacao_id = p_organizacao_id;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular valor total de estoques
CREATE OR REPLACE FUNCTION calcular_valor_estoques(
    p_organizacao_id UUID
)
RETURNS TABLE(
    total_fertilizantes NUMERIC,
    total_defensivos NUMERIC,
    total_almoxarifado NUMERIC,
    total_commodities NUMERIC,
    total_geral NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(
            (SELECT SUM(valor) FROM estoques 
             WHERE organizacao_id = p_organizacao_id AND tipo = 'FERTILIZANTES'), 0
        ) as total_fertilizantes,
        COALESCE(
            (SELECT SUM(valor) FROM estoques 
             WHERE organizacao_id = p_organizacao_id AND tipo = 'DEFENSIVOS'), 0
        ) as total_defensivos,
        COALESCE(
            (SELECT SUM(valor) FROM estoques 
             WHERE organizacao_id = p_organizacao_id AND tipo = 'ALMOXARIFADO'), 0
        ) as total_almoxarifado,
        COALESCE(
            (SELECT SUM(valor_total) FROM estoques_commodities 
             WHERE organizacao_id = p_organizacao_id), 0
        ) as total_commodities,
        COALESCE(
            (SELECT SUM(valor) FROM estoques WHERE organizacao_id = p_organizacao_id), 0
        ) + COALESCE(
            (SELECT SUM(valor_total) FROM estoques_commodities WHERE organizacao_id = p_organizacao_id), 0
        ) as total_geral;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular indicadores de endividamento
CREATE OR REPLACE FUNCTION calcular_indicadores_endividamento(
    p_organizacao_id UUID,
    p_ano INTEGER
)
RETURNS TABLE(
    divida_total NUMERIC,
    liquidez_total NUMERIC,
    patrimonio_liquido NUMERIC,
    indice_liquidez NUMERIC,
    indice_endividamento NUMERIC
) AS $$
DECLARE
    v_divida_total NUMERIC;
    v_liquidez_total NUMERIC;
    v_patrimonio_total NUMERIC;
BEGIN
    -- Calcular dívida total do ano
    SELECT calcular_total_dividas_ano(p_organizacao_id, p_ano) INTO v_divida_total;
    
    -- Calcular liquidez total
    SELECT total_geral INTO v_liquidez_total
    FROM calcular_liquidez_total(p_organizacao_id);
    
    -- Calcular patrimônio total (estimativa: liquidez + estoques - dívidas)
    SELECT 
        v_liquidez_total + 
        COALESCE((SELECT total_geral FROM calcular_valor_estoques(p_organizacao_id)), 0) - 
        v_divida_total
    INTO v_patrimonio_total;
    
    RETURN QUERY
    SELECT 
        v_divida_total as divida_total,
        v_liquidez_total as liquidez_total,
        v_patrimonio_total as patrimonio_liquido,
        CASE 
            WHEN v_divida_total > 0 THEN v_liquidez_total / v_divida_total 
            ELSE NULL 
        END as indice_liquidez,
        CASE 
            WHEN v_patrimonio_total > 0 THEN v_divida_total / v_patrimonio_total 
            ELSE NULL 
        END as indice_endividamento;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNÇÕES DE ANÁLISE TEMPORAL
-- ================================================

-- Função para obter evolução das dívidas ao longo dos anos
CREATE OR REPLACE FUNCTION obter_evolucao_dividas(
    p_organizacao_id UUID,
    p_ano_inicio INTEGER DEFAULT 2024,
    p_ano_fim INTEGER DEFAULT 2033
)
RETURNS TABLE(
    ano INTEGER,
    dividas_bancarias NUMERIC,
    dividas_tradings NUMERIC,
    dividas_imoveis NUMERIC,
    total_dividas NUMERIC
) AS $$
DECLARE
    v_ano INTEGER;
BEGIN
    FOR v_ano IN p_ano_inicio..p_ano_fim LOOP
        RETURN QUERY
        SELECT 
            v_ano as ano,
            COALESCE(
                (SELECT SUM((fluxo_pagamento_anual->>v_ano::text)::NUMERIC) 
                 FROM dividas_bancarias 
                 WHERE organizacao_id = p_organizacao_id 
                 AND fluxo_pagamento_anual ? v_ano::text), 0
            ) as dividas_bancarias,
            COALESCE(
                (SELECT SUM((fluxo_pagamento_anual->>v_ano::text)::NUMERIC) 
                 FROM dividas_bancarias 
                 WHERE organizacao_id = p_organizacao_id 
                 AND tipo = 'TRADING'
                 AND fluxo_pagamento_anual ? v_ano::text), 0
            ) as dividas_tradings,
            COALESCE(
                (SELECT SUM((fluxo_pagamento_anual->>v_ano::text)::NUMERIC) 
                 FROM dividas_imoveis 
                 WHERE organizacao_id = p_organizacao_id 
                 AND fluxo_pagamento_anual ? v_ano::text), 0
            ) as dividas_imoveis,
            calcular_total_dividas_ano(p_organizacao_id, v_ano) as total_dividas;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular projeção de fluxo de caixa
CREATE OR REPLACE FUNCTION calcular_projecao_fluxo_caixa(
    p_organizacao_id UUID,
    p_ano_inicio INTEGER DEFAULT 2024,
    p_ano_fim INTEGER DEFAULT 2033
)
RETURNS TABLE(
    ano INTEGER,
    entradas_estimadas NUMERIC,
    saidas_dividas NUMERIC,
    saidas_fornecedores NUMERIC,
    fluxo_liquido NUMERIC,
    saldo_acumulado NUMERIC
) AS $$
DECLARE
    v_ano INTEGER;
    v_saldo_acumulado NUMERIC := 0;
    v_liquidez_inicial NUMERIC;
BEGIN
    -- Obter liquidez inicial
    SELECT total_geral INTO v_liquidez_inicial
    FROM calcular_liquidez_total(p_organizacao_id);
    
    v_saldo_acumulado := v_liquidez_inicial;
    
    FOR v_ano IN p_ano_inicio..p_ano_fim LOOP
        DECLARE
            v_saidas_dividas NUMERIC;
            v_saidas_fornecedores NUMERIC;
            v_entradas_estimadas NUMERIC;
            v_fluxo_liquido NUMERIC;
        BEGIN
            -- Calcular saídas de dívidas
            v_saidas_dividas := calcular_total_dividas_ano(p_organizacao_id, v_ano);
            
            -- Calcular saídas para fornecedores
            SELECT COALESCE(SUM((valores_por_ano->>v_ano::text)::NUMERIC), 0)
            INTO v_saidas_fornecedores
            FROM fornecedores 
            WHERE organizacao_id = p_organizacao_id
            AND valores_por_ano ? v_ano::text;
            
            -- Estimar entradas (simplificado - pode ser melhorado com dados reais)
            v_entradas_estimadas := v_saidas_dividas + v_saidas_fornecedores + (v_saldo_acumulado * 0.05);
            
            -- Calcular fluxo líquido
            v_fluxo_liquido := v_entradas_estimadas - v_saidas_dividas - v_saidas_fornecedores;
            
            -- Atualizar saldo acumulado
            v_saldo_acumulado := v_saldo_acumulado + v_fluxo_liquido;
            
            RETURN QUERY
            SELECT 
                v_ano as ano,
                v_entradas_estimadas as entradas_estimadas,
                v_saidas_dividas as saidas_dividas,
                v_saidas_fornecedores as saidas_fornecedores,
                v_fluxo_liquido as fluxo_liquido,
                v_saldo_acumulado as saldo_acumulado;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNÇÕES DE OPERAÇÕES BULK
-- ================================================

-- Função para inserir múltiplas dívidas bancárias
CREATE OR REPLACE FUNCTION inserir_dividas_bancarias_bulk(
    p_organizacao_id UUID,
    p_dividas JSONB
)
RETURNS INTEGER AS $$
DECLARE
    divida_record JSONB;
    contador INTEGER := 0;
BEGIN
    FOR divida_record IN SELECT jsonb_array_elements(p_dividas)
    LOOP
        INSERT INTO dividas_bancarias (
            organizacao_id,
            modalidade,
            instituicao_bancaria,
            ano_contratacao,
            indexador,
            taxa_real,
            fluxo_pagamento_anual,
            moeda
        ) VALUES (
            p_organizacao_id,
            (divida_record->>'modalidade')::divida_modalidade,
            divida_record->>'instituicao_bancaria',
            (divida_record->>'ano_contratacao')::INTEGER,
            divida_record->>'indexador',
            (divida_record->>'taxa_real')::NUMERIC,
            divida_record->'fluxo_pagamento_anual',
            (divida_record->>'moeda')::moeda_tipo
        );
        
        contador := contador + 1;
    END LOOP;
    
    RETURN contador;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar múltiplos fatores de liquidez
CREATE OR REPLACE FUNCTION atualizar_fatores_liquidez_bulk(
    p_organizacao_id UUID,
    p_fatores JSONB
)
RETURNS INTEGER AS $$
DECLARE
    fator_record JSONB;
    contador INTEGER := 0;
BEGIN
    FOR fator_record IN SELECT jsonb_array_elements(p_fatores)
    LOOP
        INSERT INTO fatores_liquidez (
            organizacao_id,
            tipo,
            valor
        ) VALUES (
            p_organizacao_id,
            (fator_record->>'tipo')::fator_liquidez_tipo,
            (fator_record->>'valor')::NUMERIC
        )
        ON CONFLICT (organizacao_id, tipo) 
        DO UPDATE SET 
            valor = EXCLUDED.valor,
            updated_at = CURRENT_TIMESTAMP;
        
        contador := contador + 1;
    END LOOP;
    
    RETURN contador;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNÇÕES DE RELATÓRIO E ANÁLISE
-- ================================================

-- Função para gerar resumo financeiro completo
CREATE OR REPLACE FUNCTION gerar_resumo_financeiro(
    p_organizacao_id UUID
)
RETURNS TABLE(
    categoria TEXT,
    subcategoria TEXT,
    valor NUMERIC,
    moeda TEXT,
    percentual_total NUMERIC
) AS $$
DECLARE
    total_ativo NUMERIC;
BEGIN
    -- Calcular total de ativos
    SELECT 
        COALESCE((SELECT total_geral FROM calcular_liquidez_total(p_organizacao_id)), 0) +
        COALESCE((SELECT total_geral FROM calcular_valor_estoques(p_organizacao_id)), 0) +
        COALESCE((SELECT SUM(valor) FROM contratos_recebiveis WHERE organizacao_id = p_organizacao_id), 0) +
        COALESCE((SELECT SUM(valor) FROM adiantamentos_fornecedores WHERE organizacao_id = p_organizacao_id), 0) +
        COALESCE((SELECT SUM(valor) FROM emprestimos_terceiros WHERE organizacao_id = p_organizacao_id), 0)
    INTO total_ativo;
    
    -- Retornar dados de liquidez
    RETURN QUERY
    SELECT 
        'LIQUIDEZ'::TEXT as categoria,
        CASE tipo 
            WHEN 'CAIXA' THEN 'Caixa'
            WHEN 'BANCO' THEN 'Bancos'
            WHEN 'INVESTIMENTO' THEN 'Investimentos'
        END as subcategoria,
        fl.valor as valor,
        'BRL'::TEXT as moeda,
        CASE WHEN total_ativo > 0 THEN (fl.valor / total_ativo * 100) ELSE 0 END as percentual_total
    FROM fatores_liquidez fl
    WHERE fl.organizacao_id = p_organizacao_id;
    
    -- Retornar dados de estoques
    RETURN QUERY
    SELECT 
        'ESTOQUES'::TEXT as categoria,
        CASE tipo 
            WHEN 'FERTILIZANTES' THEN 'Fertilizantes'
            WHEN 'DEFENSIVOS' THEN 'Defensivos'
            WHEN 'ALMOXARIFADO' THEN 'Almoxarifado'
        END as subcategoria,
        e.valor as valor,
        'BRL'::TEXT as moeda,
        CASE WHEN total_ativo > 0 THEN (e.valor / total_ativo * 100) ELSE 0 END as percentual_total
    FROM estoques e
    WHERE e.organizacao_id = p_organizacao_id;
    
    -- Retornar dados de commodities
    RETURN QUERY
    SELECT 
        'COMMODITIES'::TEXT as categoria,
        commodity::TEXT as subcategoria,
        valor_total as valor,
        'BRL'::TEXT as moeda,
        CASE WHEN total_ativo > 0 THEN (valor_total / total_ativo * 100) ELSE 0 END as percentual_total
    FROM estoques_commodities
    WHERE organizacao_id = p_organizacao_id;
    
    -- Retornar dados de recebíveis
    RETURN QUERY
    SELECT 
        'RECEBIVEIS'::TEXT as categoria,
        'Contratos a Receber'::TEXT as subcategoria,
        SUM(valor) as valor,
        'BRL'::TEXT as moeda,
        CASE WHEN total_ativo > 0 THEN (SUM(valor) / total_ativo * 100) ELSE 0 END as percentual_total
    FROM contratos_recebiveis
    WHERE organizacao_id = p_organizacao_id
    GROUP BY organizacao_id
    HAVING SUM(valor) > 0;
    
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNÇÕES DE VALIDAÇÃO E LIMPEZA
-- ================================================

-- Função para validar consistência dos dados financeiros
CREATE OR REPLACE FUNCTION validar_consistencia_financeira(
    p_organizacao_id UUID
)
RETURNS TABLE(
    tabela TEXT,
    problema TEXT,
    quantidade INTEGER
) AS $$
BEGIN
    -- Verificar dívidas com fluxos zerados
    RETURN QUERY
    SELECT 
        'dividas_bancarias'::TEXT as tabela,
        'Dívidas com todos os fluxos zerados'::TEXT as problema,
        COUNT(*)::INTEGER as quantidade
    FROM dividas_bancarias db
    WHERE db.organizacao_id = p_organizacao_id
    AND NOT EXISTS (
        SELECT 1 
        FROM jsonb_each_text(db.fluxo_pagamento_anual) 
        WHERE value::NUMERIC > 0
    )
    GROUP BY organizacao_id
    HAVING COUNT(*) > 0;
    
    -- Verificar fatores de liquidez negativos
    RETURN QUERY
    SELECT 
        'fatores_liquidez'::TEXT as tabela,
        'Fatores com valores negativos'::TEXT as problema,
        COUNT(*)::INTEGER as quantidade
    FROM fatores_liquidez fl
    WHERE fl.organizacao_id = p_organizacao_id
    AND fl.valor < 0
    GROUP BY organizacao_id
    HAVING COUNT(*) > 0;
    
    -- Verificar estoques negativos
    RETURN QUERY
    SELECT 
        'estoques'::TEXT as tabela,
        'Estoques com valores negativos'::TEXT as problema,
        COUNT(*)::INTEGER as quantidade
    FROM estoques e
    WHERE e.organizacao_id = p_organizacao_id
    AND e.valor < 0
    GROUP BY organizacao_id
    HAVING COUNT(*) > 0;
    
END;
$$ LANGUAGE plpgsql;

-- Função para limpar dados inconsistentes
CREATE OR REPLACE FUNCTION limpar_dados_financeiros(
    p_organizacao_id UUID
)
RETURNS TEXT AS $$
DECLARE
    resultado TEXT := '';
    contador INTEGER;
BEGIN
    -- Remover dívidas com fluxos todos zerados
    DELETE FROM dividas_bancarias 
    WHERE organizacao_id = p_organizacao_id
    AND NOT EXISTS (
        SELECT 1 
        FROM jsonb_each_text(fluxo_pagamento_anual) 
        WHERE value::NUMERIC > 0
    );
    
    GET DIAGNOSTICS contador = ROW_COUNT;
    resultado := resultado || format('Removidas %s dívidas bancárias zeradas. ', contador);
    
    -- Corrigir valores negativos em fatores de liquidez
    UPDATE fatores_liquidez 
    SET valor = 0 
    WHERE organizacao_id = p_organizacao_id 
    AND valor < 0;
    
    GET DIAGNOSTICS contador = ROW_COUNT;
    resultado := resultado || format('Corrigidos %s fatores de liquidez negativos. ', contador);
    
    -- Corrigir valores negativos em estoques
    UPDATE estoques 
    SET valor = 0 
    WHERE organizacao_id = p_organizacao_id 
    AND valor < 0;
    
    GET DIAGNOSTICS contador = ROW_COUNT;
    resultado := resultado || format('Corrigidos %s estoques negativos. ', contador);
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- COMENTÁRIOS DAS FUNÇÕES
-- ================================================

COMMENT ON FUNCTION calcular_total_dividas_ano(UUID, INTEGER) IS 'Calcula o total de dívidas (bancárias + tradings + imóveis) para um ano específico';
COMMENT ON FUNCTION calcular_liquidez_total(UUID) IS 'Calcula o total de liquidez por tipo (caixa, bancos, investimentos)';
COMMENT ON FUNCTION calcular_indicadores_endividamento(UUID, INTEGER) IS 'Calcula indicadores de endividamento e liquidez';
COMMENT ON FUNCTION obter_evolucao_dividas(UUID, INTEGER, INTEGER) IS 'Retorna a evolução das dívidas ao longo dos anos';
COMMENT ON FUNCTION inserir_dividas_bancarias_bulk(UUID, JSONB) IS 'Insere múltiplas dívidas bancárias em uma operação';
COMMENT ON FUNCTION gerar_resumo_financeiro(UUID) IS 'Gera um resumo completo da situação financeira';
COMMENT ON FUNCTION validar_consistencia_financeira(UUID) IS 'Valida a consistência dos dados financeiros';