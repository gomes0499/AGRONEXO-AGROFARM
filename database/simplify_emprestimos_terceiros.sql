-- Script para simplificar a tabela emprestimos_terceiros
-- Mantém os campos mas adiciona comentários adequados

-- Verificar a estrutura atual antes das alterações
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'emprestimos_terceiros'
ORDER BY ordinal_position;

-- Alterar o comentário da tabela para esclarecer o uso
COMMENT ON TABLE emprestimos_terceiros IS 'Tabela para empréstimos concedidos a terceiros (onde a organização é credora e terceiros são tomadores)';

-- Comentário para o campo credor explicando que representa o tomador
COMMENT ON COLUMN emprestimos_terceiros.credor IS 'Nome do tomador do empréstimo (a pessoa ou empresa que recebeu o empréstimo)';

-- Comentários para outros campos explicando que são opcionais na interface
COMMENT ON COLUMN emprestimos_terceiros.taxa_juros IS 'Taxa de juros (opcional na interface)';
COMMENT ON COLUMN emprestimos_terceiros.descricao IS 'Descrição do empréstimo (opcional na interface)';
COMMENT ON COLUMN emprestimos_terceiros.data_inicio IS 'Data de início do empréstimo (opcional na interface)';
COMMENT ON COLUMN emprestimos_terceiros.data_vencimento IS 'Data de vencimento do empréstimo (opcional na interface)';

-- Estrutura mantida:
-- id: UUID (chave primária)
-- organizacao_id: UUID (chave estrangeira para organizacoes)
-- credor: TEXT (nome do tomador do empréstimo - CAMPO OBRIGATÓRIO)
-- valor: DECIMAL(15, 2) (valor do empréstimo - CAMPO OBRIGATÓRIO)
-- taxa_juros: DECIMAL(5, 2) (opcional)
-- descricao: TEXT (opcional)
-- data_inicio: DATE (opcional)
-- data_vencimento: DATE (opcional)
-- moeda: TEXT (BRL ou USD - DEFAULT 'BRL')
-- created_at: TIMESTAMPTZ
-- updated_at: TIMESTAMPTZ