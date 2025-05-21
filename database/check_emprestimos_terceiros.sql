-- Script para verificar a estrutura da tabela emprestimos_terceiros
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'emprestimos_terceiros'
ORDER BY ordinal_position;