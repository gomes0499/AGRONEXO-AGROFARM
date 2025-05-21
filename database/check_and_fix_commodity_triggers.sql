-- Script para verificar e corrigir os triggers na tabela estoques_commodities

-- Verificar triggers existentes
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM 
    information_schema.triggers
WHERE 
    event_object_table = 'estoques_commodities'
ORDER BY 
    trigger_name;

-- Listar todas as funções que podem estar relacionadas a esses triggers
SELECT 
    pg_proc.proname AS function_name,
    pg_get_functiondef(pg_proc.oid) AS function_definition
FROM 
    pg_proc
JOIN 
    pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE 
    pg_namespace.nspname = 'public'
AND 
    pg_get_functiondef(pg_proc.oid) LIKE '%estoques_commodities%'
OR 
    pg_get_functiondef(pg_proc.oid) LIKE '%quantidade%';

-- Desabilitar todos os triggers da tabela
ALTER TABLE estoques_commodities DISABLE TRIGGER ALL;

-- Script para recriar a função de trigger que verifica alterações em valor_total
-- Removendo qualquer referência a 'quantidade' ou 'valor_unitario'
CREATE OR REPLACE FUNCTION check_commodity_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Não usamos mais os campos quantidade e valor_unitario
    -- Foi removido qualquer cálculo baseado nesses campos
    
    -- Apenas garante que valor_total seja positivo
    IF NEW.valor_total < 0 THEN
        RAISE EXCEPTION 'O valor total deve ser positivo';
    END IF;
    
    -- Atualiza o timestamp
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar se o trigger existe e removê-lo para recriar
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'check_commodity_fields_trigger') THEN
        DROP TRIGGER IF EXISTS check_commodity_fields_trigger ON estoques_commodities;
    END IF;
END $$;

-- Criar um novo trigger
CREATE TRIGGER check_commodity_fields_trigger
BEFORE INSERT OR UPDATE ON estoques_commodities
FOR EACH ROW
EXECUTE FUNCTION check_commodity_fields();

-- Reabilitar todos os triggers (agora com o novo trigger corrigido)
ALTER TABLE estoques_commodities ENABLE TRIGGER ALL;

-- Verificar novamente os triggers após as alterações
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM 
    information_schema.triggers
WHERE 
    event_object_table = 'estoques_commodities'
ORDER BY 
    trigger_name;