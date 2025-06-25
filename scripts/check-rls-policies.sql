-- Verificar políticas RLS na tabela propriedades
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'propriedades'
ORDER BY policyname;

-- Verificar se RLS está habilitado na tabela
SELECT 
    relname as table_name,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_class
WHERE relname = 'propriedades';

-- Verificar quantidade de registros na tabela
SELECT COUNT(*) as total_propriedades FROM propriedades;

-- Verificar se há propriedades com organizacao_id NULL
SELECT COUNT(*) as propriedades_sem_org FROM propriedades WHERE organizacao_id IS NULL;

-- Verificar primeiras 5 propriedades
SELECT id, nome, organizacao_id, tipo FROM propriedades LIMIT 5;