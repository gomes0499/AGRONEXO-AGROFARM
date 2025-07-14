-- Função para calcular dinamicamente o total das dívidas bancárias
-- Considera conversão de moeda USD para BRL
CREATE OR REPLACE FUNCTION calcular_total_dividas_bancarias(
    p_organizacao_id UUID,
    p_incluir_juros BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    total_brl DECIMAL(15,2),
    total_usd DECIMAL(15,2),
    total_consolidado_brl DECIMAL(15,2),
    taxa_cambio DECIMAL(10,4),
    detalhes JSONB
) AS $$
DECLARE
    v_taxa_cambio DECIMAL(10,4);
    v_detalhes JSONB;
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
    
    -- Calcular totais com detalhes
    RETURN QUERY
    WITH dividas_detalhadas AS (
        SELECT 
            db.id,
            db.instituicao_bancaria,
            db.moeda,
            db.taxa_real,
            db.indexador,
            db.ano_contratacao,
            db.fluxo_pagamento_anual,
            -- Calcular valor principal baseado no fluxo e taxa
            CASE 
                WHEN p_incluir_juros THEN
                    -- Se incluir juros, soma todos os pagamentos
                    (SELECT COALESCE(SUM(value::numeric), 0) 
                     FROM jsonb_each_text(db.fluxo_pagamento_anual))
                ELSE
                    -- Se não incluir juros, estima o principal
                    CASE 
                        WHEN db.taxa_real > 0 AND jsonb_typeof(db.fluxo_pagamento_anual) = 'object' THEN
                            -- Estimar principal usando valor presente dos pagamentos
                            (SELECT COALESCE(SUM(value::numeric / POWER(1 + (db.taxa_real/100), ROW_NUMBER() OVER())), 0)
                             FROM jsonb_each_text(db.fluxo_pagamento_anual)
                             ORDER BY key)
                        ELSE
                            -- Se não tem taxa ou fluxo, usar soma simples
                            (SELECT COALESCE(SUM(value::numeric), 0) 
                             FROM jsonb_each_text(db.fluxo_pagamento_anual))
                    END
            END as valor_calculado
        FROM dividas_bancarias db
        WHERE db.organizacao_id = p_organizacao_id
    )
    SELECT 
        -- Total em BRL (apenas dívidas já em BRL)
        COALESCE(SUM(CASE WHEN moeda = 'BRL' THEN valor_calculado ELSE 0 END), 0)::DECIMAL(15,2) as total_brl,
        
        -- Total em USD (apenas dívidas em USD)
        COALESCE(SUM(CASE WHEN moeda = 'USD' THEN valor_calculado ELSE 0 END), 0)::DECIMAL(15,2) as total_usd,
        
        -- Total consolidado em BRL (tudo convertido para BRL)
        COALESCE(SUM(
            CASE 
                WHEN moeda = 'BRL' THEN valor_calculado
                WHEN moeda = 'USD' THEN valor_calculado * v_taxa_cambio
                ELSE valor_calculado
            END
        ), 0)::DECIMAL(15,2) as total_consolidado_brl,
        
        -- Taxa de câmbio utilizada
        v_taxa_cambio as taxa_cambio,
        
        -- Detalhes por instituição
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'instituicao', instituicao_bancaria,
                'moeda', moeda,
                'valor_original', valor_calculado,
                'valor_brl', CASE 
                    WHEN moeda = 'USD' THEN valor_calculado * v_taxa_cambio
                    ELSE valor_calculado
                END,
                'taxa_real', taxa_real,
                'indexador', indexador
            )
        ) as detalhes
    FROM dividas_detalhadas;
END;
$$ LANGUAGE plpgsql;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_org_moeda 
ON dividas_bancarias(organizacao_id, moeda);

-- Comentário para documentação
COMMENT ON FUNCTION calcular_total_dividas_bancarias IS 
'Calcula dinamicamente o total das dívidas bancárias de uma organização, 
considerando conversão de moeda USD para BRL. 
Pode calcular apenas o principal (sem juros) ou o valor total com juros.';