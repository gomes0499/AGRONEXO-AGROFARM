-- Script para simplificar a tabela adiantamentos_fornecedores
-- Remove campos de data e deixa apenas o que é realmente necessário

-- Verificar a estrutura atual antes das alterações
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'adiantamentos_fornecedores'
ORDER BY ordinal_position;

-- Remover as colunas de data se existirem
ALTER TABLE adiantamentos_fornecedores
DROP COLUMN IF EXISTS data_adiantamento,
DROP COLUMN IF EXISTS data_previsao_entrega,
DROP COLUMN IF EXISTS data_vencimento,
DROP COLUMN IF EXISTS descricao,
DROP COLUMN IF EXISTS moeda;

-- Verificar a estrutura após as alterações
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'adiantamentos_fornecedores'
ORDER BY ordinal_position;

-- Estrutura final esperada:
-- id: UUID (chave primária)
-- organizacao_id: UUID (chave estrangeira para organizacoes)
-- fornecedor_id: UUID (chave estrangeira para fornecedores)
-- valor: DECIMAL(15, 2)
-- created_at: TIMESTAMPTZ
-- updated_at: TIMESTAMPTZ