-- Script para reconstruir totalmente a tabela estoques_commodities
-- ATENÇÃO: Este script vai recriar a tabela, preservando os dados existentes,
-- mas removendo qualquer trigger, index ou constraint adicional

-- Primeiro, vamos verificar a estrutura atual
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'estoques_commodities'
ORDER BY ordinal_position;

-- Desabilitar qualquer trigger na tabela
ALTER TABLE estoques_commodities DISABLE TRIGGER ALL;

-- Criar tabela de backup com apenas os campos que queremos manter
CREATE TABLE estoques_commodities_backup AS
SELECT 
    id, 
    organizacao_id, 
    commodity, 
    valor_total, 
    created_at, 
    updated_at
FROM 
    estoques_commodities;

-- Verificar dados de backup
SELECT * FROM estoques_commodities_backup;

-- Remover a tabela original
DROP TABLE estoques_commodities;

-- Criar a nova tabela com a estrutura simplificada
CREATE TABLE estoques_commodities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    commodity TEXT NOT NULL,
    valor_total NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Restaurar os dados do backup
INSERT INTO estoques_commodities
SELECT * FROM estoques_commodities_backup;

-- Remover a tabela de backup
DROP TABLE estoques_commodities_backup;

-- Criar um trigger simples apenas para atualizar o updated_at
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

-- Visualizar alguns dados para confirmar que tudo está certo
SELECT * FROM estoques_commodities LIMIT 10;