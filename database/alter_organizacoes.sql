-- Adiciona novos campos à tabela de organizações
ALTER TABLE organizacoes 
ADD COLUMN roteiro TEXT,
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Comentários para documentar os campos
COMMENT ON COLUMN organizacoes.roteiro IS 'Instruções de como chegar à organização (escritórios em fazendas)';
COMMENT ON COLUMN organizacoes.latitude IS 'Coordenada geográfica - latitude';
COMMENT ON COLUMN organizacoes.longitude IS 'Coordenada geográfica - longitude';