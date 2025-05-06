-- Script para dropar completamente o schema do SR-Consultoria
-- Este script remove TODAS as tabelas, funções, tipos, triggers, políticas e índices

-- Primeiro, desabilitamos todas as restrições de chave estrangeira para facilitar a remoção
SET session_replication_role = 'replica';

-- Dropando políticas RLS
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT 
            schemaname, tablename, policyname
        FROM 
            pg_policies
        WHERE 
            schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                     policy_record.policyname, 
                     policy_record.schemaname, 
                     policy_record.tablename);
    END LOOP;
END
$$;

-- Dropando os triggers
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT 
            event_object_schema AS schema_name,
            event_object_table AS table_name,
            trigger_name
        FROM 
            information_schema.triggers
        WHERE 
            event_object_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE', 
                     trigger_record.trigger_name, 
                     trigger_record.schema_name, 
                     trigger_record.table_name);
    END LOOP;
END
$$;

-- Dropando todas as tabelas
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT 
            tablename
        FROM 
            pg_tables
        WHERE 
            schemaname = 'public'
        ORDER BY
            tablename
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', 
                     table_record.tablename);
    END LOOP;
END
$$;

-- Dropando as funções
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT 
            ns.nspname AS schema_name,
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS args
        FROM 
            pg_proc p
            JOIN pg_namespace ns ON p.pronamespace = ns.oid
        WHERE 
            ns.nspname = 'public'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
                     func_record.function_name, 
                     func_record.args);
    END LOOP;
END
$$;

-- Dropando os tipos enumerados (ENUM)
DO $$
DECLARE
    type_record RECORD;
BEGIN
    FOR type_record IN 
        SELECT 
            t.typname AS type_name
        FROM 
            pg_type t
            JOIN pg_namespace ns ON t.typnamespace = ns.oid
        WHERE 
            ns.nspname = 'public'
            AND t.typtype = 'e'  -- enum types
    LOOP
        EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', 
                     type_record.type_name);
    END LOOP;
END
$$;


-- Restaurando o modo de replicação para o padrão
SET session_replication_role = 'origin';

-- Saída para informar que tudo foi removido
DO $$
BEGIN
    RAISE NOTICE 'Todos os objetos do banco de dados foram removidos com sucesso!';
END
$$;