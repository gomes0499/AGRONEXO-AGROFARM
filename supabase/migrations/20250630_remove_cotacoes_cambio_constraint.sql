-- Remove a constraint que exige que cotacoes_por_ano não seja vazio
ALTER TABLE cotacoes_cambio
DROP CONSTRAINT IF EXISTS chk_cotacoes_por_ano_not_empty;

-- Comentário: Esta constraint estava impedindo a criação de registros com cotacoes_por_ano vazio
-- Removemos para permitir que o sistema funcione corretamente com dados vazios inicialmente