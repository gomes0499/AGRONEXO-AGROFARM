-- Script para simplificar a tabela estoques_commodities
-- DROP COLUMNS VERSION - EXECUTE COM CUIDADO!

-- Mantém apenas: id, organizacao_id, commodity, valor_total, created_at, updated_at
-- Remove: quantidade, valor_unitario, data_referencia

-- ATENÇÃO: Este script remove diretamente as colunas sem verificação.
-- Use o modo seguro se preferir (deixei comentado abaixo).

-- Verificar a estrutura atual antes das alterações
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'estoques_commodities'
ORDER BY ordinal_position;

-- REMOÇÃO DIRETA DAS COLUNAS
ALTER TABLE estoques_commodities 
DROP COLUMN IF EXISTS quantidade,
DROP COLUMN IF EXISTS valor_unitario,
DROP COLUMN IF EXISTS data_referencia;

-- Verificar a estrutura após as alterações
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'estoques_commodities'
ORDER BY ordinal_position;

-- Atualizar comentário da tabela
COMMENT ON TABLE estoques_commodities IS 'Tabela simplificada para estoques de commodities (apenas informações essenciais)';

-- Estrutura final esperada:
-- id: UUID (chave primária)
-- organizacao_id: UUID (chave estrangeira para organizacoes)
-- commodity: commodity_tipo (enum personalizado)
-- valor_total: NUMERIC (valor total do estoque)
-- created_at: TIMESTAMPTZ
-- updated_at: TIMESTAMPTZ

-- Verificar a estrutura após as alterações
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'estoques_commodities'
ORDER BY ordinal_position;

-- Atualizar comentário da tabela
COMMENT ON TABLE estoques_commodities IS 'Tabela simplificada para estoques de commodities (apenas informações essenciais)';

-- Estrutura final esperada:
-- id: UUID (chave primária)
-- organizacao_id: UUID (chave estrangeira para organizacoes)
-- commodity: commodity_tipo (enum personalizado)
-- valor_total: NUMERIC (valor total do estoque)
-- created_at: TIMESTAMPTZ
-- updated_at: TIMESTAMPTZ