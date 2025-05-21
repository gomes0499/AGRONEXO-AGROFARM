-- Script para corrigir a tabela estoques_commodities de forma segura
-- Esta versão evita desativar triggers do sistema

-- Verificar a estrutura atual
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'estoques_commodities'
ORDER BY ordinal_position;

-- Verificar triggers definidos pelo usuário (não do sistema)
SELECT 
    tgname AS trigger_name,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM 
    pg_trigger t
JOIN 
    pg_class c ON t.tgrelid = c.oid
JOIN 
    pg_namespace n ON c.relnamespace = n.oid
WHERE 
    n.nspname = 'public'
AND 
    c.relname = 'estoques_commodities'
AND 
    NOT tgisinternal; -- Apenas triggers definidos pelo usuário

-- Criar uma tabela temporária com apenas os campos necessários
-- Usando outro nome para evitar conflitos
CREATE TABLE temp_commodity_stocks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organizacao_id UUID NOT NULL,
    commodity TEXT NOT NULL,
    valor_total NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Copiar os dados
INSERT INTO temp_commodity_stocks (id, organizacao_id, commodity, valor_total, created_at, updated_at)
SELECT 
    id, 
    organizacao_id, 
    commodity, 
    valor_total, 
    created_at, 
    updated_at
FROM 
    estoques_commodities;

-- Verificar os dados copiados
SELECT * FROM temp_commodity_stocks LIMIT 10;

-- Remover triggers definidos pelo usuário na tabela original
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT 
            tgname AS trigger_name
        FROM 
            pg_trigger t
        JOIN 
            pg_class c ON t.tgrelid = c.oid
        JOIN 
            pg_namespace n ON c.relnamespace = n.oid
        WHERE 
            n.nspname = 'public'
        AND 
            c.relname = 'estoques_commodities'
        AND 
            NOT tgisinternal
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON estoques_commodities';
        RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
    END LOOP;
END $$;

-- Remover a tabela original
DROP TABLE estoques_commodities;

-- Renomear a tabela temporária
ALTER TABLE temp_commodity_stocks RENAME TO estoques_commodities;

-- Adicionar restrição de chave estrangeira manualmente
ALTER TABLE estoques_commodities 
ADD CONSTRAINT estoques_commodities_organizacao_id_fkey 
FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE CASCADE;

-- Criar um trigger simples para atualizar o timestamp
CREATE OR REPLACE FUNCTION update_commodity_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_commodity_timestamp_trigger
BEFORE UPDATE ON estoques_commodities
FOR EACH ROW
EXECUTE FUNCTION update_commodity_timestamp();

-- Verificar a estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'estoques_commodities'
ORDER BY ordinal_position;

-- Verificar novos triggers
SELECT 
    tgname AS trigger_name,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM 
    pg_trigger t
JOIN 
    pg_class c ON t.tgrelid = c.oid
JOIN 
    pg_namespace n ON c.relnamespace = n.oid
WHERE 
    n.nspname = 'public'
AND 
    c.relname = 'estoques_commodities'
AND 
    NOT tgisinternal;