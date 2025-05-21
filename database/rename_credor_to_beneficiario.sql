-- Script para renomear a coluna credor para beneficiario na tabela emprestimos_terceiros

-- Verificar a estrutura atual antes das alterações
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'emprestimos_terceiros'
ORDER BY ordinal_position;

-- Verificar se a coluna credor existe e beneficiario não existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'emprestimos_terceiros' AND column_name = 'credor') 
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'emprestimos_terceiros' AND column_name = 'beneficiario') THEN
    -- Renomear a coluna credor para beneficiario
    ALTER TABLE emprestimos_terceiros RENAME COLUMN credor TO beneficiario;
    RAISE NOTICE 'Coluna credor renomeada para beneficiario com sucesso.';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'emprestimos_terceiros' AND column_name = 'beneficiario') THEN
    RAISE NOTICE 'A coluna beneficiario já existe na tabela.';
  ELSE
    RAISE NOTICE 'A coluna credor não existe na tabela.';
  END IF;
END $$;

-- Atualizar o comentário da coluna
COMMENT ON COLUMN emprestimos_terceiros.beneficiario IS 'Nome do beneficiário do empréstimo (a pessoa ou empresa que recebeu o empréstimo)';

-- Verificar a estrutura após as alterações
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'emprestimos_terceiros'
ORDER BY ordinal_position;