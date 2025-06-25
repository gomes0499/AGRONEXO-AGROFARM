-- ================================================
-- ADICIONAR TAXA DE CÂMBIO NAS TABELAS FINANCEIRAS
-- ================================================
-- Este script adiciona campos de taxa de câmbio nas tabelas financeiras
-- para permitir conversão baseada na safra específica

-- ================================================
-- 1. ADICIONAR TAXA DE CÂMBIO NAS SAFRAS
-- ================================================

-- Primeiro, vamos adicionar a taxa de câmbio diretamente na tabela de safras
-- Isso permite definir uma taxa padrão por safra
ALTER TABLE safras 
ADD COLUMN IF NOT EXISTS taxa_cambio_usd DECIMAL(10,4) DEFAULT 5.0000,
ADD COLUMN IF NOT EXISTS moeda_principal moeda_tipo DEFAULT 'BRL';

COMMENT ON COLUMN safras.taxa_cambio_usd IS 'Taxa de câmbio USD/BRL para esta safra';
COMMENT ON COLUMN safras.moeda_principal IS 'Moeda principal utilizada nesta safra';

-- ================================================
-- 2. ADICIONAR REFERÊNCIA DE SAFRA NAS TABELAS FINANCEIRAS
-- ================================================

-- Dívidas Bancárias - adicionar referência à safra
ALTER TABLE dividas_bancarias
ADD COLUMN IF NOT EXISTS safra_id UUID REFERENCES safras(id),
ADD COLUMN IF NOT EXISTS taxa_cambio_contratacao DECIMAL(10,4);

COMMENT ON COLUMN dividas_bancarias.safra_id IS 'Safra de referência para esta dívida';
COMMENT ON COLUMN dividas_bancarias.taxa_cambio_contratacao IS 'Taxa de câmbio na data de contratação (se diferente da safra)';

-- Dívidas de Terras/Imóveis
ALTER TABLE dividas_terras
ADD COLUMN IF NOT EXISTS safra_id UUID REFERENCES safras(id),
ADD COLUMN IF NOT EXISTS taxa_cambio_contratacao DECIMAL(10,4);

-- Dívidas de Fornecedores
ALTER TABLE dividas_fornecedores
ADD COLUMN IF NOT EXISTS safra_id UUID REFERENCES safras(id),
ADD COLUMN IF NOT EXISTS taxa_cambio_referencia DECIMAL(10,4);

-- Caixa e Disponibilidades
-- Esta já tem safra_id, só adicionar taxa de câmbio de referência
ALTER TABLE caixa_disponibilidades
ADD COLUMN IF NOT EXISTS taxa_cambio_referencia DECIMAL(10,4);

-- Receitas Financeiras
ALTER TABLE receitas_financeiras
ADD COLUMN IF NOT EXISTS safra_id UUID REFERENCES safras(id),
ADD COLUMN IF NOT EXISTS taxa_cambio_referencia DECIMAL(10,4);

-- Outras Despesas
ALTER TABLE outras_despesas
ADD COLUMN IF NOT EXISTS safra_id UUID REFERENCES safras(id),
ADD COLUMN IF NOT EXISTS taxa_cambio_referencia DECIMAL(10,4);

-- ================================================
-- 3. CRIAR VIEW PARA VALORES CONVERTIDOS
-- ================================================

-- View para dívidas bancárias com valores em USD
CREATE OR REPLACE VIEW vw_dividas_bancarias_com_usd AS
SELECT 
    db.*,
    s.nome as safra_nome,
    s.taxa_cambio_usd as taxa_cambio_safra,
    COALESCE(db.taxa_cambio_contratacao, s.taxa_cambio_usd, 5.0000) as taxa_cambio_efetiva,
    CASE 
        WHEN db.moeda = 'USD' THEN db.valores_por_ano
        WHEN db.moeda = 'BRL' AND s.taxa_cambio_usd IS NOT NULL THEN 
            jsonb_object_agg(
                key, 
                (value::numeric / COALESCE(db.taxa_cambio_contratacao, s.taxa_cambio_usd, 5.0000))::numeric(15,2)
            )
        ELSE db.valores_por_ano
    END as valores_por_ano_usd,
    CASE 
        WHEN db.moeda = 'BRL' THEN db.valores_por_ano
        WHEN db.moeda = 'USD' AND s.taxa_cambio_usd IS NOT NULL THEN 
            jsonb_object_agg(
                key, 
                (value::numeric * COALESCE(db.taxa_cambio_contratacao, s.taxa_cambio_usd, 5.0000))::numeric(15,2)
            )
        ELSE db.valores_por_ano
    END as valores_por_ano_brl
FROM dividas_bancarias db
LEFT JOIN safras s ON db.safra_id = s.id
LEFT JOIN LATERAL jsonb_each_text(db.valores_por_ano) ON true
GROUP BY db.id, s.id, s.nome, s.taxa_cambio_usd;

-- ================================================
-- 4. FUNÇÃO PARA CONVERTER VALORES
-- ================================================

-- Função auxiliar para converter valores com base na taxa de câmbio
CREATE OR REPLACE FUNCTION converter_valor_moeda(
    valor NUMERIC,
    moeda_origem moeda_tipo,
    moeda_destino moeda_tipo,
    taxa_cambio NUMERIC DEFAULT 5.0000
) RETURNS NUMERIC AS $$
BEGIN
    IF moeda_origem = moeda_destino THEN
        RETURN valor;
    END IF;
    
    IF moeda_origem = 'BRL' AND moeda_destino = 'USD' THEN
        RETURN valor / taxa_cambio;
    END IF;
    
    IF moeda_origem = 'USD' AND moeda_destino = 'BRL' THEN
        RETURN valor * taxa_cambio;
    END IF;
    
    -- Para outras moedas, retornar o valor original
    RETURN valor;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ================================================
-- 5. TRIGGER PARA PREENCHER TAXA DE CÂMBIO
-- ================================================

-- Trigger para preencher automaticamente a taxa de câmbio da safra
CREATE OR REPLACE FUNCTION preencher_taxa_cambio_safra()
RETURNS TRIGGER AS $$
BEGIN
    -- Se safra_id está definido e taxa_cambio_referencia não está
    IF NEW.safra_id IS NOT NULL AND NEW.taxa_cambio_referencia IS NULL THEN
        SELECT taxa_cambio_usd INTO NEW.taxa_cambio_referencia
        FROM safras
        WHERE id = NEW.safra_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas relevantes
CREATE TRIGGER trg_preencher_taxa_cambio_dividas_bancarias
    BEFORE INSERT OR UPDATE ON dividas_bancarias
    FOR EACH ROW
    EXECUTE FUNCTION preencher_taxa_cambio_safra();

CREATE TRIGGER trg_preencher_taxa_cambio_outras_despesas
    BEFORE INSERT OR UPDATE ON outras_despesas
    FOR EACH ROW
    EXECUTE FUNCTION preencher_taxa_cambio_safra();

CREATE TRIGGER trg_preencher_taxa_cambio_receitas_financeiras
    BEFORE INSERT OR UPDATE ON receitas_financeiras
    FOR EACH ROW
    EXECUTE FUNCTION preencher_taxa_cambio_safra();

-- ================================================
-- 6. ADICIONAR ÍNDICES
-- ================================================

CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_safra ON dividas_bancarias(safra_id);
CREATE INDEX IF NOT EXISTS idx_outras_despesas_safra ON outras_despesas(safra_id);
CREATE INDEX IF NOT EXISTS idx_receitas_financeiras_safra ON receitas_financeiras(safra_id);

-- Success message
SELECT 'Exchange rate fields added successfully!' as status;