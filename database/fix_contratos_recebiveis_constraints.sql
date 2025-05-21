-- Verifica a configuração atual da coluna
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'contratos_recebiveis'
AND column_name IN ('data_vencimento', 'data_contrato', 'moeda');

-- Altera a coluna data_vencimento para permitir valores NULL
ALTER TABLE contratos_recebiveis 
ALTER COLUMN data_vencimento DROP NOT NULL;

-- Altera outras colunas que possam ter problemas de constraint
ALTER TABLE contratos_recebiveis 
ALTER COLUMN data_contrato DROP NOT NULL;

-- Se outras colunas precisarem de ajustes, pode adicionar aqui

-- Verifica novamente para confirmar a mudança
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'contratos_recebiveis'
AND column_name IN ('data_vencimento', 'data_contrato', 'moeda');