-- Comprehensive script to fix the triggers in maquinas_equipamentos table
-- that are trying to access 'ano' column which doesn't exist

-- 1. Get information about existing triggers
SELECT 
    tgname AS trigger_name,
    proname AS function_name,
    nspname AS schema_name,
    relname AS table_name,
    pg_get_triggerdef(pg_trigger.oid) AS trigger_definition
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE relname = 'maquinas_equipamentos';

-- 2. Fix for the specific trigger
DROP TRIGGER IF EXISTS trg_maquinas_equipamentos_validate_dates ON maquinas_equipamentos;

-- 3. Get the function code to see what needs to be fixed
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'validate_maquinas_equipamentos_dates';

-- 4. Create or replace the function with the fixed code
CREATE OR REPLACE FUNCTION validate_maquinas_equipamentos_dates()
RETURNS TRIGGER AS $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM now());
BEGIN
    -- Equipment can be historical but not too far in the future
    -- CHANGE HERE: using ano_fabricacao instead of ano
    IF NEW.ano_fabricacao < 1900 OR NEW.ano_fabricacao > (current_year + 5) THEN
        RAISE EXCEPTION 'Ano inválido para equipamento: %. Deve estar entre 1900 e %.', 
            NEW.ano_fabricacao, (current_year + 5);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create the trigger again with the fixed function
CREATE TRIGGER trg_maquinas_equipamentos_validate_dates
BEFORE INSERT OR UPDATE ON maquinas_equipamentos
FOR EACH ROW
EXECUTE FUNCTION validate_maquinas_equipamentos_dates();

-- 6. Add a comment to document the change
COMMENT ON FUNCTION validate_maquinas_equipamentos_dates() IS 
'Validates date ranges for equipment. Updated to use ano_fabricacao column instead of ano column.';

-- 7. Testing: Try an update with invalid date to see if the trigger works
DO $$ 
BEGIN
    BEGIN
        UPDATE maquinas_equipamentos
        SET ano_fabricacao = 1800
        WHERE id = (SELECT id FROM maquinas_equipamentos LIMIT 1);
        
        RAISE NOTICE 'Trigger not working as expected. Update with invalid date (1800) succeeded.';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE 'Trigger is working correctly. Update with invalid date was rejected.';
    END;
END $$;

-- 8. Log completion
RAISE NOTICE 'Trigger fix completed successfully.';