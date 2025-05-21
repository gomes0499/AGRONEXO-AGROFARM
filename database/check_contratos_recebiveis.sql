-- Verifica se a tabela existe
SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'contratos_recebiveis'
);

-- Verifica todas as colunas na tabela
SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'contratos_recebiveis'
ORDER BY ordinal_position;

-- Verifica a estrutura completa da tabela
SELECT pg_get_tabledef('contratos_recebiveis');