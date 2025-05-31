-- Quick fix script for the equipment trigger issue
-- This script focuses only on the essential fix needed

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS trg_maquinas_equipamentos_validate_dates ON maquinas_equipamentos;

-- Replace the function to use ano_fabricacao instead of ano
CREATE OR REPLACE FUNCTION validate_maquinas_equipamentos_dates()
RETURNS TRIGGER AS $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM now());
BEGIN
    -- Modified to use ano_fabricacao instead of ano
    IF NEW.ano_fabricacao < 1900 OR NEW.ano_fabricacao > (current_year + 5) THEN
        RAISE EXCEPTION 'Ano inválido para equipamento: %. Deve estar entre 1900 e %.', 
            NEW.ano_fabricacao, (current_year + 5);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with the fixed function
CREATE TRIGGER trg_maquinas_equipamentos_validate_dates
BEFORE INSERT OR UPDATE ON maquinas_equipamentos
FOR EACH ROW
EXECUTE FUNCTION validate_maquinas_equipamentos_dates();

-- Output confirmation
SELECT 'Trigger fixed successfully' AS result;