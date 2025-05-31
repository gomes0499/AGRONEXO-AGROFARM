-- Script para identificar a função associada à trigger trg_maquinas_equipamentos_validate_dates

SELECT 
    tgname AS trigger_name,
    proname AS function_name,
    nspname AS schema_name,
    relname AS table_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE tgname = 'trg_maquinas_equipamentos_validate_dates';

-- Ou, para ver todas as triggers na tabela maquinas_equipamentos:
SELECT 
    tgname AS trigger_name,
    proname AS function_name,
    nspname AS schema_name,
    relname AS table_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
WHERE relname = 'maquinas_equipamentos';