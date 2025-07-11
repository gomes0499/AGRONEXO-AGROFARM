-- Fix the calculate_rating_sr_prime function to include metric type in details

CREATE OR REPLACE FUNCTION calculate_rating_sr_prime(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_modelo_id UUID DEFAULT NULL,
    p_scenario_id UUID DEFAULT NULL
) RETURNS TABLE (
    pontuacao_total NUMERIC,
    rating_letra VARCHAR,
    rating_descricao TEXT,
    detalhes JSONB
) AS $$
DECLARE
    v_modelo_id UUID;
    v_pontuacao_total NUMERIC := 0;
    v_rating_letra VARCHAR;
    v_rating_descricao TEXT;
    v_detalhes JSONB := '[]'::jsonb;
    v_metric_score NUMERIC;
    v_metric_nota NUMERIC;
    v_metric_value NUMERIC;
    v_metric_weight NUMERIC;
    v_safra_name TEXT;
    v_scenario_name TEXT;
    r RECORD;
BEGIN
    -- Get safra name
    SELECT nome INTO v_safra_name FROM safras WHERE id = p_safra_id;
    
    -- Get scenario name
    IF p_scenario_id IS NOT NULL THEN
        SELECT name INTO v_scenario_name FROM projection_scenarios WHERE id = p_scenario_id;
    ELSE
        v_scenario_name := 'Base';
    END IF;

    -- Determinar modelo a usar
    IF p_modelo_id IS NOT NULL THEN
        v_modelo_id := p_modelo_id;
    ELSE
        -- Buscar modelo padrão da organização
        SELECT id INTO v_modelo_id
        FROM rating_models
        WHERE organizacao_id = p_organizacao_id
        AND is_default = true
        AND is_active = true
        LIMIT 1;
        
        -- Se não houver, usar modelo global
        IF v_modelo_id IS NULL THEN
            SELECT id INTO v_modelo_id
            FROM rating_models
            WHERE organizacao_id IS NULL
            AND is_default = true
            AND is_active = true
            LIMIT 1;
        END IF;
    END IF;

    -- Calcular cada métrica
    FOR r IN 
        SELECT 
            rm.codigo,
            rm.nome,
            rm.source_type,
            rm.tipo,
            rm.peso,
            rm.formula
        FROM rating_metrics rm
        WHERE rm.is_active = true
        AND rm.is_predefined = true
    LOOP
        v_metric_score := 0;
        v_metric_nota := NULL;
        v_metric_value := NULL;
        
        -- Calcular ou buscar valor da métrica
        IF r.source_type = 'MANUAL' THEN
            -- Buscar avaliação manual
            SELECT score, score * 20 INTO v_metric_nota, v_metric_score
            FROM rating_manual_evaluations
            WHERE organizacao_id = p_organizacao_id
            AND safra_id = p_safra_id
            AND metric_code = r.codigo
            AND (scenario_id = p_scenario_id OR (scenario_id IS NULL AND p_scenario_id IS NULL))
            ORDER BY evaluated_at DESC
            LIMIT 1;
            
            -- Se não houver avaliação, usar valor médio (3 = 60 pontos)
            IF v_metric_score IS NULL THEN
                v_metric_nota := 3;
                v_metric_score := 60;
            END IF;
            
            v_metric_value := v_metric_nota;
        ELSIF r.source_type = 'CALCULATED' THEN
            -- Call specific calculation functions based on metric code
            CASE r.codigo
                WHEN 'LIQUIDEZ_CORRENTE' THEN
                    v_metric_value := calculate_liquidez_corrente(p_organizacao_id, p_safra_id, p_scenario_id);
                WHEN 'DIVIDA_EBITDA' THEN
                    v_metric_value := calculate_divida_estrutural_ebitda(p_organizacao_id, p_safra_id, p_scenario_id);
                WHEN 'MARGEM_EBITDA' THEN
                    v_metric_value := calculate_margem_ebitda(p_organizacao_id, p_safra_id, p_scenario_id);
                WHEN 'DIVIDA_FATURAMENTO' THEN
                    v_metric_value := calculate_divida_estrutural_faturamento(p_organizacao_id, p_safra_id, p_scenario_id);
                WHEN 'DIVIDA_PATRIMONIO_LIQUIDO' THEN
                    v_metric_value := calculate_divida_estrutural_patrimonio_liquido(p_organizacao_id, p_safra_id, p_scenario_id);
                WHEN 'LTV' THEN
                    v_metric_value := calculate_ltv(p_organizacao_id, p_safra_id, p_scenario_id);
                WHEN 'TENDENCIA_PRODUTIVIDADE' THEN
                    v_metric_value := calculate_tendencia_produtividade(p_organizacao_id);
                ELSE
                    v_metric_value := 0; -- Default if calculation not implemented
            END CASE;
            
            -- Convert value to score (0-100)
            -- This is a simplified scoring - in production, you'd use thresholds
            v_metric_score := CASE
                WHEN r.codigo = 'LIQUIDEZ_CORRENTE' THEN
                    CASE 
                        WHEN v_metric_value >= 2.0 THEN 100
                        WHEN v_metric_value >= 1.5 THEN 80
                        WHEN v_metric_value >= 1.2 THEN 60
                        WHEN v_metric_value >= 1.0 THEN 40
                        ELSE 20
                    END
                WHEN r.codigo = 'DIVIDA_EBITDA' THEN
                    CASE 
                        WHEN v_metric_value <= 1.0 THEN 100
                        WHEN v_metric_value <= 2.0 THEN 80
                        WHEN v_metric_value <= 3.0 THEN 60
                        WHEN v_metric_value <= 4.0 THEN 40
                        ELSE 20
                    END
                WHEN r.codigo = 'MARGEM_EBITDA' THEN
                    CASE 
                        WHEN v_metric_value >= 30 THEN 100
                        WHEN v_metric_value >= 25 THEN 80
                        WHEN v_metric_value >= 20 THEN 60
                        WHEN v_metric_value >= 15 THEN 40
                        ELSE 20
                    END
                WHEN r.codigo = 'LTV' THEN
                    CASE 
                        WHEN v_metric_value <= 0.3 THEN 100
                        WHEN v_metric_value <= 0.4 THEN 80
                        WHEN v_metric_value <= 0.5 THEN 60
                        WHEN v_metric_value <= 0.6 THEN 40
                        ELSE 20
                    END
                ELSE 70 -- Default score
            END;
        END IF;
        
        -- Adicionar ao total ponderado
        v_pontuacao_total := v_pontuacao_total + (v_metric_score * r.peso / 100);
        
        -- Adicionar aos detalhes
        v_detalhes := v_detalhes || jsonb_build_object(
            'codigo', r.codigo,
            'nome', r.nome,
            'tipo', r.tipo,
            'source_type', r.source_type,
            'peso', r.peso,
            'valor', v_metric_value,
            'nota', v_metric_nota,
            'pontuacao', v_metric_score,
            'contribuicao', v_metric_score * r.peso / 100
        );
    END LOOP;

    -- Determinar classificação
    v_rating_letra := CASE
        WHEN v_pontuacao_total = 100 THEN 'AAA'
        WHEN v_pontuacao_total = 99 THEN 'AA'
        WHEN v_pontuacao_total >= 97 THEN 'A'
        WHEN v_pontuacao_total >= 96 THEN 'A1'
        WHEN v_pontuacao_total >= 94 THEN 'A2'
        WHEN v_pontuacao_total >= 92 THEN 'A3'
        WHEN v_pontuacao_total >= 90 THEN 'A4'
        WHEN v_pontuacao_total = 89 THEN 'BAA1'
        WHEN v_pontuacao_total >= 86 THEN 'BAA2'
        WHEN v_pontuacao_total >= 83 THEN 'BAA3'
        WHEN v_pontuacao_total >= 80 THEN 'BAA4'
        WHEN v_pontuacao_total = 79 THEN 'BA1'
        WHEN v_pontuacao_total >= 76 THEN 'BA2'
        WHEN v_pontuacao_total >= 73 THEN 'BA3'
        WHEN v_pontuacao_total >= 70 THEN 'BA4'
        WHEN v_pontuacao_total >= 60 THEN 'BA5'
        WHEN v_pontuacao_total >= 50 THEN 'BA6'
        WHEN v_pontuacao_total >= 40 THEN 'B1'
        WHEN v_pontuacao_total >= 30 THEN 'B2'
        WHEN v_pontuacao_total >= 26 THEN 'B3'
        WHEN v_pontuacao_total >= 20 THEN 'C1'
        WHEN v_pontuacao_total = 19 THEN 'C2'
        WHEN v_pontuacao_total >= 17 THEN 'C3'
        WHEN v_pontuacao_total >= 14 THEN 'D1'
        WHEN v_pontuacao_total >= 12 THEN 'D2'
        WHEN v_pontuacao_total >= 10 THEN 'D3'
        WHEN v_pontuacao_total = 9 THEN 'E'
        WHEN v_pontuacao_total >= 6 THEN 'F'
        WHEN v_pontuacao_total >= 3 THEN 'G'
        ELSE 'H'
    END;

    -- Determinar descrição
    v_rating_descricao := CASE
        WHEN v_pontuacao_total >= 90 THEN 'Excelente capacidade de pagamento, gestão superior e práticas sustentáveis exemplares'
        WHEN v_pontuacao_total >= 80 THEN 'Forte capacidade de pagamento, boa gestão e práticas sustentáveis sólidas'
        WHEN v_pontuacao_total >= 70 THEN 'Boa capacidade de pagamento, gestão adequada e boas práticas sustentáveis'
        WHEN v_pontuacao_total >= 60 THEN 'Capacidade de pagamento adequada, gestão satisfatória com algumas oportunidades de melhoria'
        WHEN v_pontuacao_total >= 50 THEN 'Capacidade de pagamento aceitável, mas vulnerável a condições adversas'
        WHEN v_pontuacao_total >= 40 THEN 'Capacidade de pagamento limitada, vulnerabilidade significativa a fatores externos'
        WHEN v_pontuacao_total >= 30 THEN 'Capacidade de pagamento fraca, alta vulnerabilidade e riscos significativos'
        WHEN v_pontuacao_total >= 20 THEN 'Capacidade de pagamento muito fraca, risco elevado de inadimplência'
        WHEN v_pontuacao_total >= 10 THEN 'Situação crítica com alta probabilidade de inadimplência'
        ELSE 'Inadimplência iminente ou já ocorrida'
    END;

    RETURN QUERY
    SELECT 
        v_pontuacao_total,
        v_rating_letra,
        v_rating_descricao,
        jsonb_build_object(
            'metrics', v_detalhes,
            'modelo_id', v_modelo_id,
            'safra_id', p_safra_id,
            'safra', v_safra_name,
            'scenario_id', p_scenario_id,
            'scenario', v_scenario_name
        );
END;
$$ LANGUAGE plpgsql;