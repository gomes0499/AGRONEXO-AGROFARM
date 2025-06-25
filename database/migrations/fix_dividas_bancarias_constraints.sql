-- Migration to fix dividas_bancarias table constraints and add missing fields
-- Date: 2025-06-25

-- 1. Drop the incorrect constraint
ALTER TABLE dividas_bancarias 
DROP CONSTRAINT IF EXISTS chk_dividas_bancarias_fluxo_not_empty;

-- 2. Add the correct constraint for valores_por_ano
ALTER TABLE dividas_bancarias 
ADD CONSTRAINT chk_dividas_bancarias_valores_not_empty 
CHECK (jsonb_typeof(valores_por_ano) = 'object' AND valores_por_ano != '{}');

-- 3. Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add safra_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'dividas_bancarias' 
                   AND column_name = 'safra_id') THEN
        ALTER TABLE dividas_bancarias 
        ADD COLUMN safra_id UUID REFERENCES safras(id) ON DELETE RESTRICT;
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'dividas_bancarias' 
                   AND column_name = 'status') THEN
        ALTER TABLE dividas_bancarias 
        ADD COLUMN status status_divida DEFAULT 'ATIVA';
    END IF;

    -- Add observacoes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'dividas_bancarias' 
                   AND column_name = 'observacoes') THEN
        ALTER TABLE dividas_bancarias 
        ADD COLUMN observacoes TEXT;
    END IF;

    -- Rename valores_por_ano to fluxo_pagamento_anual to match the code
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'dividas_bancarias' 
               AND column_name = 'valores_por_ano') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'dividas_bancarias' 
                       AND column_name = 'fluxo_pagamento_anual') THEN
        ALTER TABLE dividas_bancarias 
        RENAME COLUMN valores_por_ano TO fluxo_pagamento_anual;
    END IF;
END $$;

-- 4. Update the constraint to use the correct column name
ALTER TABLE dividas_bancarias 
DROP CONSTRAINT IF EXISTS chk_dividas_bancarias_valores_not_empty;

ALTER TABLE dividas_bancarias 
ADD CONSTRAINT chk_dividas_bancarias_fluxo_not_empty 
CHECK (jsonb_typeof(fluxo_pagamento_anual) = 'object' AND fluxo_pagamento_anual != '{}');

-- 5. Add index for performance
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_organizacao_safra 
ON dividas_bancarias(organizacao_id, safra_id);

CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_modalidade 
ON dividas_bancarias(modalidade);

CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_status 
ON dividas_bancarias(status);

-- 6. Add comment to table
COMMENT ON TABLE dividas_bancarias IS 'Tabela de dívidas bancárias, trading e outras instituições financeiras';
COMMENT ON COLUMN dividas_bancarias.tipo IS 'Tipo de instituição: BANCO, TRADING ou OUTRO';
COMMENT ON COLUMN dividas_bancarias.modalidade IS 'Modalidade da dívida: CUSTEIO ou INVESTIMENTOS';
COMMENT ON COLUMN dividas_bancarias.fluxo_pagamento_anual IS 'Fluxo de pagamento por safra em formato JSONB: {"safra_id": valor}';
COMMENT ON COLUMN dividas_bancarias.safra_id IS 'Safra principal associada à dívida';
COMMENT ON COLUMN dividas_bancarias.status IS 'Status atual da dívida';