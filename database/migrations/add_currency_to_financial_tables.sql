-- =====================================================
-- ADD CURRENCY FIELD TO FINANCIAL TABLES
-- =====================================================

-- Add moeda field to dividas_terras
ALTER TABLE dividas_terras 
ADD COLUMN IF NOT EXISTS moeda moeda_tipo NOT NULL DEFAULT 'BRL';

-- Add moeda field to caixa_disponibilidades
ALTER TABLE caixa_disponibilidades 
ADD COLUMN IF NOT EXISTS moeda moeda_tipo NOT NULL DEFAULT 'BRL';

-- Add moeda field to financeiras
ALTER TABLE financeiras 
ADD COLUMN IF NOT EXISTS moeda moeda_tipo NOT NULL DEFAULT 'BRL';

-- Add moeda field to outras_despesas
ALTER TABLE outras_despesas 
ADD COLUMN IF NOT EXISTS moeda moeda_tipo NOT NULL DEFAULT 'BRL';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dividas_terras_moeda ON dividas_terras(moeda);
CREATE INDEX IF NOT EXISTS idx_caixa_disponibilidades_moeda ON caixa_disponibilidades(moeda);
CREATE INDEX IF NOT EXISTS idx_financeiras_moeda ON financeiras(moeda);
CREATE INDEX IF NOT EXISTS idx_outras_despesas_moeda ON outras_despesas(moeda);

SELECT 'Currency fields added successfully to financial tables!' as status;