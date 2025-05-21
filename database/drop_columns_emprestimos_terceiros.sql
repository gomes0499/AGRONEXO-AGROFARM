-- Script para remover as colunas não utilizadas da tabela emprestimos_terceiros

-- Verificar a estrutura atual antes das alterações
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'emprestimos_terceiros'
ORDER BY ordinal_position;

-- Remover as colunas não utilizadas
ALTER TABLE emprestimos_terceiros
DROP COLUMN IF EXISTS taxa_juros,
DROP COLUMN IF EXISTS data_emprestimo,
DROP COLUMN IF EXISTS data_vencimento,
DROP COLUMN IF EXISTS data_inicio,
DROP COLUMN IF EXISTS descricao;

-- Verificar a estrutura após as alterações
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'emprestimos_terceiros'
ORDER BY ordinal_position;

-- Alterar o comentário da tabela para esclarecer o uso
COMMENT ON TABLE emprestimos_terceiros IS 'Tabela simplificada para empréstimos concedidos a terceiros (onde a organização é credora e terceiros são tomadores)';

-- Comentário para o campo credor explicando que representa o tomador
COMMENT ON COLUMN emprestimos_terceiros.credor IS 'Nome do tomador do empréstimo (a pessoa ou empresa que recebeu o empréstimo)';

-- Estrutura final esperada:
-- id: UUID (chave primária)
-- organizacao_id: UUID (chave estrangeira para organizacoes)
-- credor: TEXT (nome do tomador do empréstimo - CAMPO OBRIGATÓRIO)
-- valor: DECIMAL(15, 2) (valor do empréstimo - CAMPO OBRIGATÓRIO)
-- moeda: TEXT (BRL ou USD - DEFAULT 'BRL')
-- created_at: TIMESTAMPTZ
-- updated_at: TIMESTAMPTZ