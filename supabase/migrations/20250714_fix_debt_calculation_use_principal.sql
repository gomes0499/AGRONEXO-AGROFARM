-- Fix debt calculation to use valor_principal instead of fluxo_pagamento_anual
-- This ensures consistency with cash flow calculations that use only principal amounts

CREATE OR REPLACE FUNCTION calcular_total_dividas_bancarias(
    p_organizacao_id UUID,
    p_projection_id UUID DEFAULT NULL
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
            -- Usar valor_principal para consistência com cash flow
            COALESCE(db.valor_principal, 0) as valor_principal
        FROM dividas_bancarias db
        WHERE db.organizacao_id = p_organizacao_id
        AND COALESCE(db.valor_principal, 0) > 0
    )
    SELECT 
        -- Total em BRL (apenas dívidas já em BRL)
        COALESCE(SUM(CASE WHEN moeda = 'BRL' THEN valor_principal ELSE 0 END), 0)::DECIMAL(15,2) as total_brl,
        
        -- Total em USD (apenas dívidas em USD)
        COALESCE(SUM(CASE WHEN moeda = 'USD' THEN valor_principal ELSE 0 END), 0)::DECIMAL(15,2) as total_usd,
        
        -- Total consolidado em BRL (tudo convertido para BRL)
        COALESCE(SUM(
            CASE 
                WHEN moeda = 'BRL' THEN valor_principal
                WHEN moeda = 'USD' THEN valor_principal * v_taxa_cambio
                ELSE valor_principal
            END
        ), 0)::DECIMAL(15,2) as total_consolidado_brl,
        
        -- Taxa de câmbio utilizada
        v_taxa_cambio as taxa_cambio,
        
        -- Quantidade de contratos
        COUNT(*)::INTEGER as quantidade_contratos
    FROM dividas_calculadas;
END;
$$ LANGUAGE plpgsql;

-- Comentário para documentação
COMMENT ON FUNCTION calcular_total_dividas_bancarias IS 
'Calcula dinamicamente o total das dívidas bancárias de uma organização usando valor_principal, 
garantindo consistência com os cálculos de fluxo de caixa que usam apenas o valor principal (sem juros).';