-- Script para corrigir a tabela estoques_commodities
-- REMOVER COLUNAS DESNECESSÁRIAS E REESTRUTURAR

-- Primeiro, criar uma tabela temporária com a estrutura desejada
CREATE TABLE temp_estoques_commodities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    commodity TEXT NOT NULL,
    valor_total NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Copiar os dados existentes para a tabela temporária (apenas as colunas que queremos)
INSERT INTO temp_estoques_commodities (id, organizacao_id, commodity, valor_total, created_at, updated_at)
SELECT id, organizacao_id, commodity, valor_total, created_at, updated_at
FROM estoques_commodities;

-- Remover a tabela antiga
DROP TABLE estoques_commodities;

-- Renomear a tabela temporária para o nome original
ALTER TABLE temp_estoques_commodities RENAME TO estoques_commodities;

-- Adicionar comentário à tabela
COMMENT ON TABLE estoques_commodities IS 'Tabela simplificada para estoques de commodities (apenas informações essenciais)';

-- Verificar a estrutura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'estoques_commodities'
ORDER BY ordinal_position;