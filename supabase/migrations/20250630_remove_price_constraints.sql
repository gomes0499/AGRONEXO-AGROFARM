-- Remove a constraint que exige que cotacoes_por_ano não seja vazio na tabela cotacoes_cambio
ALTER TABLE cotacoes_cambio
DROP CONSTRAINT IF EXISTS chk_cotacoes_por_ano_not_empty;

-- Remove constraint similar na tabela commodity_price_projections se existir
ALTER TABLE commodity_price_projections
DROP CONSTRAINT IF EXISTS chk_precos_por_ano_not_empty;

-- Comentário: Estas constraints estavam impedindo a criação de registros com campos vazios
-- Removemos para permitir que o sistema funcione corretamente com dados vazios inicialmente
-- Os valores serão preenchidos conforme necessário pela aplicação