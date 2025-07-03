-- Add check constraint to ensure modalidade is valid
ALTER TABLE dividas_bancarias 
ADD CONSTRAINT check_modalidade_valida 
CHECK (modalidade IN ('CUSTEIO', 'INVESTIMENTOS', 'OUTROS'));

-- Update any NULL modalidade to INVESTIMENTOS as default
UPDATE dividas_bancarias 
SET modalidade = 'INVESTIMENTOS' 
WHERE modalidade IS NULL;

-- Make modalidade NOT NULL with default
ALTER TABLE dividas_bancarias 
ALTER COLUMN modalidade SET DEFAULT 'INVESTIMENTOS',
ALTER COLUMN modalidade SET NOT NULL;

-- Add the same constraints to the projections table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dividas_bancarias_projections') THEN
        ALTER TABLE dividas_bancarias_projections 
        ADD CONSTRAINT check_modalidade_valida 
        CHECK (modalidade IN ('CUSTEIO', 'INVESTIMENTOS', 'OUTROS'));
        
        UPDATE dividas_bancarias_projections 
        SET modalidade = 'INVESTIMENTOS' 
        WHERE modalidade IS NULL;
        
        ALTER TABLE dividas_bancarias_projections 
        ALTER COLUMN modalidade SET DEFAULT 'INVESTIMENTOS',
        ALTER COLUMN modalidade SET NOT NULL;
    END IF;
END $$;