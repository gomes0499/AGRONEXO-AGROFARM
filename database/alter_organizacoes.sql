-- Adiciona novos campos � tabela de organiza��es
ALTER TABLE organizacoes 
ADD COLUMN roteiro TEXT,
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Coment�rios para documentar os campos
COMMENT ON COLUMN organizacoes.roteiro IS 'Instru��es de como chegar � organiza��o (escrit�rios em fazendas)';
COMMENT ON COLUMN organizacoes.latitude IS 'Coordenada geogr�fica - latitude';
COMMENT ON COLUMN organizacoes.longitude IS 'Coordenada geogr�fica - longitude';