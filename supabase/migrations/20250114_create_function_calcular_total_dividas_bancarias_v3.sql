-- Função simplificada para calcular dinamicamente o total das dívidas bancárias
CREATE OR REPLACE FUNCTION calcular_total_dividas_bancarias(
    p_organizacao_id UUID
)
RETURNS TABLE (
    total_brl DECIMAL(15,2),
    total_usd DECIMAL(15,2),
    total_consolidado_brl DECIMAL(15,2),
    taxa_cambio DECIMAL(10,4),
    quantidade_contratos INTEGER
) AS $$
DECLARE
    v_taxa_cambio DECIMAL(10,4);
BEGIN
    -- Buscar taxa de câmbio mais recente
    SELECT cotacao_atual INTO v_taxa_cambio
    FROM cotacoes_cambio
    WHERE tipo_moeda = 'USD'
    AND organizacao_id = p_organizacao_id
    ORDER BY updated_at DESC
    LIMIT 1;
    
    -- Se não houver taxa, usar valor padrão de mercado
    IF v_taxa_cambio IS NULL THEN
        v_taxa_cambio := 5.50; -- Taxa padrão USD/BRL
    END IF;
    
    RETURN QUERY
    WITH dividas_calculadas AS (
        SELECT 
            db.moeda,
            -- Somar todos os pagamentos do fluxo
            (SELECT COALESCE(SUM(value::numeric), 0) 
             FROM jsonb_each_text(db.fluxo_pagamento_anual)) as valor_total_pagamentos
        FROM dividas_bancarias db
        WHERE db.organizacao_id = p_organizacao_id
    )
    SELECT 
        -- Total em BRL (apenas dívidas já em BRL)
        COALESCE(SUM(CASE WHEN moeda = 'BRL' THEN valor_total_pagamentos ELSE 0 END), 0)::DECIMAL(15,2) as total_brl,
        
        -- Total em USD (apenas dívidas em USD)
        COALESCE(SUM(CASE WHEN moeda = 'USD' THEN valor_total_pagamentos ELSE 0 END), 0)::DECIMAL(15,2) as total_usd,
        
        -- Total consolidado em BRL (tudo convertido para BRL)
        COALESCE(SUM(
            CASE 
                WHEN moeda = 'BRL' THEN valor_total_pagamentos
                WHEN moeda = 'USD' THEN valor_total_pagamentos * v_taxa_cambio
                ELSE valor_total_pagamentos
            END
        ), 0)::DECIMAL(15,2) as total_consolidado_brl,
        
        -- Taxa de câmbio utilizada
        v_taxa_cambio as taxa_cambio,
        
        -- Quantidade de contratos
        COUNT(*)::INTEGER as quantidade_contratos
    FROM dividas_calculadas
    WHERE valor_total_pagamentos > 0;
END;
$$ LANGUAGE plpgsql;

-- Comentário para documentação
COMMENT ON FUNCTION calcular_total_dividas_bancarias IS 
'Calcula dinamicamente o total das dívidas bancárias de uma organização, 
considerando conversão de moeda USD para BRL.';