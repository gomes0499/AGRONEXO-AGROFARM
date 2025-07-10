-- Adicionar colunas de taxas de câmbio específicas para projeções
ALTER TABLE projection_harvest_data
ADD COLUMN IF NOT EXISTS dollar_rate_algodao DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS dollar_rate_fechamento DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS dollar_rate_soja DECIMAL(10,4);

-- Comentário para documentar o propósito das colunas
COMMENT ON COLUMN projection_harvest_data.dollar_rate_algodao IS 'Taxa de câmbio do dólar para algodão';
COMMENT ON COLUMN projection_harvest_data.dollar_rate_fechamento IS 'Taxa de câmbio do dólar de fechamento';
COMMENT ON COLUMN projection_harvest_data.dollar_rate_soja IS 'Taxa de câmbio do dólar para soja';